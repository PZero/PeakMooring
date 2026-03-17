import * as React from 'react';
import { supabase } from '../lib/supabase';
import { Clock, LogOut } from 'lucide-react';

function PendingApproval() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="glass-card max-w-md w-full text-center p-8">
        <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-6">
          <Clock className="text-yellow-500" size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-4">In attesa di approvazione</h2>
        
        <p className="text-gray-400 mb-8 leading-relaxed">
          Il tuo account è stato creato con successo, ma deve essere approvato da un amministratore prima di poter accedere al calendario gare.
          <br /><br />
          Riceverai una notifica quando il tuo account sarà attivo.
        </p>

        <button 
          onClick={handleLogout}
          className="btn btn-outline w-full flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Esci
        </button>
      </div>
    </div>
  );
}

export default PendingApproval;
