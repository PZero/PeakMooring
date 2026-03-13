import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Ship, List, Plus, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';

interface MooringRequest {
  id: string;
  user_id: string;
  boat_length: number;
  fiscal_code: string;
  phone: string;
  status: 'waiting' | 'pending_confirmation' | 'confirmed' | 'rejected';
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

function UserDashboard({ session }: { session: any }) {
  const [requests, setRequests] = useState<MooringRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    boat_length: '',
    fiscal_code: '',
    phone: ''
  });

  const fetchRequests = async () => {
    setLoading(true);
    // Fetch all requests for the waiting list
    // We'll join with profiles to get names for masking
    const { data, error } = await supabase
      .from('mooring_requests')
      .select('*, profiles(first_name, last_name)')
      .order('created_at', { ascending: true });

    if (data) setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
    initOneSignal();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('mooring_requests').insert([
      {
        user_id: session.user.id,
        boat_length: parseFloat(formData.boat_length),
        fiscal_code: formData.fiscal_code,
        phone: formData.phone,
        status: 'waiting'
      }
    ]);

    if (!error) {
      setShowForm(false);
      setFormData({ boat_length: '', fiscal_code: '', phone: '' });
      fetchRequests();
    }
  };

  const deleteRequest = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questa richiesta?')) {
      const { error } = await supabase.from('mooring_requests').delete().eq('id', id);
      if (!error) fetchRequests();
    }
  };

  const updateStatus = async (id: string, newStatus: 'confirmed' | 'rejected') => {
    let updateData: any = { status: newStatus };
    
    // If rejected, the user goes to the end of the queue (update created_at)
    if (newStatus === 'rejected') {
      updateData.created_at = new Date().toISOString();
      alert('Hai rifiutato la proposta. La tua richiesta è stata spostata in fondo alla graduatoria.');
    } else {
      alert('Congratulazioni! Hai confermato il posto barca. Verrai contattato dall\'amministratore.');
    }

    const { error } = await supabase.from('mooring_requests').update(updateData).eq('id', id);
    if (!error) fetchRequests();
  };

  const maskData = (value: string, isLoggedUser: boolean) => {
    if (isLoggedUser) return value;
    if (!value) return '';
    return value.substring(0, 3) + '********';
  };

  const truncateName = (first: string, last: string, isLoggedUser: boolean) => {
    if (isLoggedUser) return `${first} ${last}`;
    return `${maskData(first, false)} ${maskData(last, false)}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return <Clock className="text-yellow-500" size={18} />;
      case 'pending_confirmation': return <Plus className="text-blue-500 animate-pulse" size={18} />;
      case 'confirmed': return <CheckCircle className="text-green-500" size={18} />;
      case 'rejected': return <XCircle className="text-red-500" size={18} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-bg" />
      
      <header className="container py-6 flex justify-between items-center">
        <h1 className="logo">PeakMooring</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-sm text-gray-400 underline">Logout</button>
      </header>

      <main className="container">
        {/* My Current Status */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Le tue Richieste</h2>
            {!showForm && (
              <button 
                onClick={() => setShowForm(true)}
                className="btn btn-primary flex items-center gap-2 text-sm py-2"
              >
                <Plus size={16} /> Nuova Richiesta
              </button>
            )}
          </div>

          {showForm && (
            <div className="glass-card p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Dati Imbarcazione</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Lunghezza Barca (m)</label>
                    <input 
                      type="number" step="0.1" required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                      value={formData.boat_length}
                      onChange={e => setFormData({...formData, boat_length: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Codice Fiscale</label>
                    <input 
                      type="text" required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                      value={formData.fiscal_code}
                      onChange={e => setFormData({...formData, fiscal_code: e.target.value.toUpperCase()})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-400 mb-1">Numero di Telefono</label>
                    <input 
                      type="tel" required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary flex-1">Invia Richiesta</button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">Annulla</button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {requests.filter(r => r.user_id === session.user.id).map(r => (
              <div key={r.id} className="glass-card p-4 flex justify-between items-center border-l-4 border-blue-500">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(r.status)}
                    <span className="font-bold capitalize">{r.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm text-gray-400">{r.boat_length} metri • {r.fiscal_code}</p>
                  
                  {r.status === 'pending_confirmation' && (
                    <div className="mt-4 flex gap-2">
                      <button 
                        onClick={() => updateStatus(r.id, 'confirmed')}
                        className="btn btn-primary py-2 px-4 text-xs flex items-center gap-1"
                      >
                        <CheckCircle size={14} /> Accetta Posto
                      </button>
                      <button 
                        onClick={() => updateStatus(r.id, 'rejected')}
                        className="btn btn-outline py-2 px-4 text-xs flex items-center gap-1"
                      >
                        <XCircle size={14} /> Rifiuta
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={() => deleteRequest(r.id)} className="p-2 text-gray-500 hover:text-red-400">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {requests.filter(r => r.user_id === session.user.id).length === 0 && !showForm && (
              <p className="text-center py-8 text-gray-500 italic">Nessuna richiesta attiva.</p>
            )}
          </div>
        </section>

        {/* Global FIFO Waiting List */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <List size={20} className="text-blue-500" />
            Graduatoria Generale (FIFO)
          </h2>
          <div className="glass-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Richiedente</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Metri</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {requests.map((r, index) => {
                    const isMine = r.user_id === session.user.id;
                    return (
                      <tr key={r.id} className={isMine ? 'bg-blue-500/10' : ''}>
                        <td className="px-6 py-4 font-mono text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium">
                            {truncateName(r.profiles?.first_name || '', r.profiles?.last_name || '', isMine)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {maskData(r.fiscal_code, isMine)}
                          </div>
                        </td>
                        <td className="px-6 py-4">{r.boat_length}m</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            {getStatusIcon(r.status)}
                            <span className="hidden sm:inline capitalize">{r.status.replace('_', ' ')}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {loading && (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-500">Caricamento graduatoria...</td>
                    </tr>
                  )}
                  {!loading && requests.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-500">Graduatoria vuota.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default UserDashboard;
