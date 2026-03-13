import { Anchor, Ship, Shield, List } from 'lucide-react';

function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen">
      <div className="gradient-bg" />
      
      <header className="container">
        <nav>
          <div className="logo flex items-center gap-2">
            <Anchor className="text-blue-500" />
            <span>PeakMooring</span>
          </div>
          <button onClick={onLogin} className="btn btn-outline">
            Accedi
          </button>
        </nav>
      </header>

      <main className="container">
        <section className="hero">
          <h1>Gestione Ormeggi <br /> <span style={{color: 'var(--primary)'}}>Semplificata.</span></h1>
          <p>
            La soluzione definitiva per le Marine moderne. Gestisci la tua richiesta di posto barca in modo trasparente e immediato.
          </p>
          <div className="hero-btns">
            <button onClick={onLogin} className="btn btn-primary px-8 py-4 text-lg">
              Inizia Ora
            </button>
            <a href="#info" className="btn btn-outline px-8 py-4 text-lg">
              Scopri di più
            </a>
          </div>
        </section>

        <section id="info" className="features">
          <div className="feature-card">
            <List className="text-blue-400 mb-4" size={32} />
            <h3>Graduatoria FIFO</h3>
            <p>Trasparenza totale. Verifica la tua posizione in tempo reale con il nostro sistema First-In-First-Out.</p>
          </div>
          <div className="feature-card">
            <Ship className="text-blue-400 mb-4" size={32} />
            <h3>Gestione Facile</h3>
            <p>Carica i dati della tua imbarcazione e ricevi notifiche immediate non appena un posto è disponibile.</p>
          </div>
          <div className="feature-card">
            <Shield className="text-blue-400 mb-4" size={32} />
            <h3>Privacy Garantita</h3>
            <p>Dati sensibili criptati e oscurati. Solo tu e l'amministratore potete vedere i tuoi dettagli completi.</p>
          </div>
        </section>

        <div className="glass-card text-center my-20">
          <h2 className="text-3xl font-bold mb-6">Come accreditarsi?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold mb-4">1</div>
              <p className="text-gray-300">Crea un account tramite Email, Google o Facebook in pochi secondi.</p>
            </div>
            <div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold mb-4">2</div>
              <p className="text-gray-300">Inserisci i dati della tua barca e le tue generalità per la graduatoria.</p>
            </div>
            <div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold mb-4">3</div>
              <p className="text-gray-300">Attendi la notifica di assegnazione e conferma il tuo interesse.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="container py-12 text-center text-gray-500 text-sm border-t border-white/10 mt-20">
        © 2024 PeakMooring - Marina Management System
      </footer>
    </div>
  );
}

export default LandingPage;
