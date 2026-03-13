import * as React from 'react';
import { supabase } from '../lib/supabase';
import { List, Plus, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { initOneSignal, sendNotificationToUser } from '../lib/notifications';

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
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  offered_type_id?: number;
  request_preferred_types?: {
    type_id: number;
    mooring_types: MooringType;
  }[];
}

function UserDashboard({ session }: { session: any }) {
  const [requests, setRequests] = React.useState<MooringRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    boat_length: '',
    fiscal_code: '',
    phone: ''
  });
  const [step, setStep] = React.useState(1);
  const [compatibleTypes, setCompatibleTypes] = React.useState<MooringType[]>([]);
  const [selectedTypes, setSelectedTypes] = React.useState<number[]>([]);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('mooring_requests')
      .select('*, profiles(first_name, last_name, email), request_preferred_types(type_id, mooring_types(*))')
      .order('created_at', { ascending: true });

    if (data) {
      setRequests(data as unknown as MooringRequest[]);
      const myRequests = data.filter((r: any) => r.user_id === session.user.id);
      if (myRequests.length === 0) {
        setShowForm(true);
      }
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchRequests();
    initOneSignal();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // 1. Find compatible types
    const length = parseFloat(formData.boat_length);
    const { data: types, error: typeError } = await supabase
      .from('mooring_types')
      .select('*')
      .lte('min_length', length)
      .gte('max_length', length);

    if (typeError) {
      alert('Errore nel recupero delle tipologie: ' + typeError.message);
      setLoading(false);
      return;
    }

    if (!types || types.length === 0) {
      alert('Spiacenti, non abbiamo posti barca compatibili con questa lunghezza (' + length + 'm).');
      setLoading(false);
      return;
    }

    if (types.length === 1) {
      // Auto-submit if only one type matches
      await performFinalSubmit([types[0].id]);
    } else {
      // Show selection step
      setCompatibleTypes(types as MooringType[]);
      setSelectedTypes([]);
      setStep(2);
      setLoading(false);
    }
  };

  const performFinalSubmit = async (typeIds: number[]) => {
    setLoading(true);
    // 1. Insert Request
    const { data: reqData, error: reqError } = await supabase
      .from('mooring_requests')
      .insert([
        {
          user_id: session.user.id,
          boat_length: parseFloat(formData.boat_length),
          fiscal_code: formData.fiscal_code,
          phone: formData.phone,
          status: 'waiting'
        }
      ])
      .select()
      .single();

    if (reqError) {
      alert('Errore nell\'invio della richiesta: ' + reqError.message);
      setLoading(false);
      return;
    }

    // 2. Insert Junction records
    const junctionData = typeIds.map(typeId => ({
      request_id: reqData.id,
      type_id: typeId
    }));

    const { error: juncError } = await supabase
      .from('request_preferred_types')
      .insert(junctionData);

    if (juncError) {
      alert('Errore nel salvataggio delle preferenze: ' + juncError.message);
    } else {
      setShowForm(false);
      setStep(1);
      setFormData({ boat_length: '', fiscal_code: '', phone: '' });
      fetchRequests();
    }
    setLoading(false);
  };

  const deleteRequest = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questa richiesta?')) {
      const { error } = await supabase.from('mooring_requests').delete().eq('id', id);
      if (!error) fetchRequests();
    }
  };

  const updateStatus = async (id: string, newStatus: 'confirmed' | 'rejected') => {
    let updateData: any = { status: newStatus };
    const currentRequest = requests.find(r => r.id === id);
    
    // If rejected, the user goes to the end of the queue (update created_at)
    if (newStatus === 'rejected') {
      updateData.status = 'waiting';
      updateData.created_at = new Date().toISOString();
      updateData.offered_type_id = null; // Clear the offer
      alert('Hai rifiutato la proposta. La tua richiesta è stata spostata in fondo alla graduatoria.');
    } else {
      alert('Congratulazioni! Hai confermato il posto barca. Verrai contattato dall\'amministratore.');
    }

    const { error } = await supabase.from('mooring_requests').update(updateData).eq('id', id);
    
    if (!error) {
      if (newStatus === 'rejected' && currentRequest?.offered_type_id) {
        await handleAutomaticReassignment(currentRequest.offered_type_id);
      }
      fetchRequests();
    }
  };

  const handleAutomaticReassignment = async (typeId: number) => {
    // 1. Fetch all requests in waiting status
    const { data: waitingRequests } = await supabase
      .from('mooring_requests')
      .select('*, profiles(first_name, last_name, email), request_preferred_types!inner(type_id)')
      .eq('status', 'waiting')
      .eq('request_preferred_types.type_id', typeId)
      .order('created_at', { ascending: true });

    if (waitingRequests && waitingRequests.length > 0) {
      const nextRequest = waitingRequests[0];
      
      // 2. Propose to the next compatible user
      const { error } = await supabase
        .from('mooring_requests')
        .update({ 
          status: 'pending_confirmation',
          offered_type_id: typeId 
        })
        .eq('id', nextRequest.id);

      if (!error) {
        // 3. Notify the new candidate
        const typeLabel = nextRequest.request_preferred_types?.find((pt: any) => pt.type_id === typeId)?.mooring_types?.label || 'un posto barca';
        await sendNotificationToUser(
          nextRequest.profiles.email,
          `Ottime notizie! Un posto barca compatibile (${typeLabel}) si è liberato. Accedi al portale per confermare la tua richiesta.`
        );
        console.log('Automatic reassignment successful for request:', nextRequest.id);
      }
    }
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
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">
                  {step === 1 ? '1. Dati Richiesta' : '2. Selezione Ormeggi Compatibili'}
                </h3>
                <div className="flex gap-1">
                  <div className={`h-1.5 w-10 rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-gray-700'}`} />
                  <div className={`h-1.5 w-10 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-gray-700'}`} />
                </div>
              </div>

              {step === 1 ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Lunghezza Barca (m)</label>
                      <input 
                        type="number" step="0.1" required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 transition-colors"
                        value={formData.boat_length}
                        onChange={e => setFormData({...formData, boat_length: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Codice Fiscale</label>
                      <input 
                        type="text" required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 transition-colors"
                        value={formData.fiscal_code}
                        onChange={e => setFormData({...formData, fiscal_code: e.target.value.toUpperCase()})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-400 mb-1">Numero di Telefono</label>
                      <input 
                        type="tel" required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 transition-colors"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button type="submit" disabled={loading} className="btn btn-primary flex-1 py-4">
                      {loading ? 'Verifica compatibilità...' : 'Verifica Posti Disponibili'}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline py-4">Annulla</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <p className="text-gray-400 text-sm">Abbiamo trovato più opzioni compatibili con la tua barca ({formData.boat_length}m). Seleziona i tipi di ormeggio per cui desideri metterti in graduatoria:</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {compatibleTypes.map(t => {
                      const isSelected = selectedTypes.includes(t.id);
                      return (
                        <div 
                          key={t.id}
                          onClick={() => {
                            if (isSelected) setSelectedTypes(selectedTypes.filter(id => id !== t.id));
                            else setSelectedTypes([...selectedTypes, t.id]);
                          }}
                          className={`cursor-pointer glass-card p-4 transition-all hover:translate-y-[-2px] ${isSelected ? 'border-blue-500 bg-blue-500/10' : 'hover:border-white/20'}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-lg">{t.label}</h4>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-600'}`}>
                              {isSelected && <CheckCircle size={12} className="text-white" />}
                            </div>
                          </div>
                          <div className="text-blue-400 text-sm font-medium mb-1">{t.position}</div>
                          <div className="flex justify-between items-end mt-4">
                            <div className="text-gray-500 text-xs">Capacità: {t.min_length}-{t.max_length}m</div>
                            <div className="text-lg font-bold">€{t.price}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-white/5">
                    <button 
                      onClick={() => performFinalSubmit(selectedTypes)} 
                      disabled={selectedTypes.length === 0 || loading}
                      className="btn btn-primary flex-1 py-4 disabled:opacity-50"
                    >
                      {loading ? 'Invio...' : 'Conferma Inserimento in Graduatoria'}
                    </button>
                    <button type="button" onClick={() => setStep(1)} className="btn btn-outline py-4">Indietro</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            {requests.filter((r: MooringRequest) => r.user_id === session.user.id).map((r: MooringRequest) => (
              <div key={r.id} className="glass-card p-4 flex justify-between items-center border-l-4 border-blue-500">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(r.status)}
                    <span className="font-bold capitalize">{r.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm text-gray-400">{r.boat_length} metri • {r.fiscal_code}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.request_preferred_types?.map(pt => (
                      <span key={pt.type_id} className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                        {pt.mooring_types.label} ({pt.mooring_types.position})
                      </span>
                    ))}
                  </div>
                  
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
                  {(requests as any[]).flatMap((r, index) => {
                    const isMine = r.user_id === session.user.id;
                    const preferredTypes = r.request_preferred_types || [];
                    
                    if (preferredTypes.length === 0) {
                      return [{ ...r, pt: null, globalIndex: index + 1, isMine }];
                    }
                    
                    return preferredTypes.map((pt: any) => ({
                      ...r,
                      pt: pt,
                      globalIndex: index + 1,
                      isMine
                    }));
                  }).map((row: any) => (
                    <tr key={`${row.id}-${row.pt?.type_id || 'none'}`} className={row.isMine ? 'bg-blue-500/10' : ''}>
                      <td className="px-6 py-4 font-mono text-gray-500">{row.globalIndex}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium">
                          {truncateName(row.profiles?.first_name || '', row.profiles?.last_name || '', row.isMine)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {maskData(row.fiscal_code, row.isMine)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{row.boat_length}m</div>
                        {row.pt ? (
                          <div className="mt-1">
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 whitespace-nowrap">
                              {row.pt.mooring_types.label} (€{row.pt.mooring_types.price})
                            </span>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 italic">Genérico</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          {getStatusIcon(row.status)}
                          <span className="hidden sm:inline capitalize">{row.status.replace('_', ' ')}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
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
