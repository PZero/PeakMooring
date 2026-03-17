import * as React from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Clock, LogOut, Calendar, Edit2 } from 'lucide-react';
import ProfileModal from './ProfileModal';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  status: 'pending' | 'approved' | 'rejected';
  is_admin: boolean;
  created_at: string;
}

function AdminPanel({ onNavigateToCalendar }: { onNavigateToCalendar: () => void }) {
  const [users, setUsers] = React.useState<Profile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [forgetMe, setForgetMe] = React.useState(false);
  const [showProfile, setShowProfile] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [userProfile, setUserProfile] = React.useState<{ first_name: string | null, last_name: string | null } | null>(null);

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
    
    // Fetch current user profile for footer
    const fetchCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
        const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', session.user.id).single();
        if (profile) setUserProfile(profile);
      }
    };
    fetchCurrentUser();

    // Set up Realtime subscription
    const channel = supabase
      .channel('admin_profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Change received!', payload);
          // Instead of fetching everything again, we can intelligently update the local state
          if (payload.eventType === 'INSERT') {
            setUsers(prev => [payload.new as Profile, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setUsers(prev => prev.map(u => u.id === payload.new.id ? { ...u, ...(payload.new as Profile) } : u));
          } else if (payload.eventType === 'DELETE') {
            setUsers(prev => prev.filter(u => u.id === payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusChange = async (userId: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', userId);
      
    if (error) {
      console.error("Error updating status:", error);
      alert("Errore durante l'aggiornamento dello stato");
    }
    // State will be updated via Realtime channel
  };

  const handleAdminToggle = async (userId: string, isAdmin: boolean) => {
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: isAdmin } : u));

    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: isAdmin })
      .eq('id', userId);
      
    if (error) {
      console.error("Error updating admin status:", error);
      alert("Errore durante l'aggiornamento dei permessi admin");
      // Rollback on error
      fetchUsers();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleEnhancedLogout = async () => {
    if (forgetMe) {
      localStorage.removeItem('peak_mooring_email');
      localStorage.setItem('peak_mooring_remember', 'false');
    }
    await handleLogout();
  };

  const pendingUsers = users.filter(u => u.status === 'pending');
  const approvedUsers = users.filter(u => u.status === 'approved');
  const rejectedUsers = users.filter(u => u.status === 'rejected');

  return (
    <div className="min-h-screen bg-gray-950 px-1 md:px-8 pt-24 pb-20">
      <div className="max-w-6xl mx-auto space-y-6 w-full">
        {/* Fixed Top Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between p-3 md:px-8 md:py-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-white/10 overflow-hidden shrink-0">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover scale-150" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg md:text-2xl font-black text-white tracking-tighter uppercase leading-none">Admin Panel</h1>
                <p className="text-gray-400 text-[8px] md:text-xs uppercase tracking-widest font-medium mt-1">Gestione Utenze e Permessi</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={onNavigateToCalendar}
                className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 py-1.5 px-3 md:py-2 md:px-4 rounded-lg shadow-lg shadow-blue-500/20 transition-all"
              >
                <Calendar size={16} />
                <span className="font-bold text-xs md:text-sm">Torna a Gare</span>
              </button>
            </div>
          </div>
        </div>

        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="glass-card w-full max-w-sm p-8 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-white mb-2">Conferma Logout</h3>
              <p className="text-gray-400 mb-8">Sei sicuro di voler uscire dalla sessione?</p>
              
              <div 
                className="flex items-center gap-3 mb-8 p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer group hover:bg-white/10 transition-all"
                onClick={() => setForgetMe(!forgetMe)}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${forgetMe ? 'bg-red-500 border-red-500' : 'bg-white/5 border-white/10'}`}>
                  {forgetMe && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Dimenticami su questo dispositivo</span>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 btn btn-outline py-3">Annulla</button>
                <button onClick={handleEnhancedLogout} className="flex-1 btn btn-primary bg-red-600 hover:bg-red-500 border-red-600 hover:border-red-500 py-3 shadow-lg shadow-red-600/20">Esci</button>
              </div>
            </div>
          </div>
        )}

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
                In attesa ({pendingUsers.length})
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
                        <h3 className="font-semibold text-white text-lg truncate max-w-[200px] sm:max-w-none">
                          {user.first_name} {user.last_name || '(Cognome mancante)'}
                        </h3>
                        <p className="text-gray-400 text-sm truncate max-w-[200px] sm:max-w-none">{user.email}</p>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">
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

            {/* Approved and Rejected Columns */}
            <div className="space-y-8">
              
              {/* Approved Users */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={20} />
                  Approvati ({approvedUsers.length})
                </h2>
                
                <div className="glass-card overflow-hidden">
                  {approvedUsers.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      Nessun utente approvato
                    </div>
                  ) : (
                    <ul className="divide-y divide-white/10">
                      {approvedUsers.map(user => (
                        <li key={user.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{user.first_name} {user.last_name}</p>
                            <p className="text-sm text-gray-400 truncate">{user.email}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {/* Delegation UI */}
                            <label className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition-colors group">
                              <input 
                                type="checkbox" 
                                checked={user.is_admin}
                                onChange={(e) => handleAdminToggle(user.id, e.target.checked)}
                                className="w-4 h-4 rounded border-white/10 bg-gray-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-950"
                              />
                              <span className="text-xs font-bold text-blue-400 group-hover:text-blue-300">ADMIN</span>
                            </label>
                            
                            <button 
                              onClick={() => handleStatusChange(user.id, 'rejected')}
                              className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                              title="Revoca accesso"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Rejected Users */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <XCircle className="text-red-500" size={20} />
                  Rifiutati ({rejectedUsers.length})
                </h2>
                
                <div className="glass-card overflow-hidden opacity-75">
                  {rejectedUsers.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      Nessun utente rifiutato
                    </div>
                  ) : (
                    <ul className="divide-y divide-white/10">
                      {rejectedUsers.map(user => (
                        <li key={user.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-300 truncate">{user.first_name} {user.last_name}</p>
                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                          </div>
                          <button 
                            onClick={() => handleStatusChange(user.id, 'approved')}
                            className="p-2 hover:bg-green-500/10 rounded-lg text-gray-500 hover:text-green-400 transition-colors"
                            title="Riammetti utente"
                          >
                            <CheckCircle size={18} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

      {/* Fixed Bottom Profile Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-3 items-center p-1 md:px-8 md:py-2">
          {/* Left Spacer (Maintains centering) */}
          <div />

          {/* Center: Profile Info */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white border border-white/10 shadow-inner shrink-0">
              <span className="text-[12px] font-black uppercase">{userProfile?.first_name?.charAt(0) || 'A'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-white whitespace-nowrap">{userProfile?.first_name || 'Admin'}</span>
              <button 
                onClick={() => setShowProfile(true)}
                className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:text-blue-400 hover:bg-white/10 transition-all active:scale-95"
                title="Modifica Profilo"
              >
                <Edit2 size={12} />
              </button>
            </div>
          </div>

          {/* Right: Logout */}
          <div className="flex justify-end pr-2 md:pr-0">
            <button 
              onClick={() => setShowLogoutConfirm(true)} 
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:text-red-400 hover:bg-red-500/20 transition-all active:scale-95 shrink-0"
              title="Esci dalla sessione"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {showProfile && currentUserId && (
        <ProfileModal 
          userId={currentUserId}
          onClose={() => setShowProfile(false)}
          onUpdated={async () => {
            const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', currentUserId).single();
            if (profile) setUserProfile(profile);
          }}
        />
      )}

    </div>
  );
}

export default AdminPanel;
