import * as React from 'react';
import { supabase } from '../lib/supabase';
import { Users, CheckCircle, XCircle, Clock, LogOut, Calendar } from 'lucide-react';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

function AdminPanel({ onNavigateToCalendar }: { onNavigateToCalendar: () => void }) {
  const [users, setUsers] = React.useState<Profile[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setUsers(data as Profile[]);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (userId: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', userId);
      
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } else {
      console.error("Error updating status:", error);
      alert("Errore durante l'aggiornamento dello stato");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const pendingUsers = users.filter(u => u.status === 'pending');
  const otherUsers = users.filter(u => u.status !== 'pending');

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Users className="text-blue-500" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Pannello Amministratore</h1>
              <p className="text-gray-400">Gestione Utenze e Permessi</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onNavigateToCalendar}
              className="btn btn-primary flex items-center gap-2"
            >
              <Calendar size={18} />
              Vai al Calendario
            </button>
            <button 
              onClick={handleLogout}
              className="btn btn-outline flex items-center gap-2"
            >
              <LogOut size={18} />
              Esci
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Pending Approvals Column */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="text-yellow-500" size={20} />
                In attesa di approvazione ({pendingUsers.length})
              </h2>
              
              {pendingUsers.length === 0 ? (
                <div className="glass-card p-8 text-center text-gray-400">
                  Nessun utente in attesa
                </div>
              ) : (
                pendingUsers.map(user => (
                  <div key={user.id} className="glass-card p-6 border-l-4 border-l-yellow-500">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-white text-lg">{user.first_name} {user.last_name}</h3>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleStatusChange(user.id, 'approved')}
                        className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} /> Accetta
                      </button>
                      <button 
                        onClick={() => handleStatusChange(user.id, 'rejected')}
                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle size={16} /> Rifiuta
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Managed Users Column */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="text-blue-500" size={20} />
                Utenti Gestiti ({otherUsers.length})
              </h2>
              
              <div className="glass-card overflow-hidden">
                {otherUsers.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    Nessun utente gestito
                  </div>
                ) : (
                  <ul className="divide-y divide-white/10">
                    {otherUsers.map(user => (
                      <li key={user.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div>
                          <p className="font-medium text-white">{user.first_name} {user.last_name}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                            user.status === 'approved' 
                              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {user.status === 'approved' ? 'Approvato' : 'Rifiutato'}
                          </span>
                          
                          <button 
                            onClick={() => handleStatusChange(user.id, user.status === 'approved' ? 'rejected' : 'approved')}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            title={user.status === 'approved' ? 'Revoca accesso' : 'Concedi accesso'}
                          >
                            {user.status === 'approved' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
