import * as React from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Plus, LogOut, Settings, Trash2, Edit2, ExternalLink, AlignLeft, Clock, RotateCcw, User } from 'lucide-react';

import EventForm from './EventForm';
import ProfileModal from './ProfileModal';

interface Event {
  id: string;
  name: string;
  date: string;
  organization: 'FIN' | 'UISP' | 'ALTRO';
  registration_deadline: string;
  event_link: string | null;
  distances: string | null;
  notes: string | null;
  results_link: string | null;
  created_by: string;
  status: 'active' | 'cancelled';
  updated_by: string | null;
  updater_email?: string;
  updated_at: string;
}

export default function EventsCalendar({ onNavigateToAdmin }: { onNavigateToAdmin?: () => void }) {
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [forgetMe, setForgetMe] = React.useState(false);
  
  const [showForm, setShowForm] = React.useState(false);
  const [showProfile, setShowProfile] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<Event | undefined>(undefined);
  const [userProfile, setUserProfile] = React.useState<{ first_name: string | null, last_name: string | null } | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*, profiles!events_updated_by_fkey(email)');
      
    if (!eventsError && eventsData) {
      const formattedEvents = eventsData.map((e: any) => ({
        ...e,
        updater_email: e.profiles?.email || 'Sconosciuto'
      })) as Event[];

      formattedEvents.sort((a, b) => {
        const dateA = new Date(a.registration_deadline).getTime();
        const dateB = new Date(b.registration_deadline).getTime();
        return dateA - dateB;
      });

      setEvents(formattedEvents);
    }
    setLoading(false);
  };

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUserId(session.user.id);
      const { data: profile } = await supabase.from('profiles').select('is_admin, first_name, last_name').eq('id', session.user.id).single();
      setIsAdmin(profile?.is_admin || session.user.email === 'fnicora@gmail.com');
      setUserProfile(profile || null);
    }
  };

  React.useEffect(() => {
    checkUser();
    fetchEvents();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleEnhancedLogout = async () => {
    if (forgetMe) {
      localStorage.removeItem('peak_mooring_email');
      localStorage.setItem('peak_mooring_remember', 'false');
    }
    await handleLogout();
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditingEvent(undefined);
    fetchEvents();
  };

  const handleCancelEvent = async (id: string) => {
    const { error } = await supabase
      .from('events')
      .update({ status: 'cancelled', updated_by: currentUserId })
      .eq('id', id);
      
    if (!error) fetchEvents();
    else alert('Errore durante l\'annullamento');
  };

  const handleRestoreEvent = async (id: string) => {
    const { error } = await supabase
      .from('events')
      .update({ status: 'active', updated_by: currentUserId })
      .eq('id', id);
      
    if (!error) fetchEvents();
    else alert('Errore durante il ripristino');
  };

  const handleDeletePermanent = async (id: string) => {
    if (!confirm('Eliminare definitivamente questa gara? L\'azione è irreversibile.')) return;
    
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
      
    if (!error) fetchEvents();
    else alert('Errore durante l\'eliminazione definitiva');
  };

  const getDeadlineStyle = (deadlineString: string) => {
    const deadline = new Date(deadlineString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)); 
    
    if (diffDays < 0) return 'text-gray-500 line-through';
    if (diffDays <= 10) return 'bg-red-500 animate-pulse text-white font-bold px-2 py-1 rounded';
    if (diffDays <= 20) return 'bg-yellow-500 text-gray-900 font-bold px-2 py-1 rounded';
    return 'text-gray-300';
  };

  const activeEvents = events.filter(e => e.status !== 'cancelled');
  const cancelledEvents = events.filter(e => e.status === 'cancelled');

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card p-6 md:p-8 sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Calendar className="text-blue-500" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Calendario Gare 2026</h1>
              <p className="text-blue-300/60 font-medium">Open Water Swimming Season</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isAdmin && onNavigateToAdmin && (
              <button onClick={onNavigateToAdmin} className="btn btn-outline flex items-center gap-2 py-3 px-5">
                <Settings size={18} />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
            <button 
              onClick={() => { setEditingEvent(undefined); setShowForm(true); }}
              className="btn btn-primary flex items-center gap-2 py-3 px-6 shadow-xl shadow-blue-500/20"
            >
              <Plus size={20} />
              Nuova Gara
            </button>
            
            <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block" />

            <button 
              onClick={() => setShowProfile(true)}
              className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-all font-bold"
              title="Il tuo profilo"
            >
              {userProfile?.first_name ? userProfile.first_name[0].toUpperCase() : <User size={18} />}
            </button>

            <button onClick={() => setShowLogoutConfirm(true)} className="btn btn-outline p-3 hover:bg-red-500/10 hover:text-red-400" title="Esci">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Active Events */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3 ml-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Gare Attive ({activeEvents.length})
              </h2>
              <div className="glass-card !p-0 overflow-hidden border-white/5 shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Gara / Org</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Data Gara</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Scadenza Iscrizione</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Distanze / Info</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Ultima Modifica</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Azioni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {activeEvents.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">Nessuna gara attiva</td></tr>
                      ) : (
                        activeEvents.map(event => (
                          <tr key={event.id} className="group hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-5">
                              <div className="font-bold text-white group-hover:text-blue-400">{event.name}</div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                event.organization === 'FIN' ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' :
                                event.organization === 'UISP' ? 'bg-orange-500/20 text-orange-400 border-orange-500/20' :
                                'bg-purple-500/20 text-purple-400 border-purple-500/20'
                              }`}>
                                {event.organization}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2 text-gray-300 font-bold">
                                <Calendar size={14} className="text-gray-500" />
                                {new Date(event.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm ${getDeadlineStyle(event.registration_deadline)}`}>
                                <Clock size={14} />
                                {new Date(event.registration_deadline).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="space-y-1.5">
                                {event.distances && <div className="text-xs text-gray-300">{event.distances}</div>}
                                <div className="flex gap-3">
                                  {event.event_link && <a href={event.event_link} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all" title="Sito Gara"><ExternalLink size={16} /></a>}
                                  {event.results_link && (
                                    <a href={event.results_link} target="_blank" rel="noopener noreferrer" className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 rounded-lg transition-all border border-green-500/20" title="Risultati">
                                      <div className="flex items-center gap-1.5 px-0.5">
                                        <AlignLeft size={16} />
                                        <span className="text-[10px] font-black uppercase">Risultati</span>
                                      </div>
                                    </a>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="text-[10px] text-gray-500">
                                <div>{new Date(event.updated_at).toLocaleString()}</div>
                                <div className="text-blue-400 font-bold truncate max-w-[100px]">{event.updater_email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingEvent(event); setShowForm(true); }} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"><Edit2 size={16} /></button>
                                <button onClick={() => { if(confirm('Annullare?')) handleCancelEvent(event.id); }} className="p-2 hover:bg-red-500/10 rounded-lg text-red-500/60 hover:text-red-400"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Cancelled Events */}
            {cancelledEvents.length > 0 && (
              <div className="space-y-4 pt-10">
                <h2 className="text-xl font-bold text-gray-500 flex items-center gap-3 ml-2">
                  <div className="w-2 h-2 rounded-full bg-red-900" />
                  Gare Annullate / Passate ({cancelledEvents.length})
                </h2>
                <div className="glass-card !p-0 overflow-hidden border-white/5 opacity-60">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/10">
                          <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-widest">Gara</th>
                          <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-widest">Data</th>
                          <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-widest text-right">Azioni</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-500">
                        {cancelledEvents.map(event => (
                          <tr key={event.id} className="italic line-through decoration-gray-700">
                            <td className="px-6 py-4">{event.name}</td>
                            <td className="px-6 py-4">{new Date(event.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <button onClick={() => handleRestoreEvent(event.id)} className="text-blue-500/50 hover:text-blue-400 no-underline italic flex items-center gap-1">
                                  <RotateCcw size={14} /> Ripristina
                                </button>
                                {isAdmin && (
                                  <button 
                                    onClick={() => handleDeletePermanent(event.id)} 
                                    className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500/40 hover:text-red-500 transition-colors"
                                    title="Elimina definitivamente"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <EventForm 
          event={editingEvent}
          currentUserId={currentUserId || ''}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}

      {showProfile && currentUserId && (
        <ProfileModal 
          userId={currentUserId}
          onClose={() => setShowProfile(false)}
          onUpdated={() => {
            checkUser();
            fetchEvents(); // Refresh to update "Ultima Modifica" names
          }}
        />
      )}

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
    </div>
  );
}
