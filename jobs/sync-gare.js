import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import * as cheerio from 'cheerio';

// 1. Inizializzazione Supabase (usando la Service Role Key per bypassare RLS nel job di background)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Parametri Supabase mancanti! Configura SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Inizializzazione Gemini AI
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error('Chiave API Gemini mancante! Configura GEMINI_API_KEY.');
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(geminiApiKey);
// Usiamo gemini-1.5-flash perché è veloce, precisissimo sui testi lunghi e ha un ottimo piano gratuito
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function main() {
  console.log('==================================================');
  console.log('Avvio sincronizzazione intelligente gare (Cron Job)');
  console.log('==================================================');

  // Recupero la data di oggi in formato stringa
  const today = new Date().toISOString().split('T')[0];
  
  // 3. Estraggo le gare future che hanno un link al sito
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .not('event_link', 'is', null)
    .not('event_link', 'eq', '')
    .gte('date', today);

  if (error) {
    console.error('Errore durante la lettura degli eventi da Supabase:', error);
    process.exit(1);
  }

  console.log(`Trovate ${events.length} gare future complete di link.`);

  for (const event of events) {
    console.log(`\n-> Analizzo Gara: ${event.name} (${event.event_link})`);
    
    try {
      // 4. Scarico la pagina web collegata
      console.log('   - Scarico il codice HTML della pagina...');
      const response = await axios.get(event.event_link, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Node.js; PeakMooring/AutoSync)',
          'Accept': 'text/html'
        },
        timeout: 10000 // 10 secondi massimo
      });
      
      const html = response.data;
      const $ = cheerio.load(html);
      
      // Pulizia HTML: estraiamo solo il testo per non consumare troppi "token" in Gemini
      const pageText = $('body').text().replace(/\s+/g, ' ').slice(0, 20000); // limite prudenziale
      
      // Estraiamo a mano tutti i link dalla pagina (importantissimi per trovare il PDF della locandina)
      const links = [];
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim() || 'Link';
        if (href && (
            href.toLowerCase().includes('.pdf') || 
            text.toLowerCase().includes('bando') || 
            text.toLowerCase().includes('locandina') ||
            text.toLowerCase().includes('regolamento')
        )) {
          // Ricostruiamo link relativi in assoluti (se necessario, in modo grezzo)
          const fullHref = href.startsWith('http') ? href : new URL(href, event.event_link).href;
          links.push(`${text}: ${fullHref}`);
        }
      });

      const contentToAnalyze = `
        TESTO DELLA PAGINA:
        ${pageText}

        LINK IMPORTANTI TROVATI NELLA PAGINA:
        ${links.join('\n')}
      `;

      // 5. Interrogo Gemini AI
      console.log('   - Invio il testo a Gemini AI per estrarre la saggezza...');
      const prompt = `
        Sei il "Data Extractor" di un'app per l'organizzazione di gare di nuoto in acque libere.
        Il tuo compito è analizzare il testo di una pagina web di una gara e trovare i seguenti dati:
        1. La data ESATTA di scadenza delle iscrizioni.
        2. Il link al documento PDF (bando, regolamento, notice of race o locandina).

        Testo e link della pagina:
        ${contentToAnalyze}

        REGOLE:
        - Rispondi ESCLUSIVAMENTE con un oggetto JSON valido, senza formattazione markdown (tipo \`\`\`json).
        - La chiave 'registration_deadline' deve contenere la data convertita TASSATIVAMENTE nel formato "YYYY-MM-DD". Se fai fatica a capire l'anno, deduci che è l'anno in corso o quello relativo alla gara. Se non trovi la scadenza scrivi null.
        - La chiave 'flyer_link' deve contenere l'URL esatto al regolamento. Se non lo trovi scrivi null.
        
        Esempio di output pulito:
        {
          "registration_deadline": "2024-05-15",
          "flyer_link": "https://www.sitogara.com/bando.pdf"
        }
      `;

      const result = await model.generateContent(prompt);
      let responseText = result.response.text().trim();
      
      // Pulizia: a volte i modelli aggiungono comunque i blocchi markdown nonostante le regole
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

      const extractedData = JSON.parse(responseText);
      console.log('   - Risultato Gemini:', extractedData);

      // 6. Preparo gli aggiornamenti per il DB
      const updates = {};
      let hasUpdates = false;

      // Aggiorniamo la data scadenza solo se Gemini ne ha trovata una valida diversa dall'attuale
      if (extractedData.registration_deadline && extractedData.registration_deadline !== event.registration_deadline) {
        updates.registration_deadline = extractedData.registration_deadline;
        hasUpdates = true;
      }

      // Visto che non hai una colonna "locandina" dedicata nel DB, lo accodiamo nelle "notes" in modo intelligente
      if (extractedData.flyer_link && (!event.notes || !event.notes.includes(extractedData.flyer_link))) {
        const appendedNote = `🔗 Bando / Locandina (Trovato dall'IA): ${extractedData.flyer_link}`;
        updates.notes = event.notes ? `${event.notes}\n\n${appendedNote}` : appendedNote;
        hasUpdates = true;
      }

      // 7. Salvo in Supabase se ci sono grosse novità
      if (hasUpdates) {
        console.log('   - Dati aggiornati! Eseguo il salvataggio su Supabase...');
        const { error: updateError } = await supabase
          .from('events')
          .update(updates)
          .eq('id', event.id);
        
        if (updateError) {
          console.error('     [X] Errore di connessione Supabase:', updateError.message);
        } else {
          console.log('     [V] Salvataggio completato correttamente!');
        }
      } else {
        console.log('   - Nessun aggiornamento necessario (dati già corretti o niente di nuovo trovato).');
      }

    } catch (err) {
      console.error(`   - [X] Errore critico durante l'elaborazione di ${event.name}:`, err.message);
    }
  }

  console.log('\n==================================================');
  console.log('Sincronizzazione Terminata.');
  console.log('==================================================');
}

main().catch(err => {
  console.error("Errore fatale dell'eseguibile:", err);
  process.exit(1);
});
