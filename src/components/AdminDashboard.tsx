import * as React from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Ship, Plus, AlertCircle, Trash2, List } from 'lucide-react';
import { sendNotificationToUser } from '../lib/notifications';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface MooringType {
  id: number;
  label: string;
  min_length: number;
  max_length: number;
  position: string;
  price: number;
}

interface MooringRequest {
  id: string;
  user_id: string;
  boat_length: number;
  fiscal_code: string;
  phone: string;
  status: 'waiting' | 'pending_confirmation' | 'confirmed' | 'rejected';
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = React.useState<'requests' | 'types' | 'settings'>('requests');
  const [requests, setRequests] = React.useState<MooringRequest[]>([]);
  const [types, setTypes] = React.useState<MooringType[]>([]);
  const [adminProfile, setAdminProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Form states
  const [newType, setNewType] = React.useState({ 
    label: '', 
    min_length: '', 
    max_length: '',
    position: '',
    price: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, typeRes, profRes] = await Promise.all([
        supabase.from('mooring_requests').select('*, profiles(first_name, last_name, email)').order('created_at', { ascending: true }),
        supabase.from('mooring_types').select('*').order('min_length', { ascending: true }),
        supabase.auth.getUser()
      ]);

      if (reqRes.error) console.error('Error fetching requests:', reqRes.error);
      if (typeRes.error) console.error('Error fetching types:', typeRes.error);

      if (reqRes.data) setRequests(reqRes.data as unknown as MooringRequest[]);
      if (typeRes.data) setTypes(typeRes.data as MooringType[]);
      
      if (profRes.data.user) {
        const { data: profile, error: profError } = await supabase.from('profiles').select('*').eq('id', profRes.data.user.id).single();
        if (profError) console.error('Error fetching admin profile:', profError);
        if (profile) setAdminProfile(profile as Profile);
      }
    } catch (err) {
      console.error('Unexpected error in fetchData:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('mooring_types').insert([
      { 
        label: newType.label, 
        min_length: parseFloat(newType.min_length), 
        max_length: parseFloat(newType.max_length),
        position: newType.position,
        price: parseFloat(newType.price)
      }
    ]);
    
    if (error) {
      console.error('Error adding type:', error);
      alert('Errore durante l\'aggiunta: ' + error.message);
      setLoading(false);
    } else {
      setNewType({ label: '', min_length: '', max_length: '', position: '', price: '' });
      await fetchData();
    }
  };

  const deleteType = async (id: number) => {
    const { error } = await supabase.from('mooring_types').delete().eq('id', id);
    if (!error) fetchData();
  };

  const startAssignment = async (requestId: string) => {
    const { error } = await supabase
      .from('mooring_requests')
      .update({ status: 'pending_confirmation' })
      .eq('id', requestId);
    
    if (!error) {
      // Find the request to get user email
      const req = requests.find((r: MooringRequest) => r.id === requestId);
      if (req) {
        await sendNotificationToUser(
          req.profiles.email, 
          `Ciao ${req.profiles.first_name}, un posto barca è disponibile per te! Accedi al portale per confermare.`
        );
      }
      alert('Proposta inviata all\'utente. In attesa di conferma.');
      fetchData();
    }
  };

  const getMooringTypeForLength = (length: number) => {
    const type = types.find((t: MooringType) => length >= t.min_length && length <= t.max_length);
    return type ? type.label : 'N/A';
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-white/5 p-6 flex flex-col">
        <div className="logo mb-10">PeakMooring <span className="text-xs text-blue-500 block">ADMIN PANEL</span></div>
        
        <nav className="flex-1 space-y-2 flex flex-col">
          <button 
            onClick={() => setActiveTab('requests')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'requests' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <List size={20} /> Graduatoria
          </button>
          <button 
            onClick={() => setActiveTab('types')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'types' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <Ship size={20} /> Tipologie Ormeggi
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <Settings size={20} /> Impostazioni
          </button>
        </nav>

        <button onClick={() => supabase.auth.signOut()} className="text-sm text-gray-500 hover:text-white pb-4">Logout</button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold mb-2">Graduatoria Richiedenti</h2>
                <p className="text-gray-400">Visualizzazione completa e non oscurata per l'amministrazione.</p>
              </div>
            </div>

            <div className="glass-card p-0">
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/10 text-gray-400 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-6 py-4">Posizione</th>
                    <th className="px-6 py-4">Utente</th>
                    <th className="px-6 py-4">CF / Telefono</th>
                    <th className="px-6 py-4">Lunghezza / Tipo</th>
                    <th className="px-6 py-4">Stato</th>
                    <th className="px-6 py-4">Azione</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {requests.map((r: MooringRequest, index: number) => (
                    <tr key={r.id}>
                      <td className="px-6 py-4 font-mono text-gray-500">#{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold">{r.profiles.first_name} {r.profiles.last_name}</div>
                        <div className="text-xs text-gray-500">{r.profiles.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">{r.fiscal_code}</div>
                        <div className="text-xs text-gray-500">{r.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-blue-400">{r.boat_length}m</div>
                        <div className="text-xs text-gray-500">{getMooringTypeForLength(r.boat_length)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${
                          r.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-500' :
                          r.status === 'pending_confirmation' ? 'bg-blue-500/20 text-blue-500 animate-pulse' :
                          r.status === 'confirmed' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                        }`}>
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {r.status === 'waiting' && (
                          <button 
                            onClick={() => startAssignment(r.id)}
                            className="btn btn-primary py-1 px-3 text-xs flex items-center gap-1"
                          >
                            <Plus size={14} /> Assegna
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'types' && (
          <div className="max-w-4xl space-y-10">
            <div>
              <h2 className="text-3xl font-bold mb-6">Gestione Tipologie Ormeggi</h2>
              <form onSubmit={handleAddType} className="glass-card grid grid-cols-4 gap-4 items-end">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Nome Tipologia (es. Classe A)</label>
                  <input 
                    type="text" required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                    value={newType.label}
                    onChange={e => setNewType({...newType, label: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Posizione (es. Molo Nord)</label>
                  <input 
                    type="text" required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                    value={newType.position}
                    onChange={e => setNewType({...newType, position: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Prezzo (€)</label>
                  <input 
                    type="number" step="0.01" required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                    value={newType.price}
                    onChange={e => setNewType({...newType, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Min (m)</label>
                  <input 
                    type="number" step="0.1" required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                    value={newType.min_length}
                    onChange={e => setNewType({...newType, min_length: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max (m)</label>
                  <input 
                    type="number" step="0.1" required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                    value={newType.max_length}
                    onChange={e => setNewType({...newType, max_length: e.target.value})}
                  />
                </div>
                <div className="col-span-2 mt-2">
                  <button type="submit" className="btn btn-primary w-full py-3">Aggiungi Tipologia</button>
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {types.map(t => (
                <div key={t.id} className="glass-card relative group">
                  <button 
                    onClick={() => deleteType(t.id)}
                    className="absolute top-4 right-4 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={18} />
                  </button>
                  <h3 className="text-xl font-bold mb-2">{t.label}</h3>
                  <div className="text-sm font-medium text-blue-400 mb-1">{t.position}</div>
                  <div className="flex justify-between items-end mt-4">
                    <div className="text-gray-400 text-sm">Da {t.min_length}m a {t.max_length}m</div>
                    <div className="text-xl font-bold text-white">€{t.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-3xl font-bold mb-6">Profilo Amministratore</h2>
            <div className="glass-card space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome e Cognome</label>
                <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-300">
                  {adminProfile?.first_name} {adminProfile?.last_name}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email di Contatto</label>
                <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-300">
                  {adminProfile?.email}
                </div>
              </div>
              <p className="text-xs text-gray-500 italic flex items-center gap-1">
                <AlertCircle size={12} /> I dati del profilo sono gestiti tramite le impostazioni account.
              </p>
            </div>
          </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
