import { Waves, CalendarDays, ShieldCheck, Users } from 'lucide-react';

function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen">
      <div className="gradient-bg" />
      
      <header className="container py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center transform -rotate-3">
              <Waves className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">OpenWater Regs</span>
          </div>
          <button onClick={onLogin} className="btn btn-outline border-white/20 hover:bg-white/10">
            Accedi / Registrati
          </button>
        </nav>
      </header>

      <main className="container">
        <section className="py-20 md:py-32 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            Il tuo Calendario Gare <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Open Water Swimming
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Una piattaforma collaborativa per tenere traccia di tutte le gare di nuoto in acque libere. 
            Iscriviti, attendi l'approvazione e contribuisci ad aggiornare il calendario degli eventi FIN, UISP e altri enti.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={onLogin} className="btn btn-primary px-8 py-4 text-lg w-full sm:w-auto shadow-lg shadow-blue-500/25">
              Entra nel Calendario
            </button>
            <a href="#come-funziona" className="btn btn-outline px-8 py-4 text-lg w-full sm:w-auto border-white/20 hover:bg-white/10">
              Scopri come funziona
            </a>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="glass-card p-8 group hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500/30 transition-colors">
              <CalendarDays className="text-blue-400" size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Calendario Unico</h3>
            <p className="text-gray-400 leading-relaxed">
              Tutte le gare in un'unica interfaccia ottimizzata per smartphone. Filtra per ente, controlla le scadenze e trova i link diretti per iscriverti.
            </p>
          </div>
          
          <div className="glass-card p-8 group hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-cyan-500/30 transition-colors">
              <Users className="text-cyan-400" size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Community Attiva</h3>
            <p className="text-gray-400 leading-relaxed">
              Gli utenti approvati possono aggiungere nuove gare, correggere quelle esistenti o inserire i link alle classifiche dopo l'evento.
            </p>
          </div>
          
          <div className="glass-card p-8 group hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-500/30 transition-colors">
              <ShieldCheck className="text-green-400" size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Accesso Sicuro</h3>
            <p className="text-gray-400 leading-relaxed">
              La piattaforma è protetta. Le nuove registrazioni passano per un processo di approvazione manuale per mantenere i dati affidabili.
            </p>
          </div>
        </section>

        <div id="come-funziona" className="glass-card p-8 md:p-12 mb-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="text-center mb-12 relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Come accedere alla piattaforma?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Per garantire la qualità delle informazioni, l'accesso a OpenWater Regs prevede un semplice processo di verifica in tre passaggi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            <div className="text-center md:text-left">
              <div className="w-12 h-12 bg-gray-800 border-2 border-blue-500/50 rounded-full flex items-center justify-center font-bold text-blue-400 text-xl mx-auto md:mx-0 mb-6 shadow-lg shadow-blue-500/20">
                1
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Registrati</h4>
              <p className="text-gray-400">
                Crea un account inserendo Nome, Cognome ed Email (oppure usa Google/Facebook).
              </p>
            </div>
            
            <div className="text-center md:text-left relative">
              <div className="hidden md:block absolute top-6 -left-4 w-[calc(100%+32px)] h-[2px] bg-gradient-to-r from-blue-500/50 to-transparent -z-10" />
              <div className="w-12 h-12 bg-gray-800 border-2 border-yellow-500/50 rounded-full flex items-center justify-center font-bold text-yellow-400 text-xl mx-auto md:mx-0 mb-6 shadow-lg shadow-yellow-500/20">
                2
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Attendi</h4>
              <p className="text-gray-400">
                Il tuo account sarà posto "In attesa". Un Amministratore verificherà la tua richiesta.
              </p>
            </div>
            
            <div className="text-center md:text-left relative">
              <div className="hidden md:block absolute top-6 -left-4 w-[calc(100%+32px)] h-[2px] bg-gradient-to-r from-yellow-500/50 to-transparent -z-10" />
              <div className="w-12 h-12 bg-gray-800 border-2 border-green-500/50 rounded-full flex items-center justify-center font-bold text-green-400 text-xl mx-auto md:mx-0 mb-6 shadow-lg shadow-green-500/20">
                3
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Partecipa</h4>
              <p className="text-gray-400">
                Una volta approvato, potrai consultare l'intero calendario e inserire o modificare le gare.
              </p>
            </div>
          </div>
          
          <div className="mt-12 text-center relative z-10">
            <button onClick={onLogin} className="btn btn-primary px-8 py-3">
              Inizia la registrazione
            </button>
          </div>
        </div>
      </main>

      <footer className="container py-8 text-center text-gray-500 text-sm border-t border-white/5">
        <p className="mb-2">© {new Date().getFullYear()} OpenWater Regs</p>
        <p className="text-xs text-gray-600">Calendario gare amatoriale. Non affiliato ufficialmente con FIN o UISP.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
