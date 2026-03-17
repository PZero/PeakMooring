import * as React from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Plus, LogOut, Settings, Trash2, Edit2, ExternalLink, AlignLeft, Clock, RotateCcw, Smartphone } from 'lucide-react';

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
  const [isFullscreen, setIsFullscreen] = React.useState(false);

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

    const checkOrientation = () => {
      if (window.innerWidth > window.innerHeight && window.innerWidth < 1024) {
        setIsFullscreen(true);
      } else {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    checkOrientation(); // initial check

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // Force reload to ensure session is cleared
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
    return 'text-slate-600 font-semibold';
  };

  const activeEvents = events.filter(e => e.status !== 'cancelled');
  const cancelledEvents = events.filter(e => e.status === 'cancelled');

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }).replace('.', '');
  };

  return (
    <div className="min-h-screen bg-gray-950 px-4 md:px-8 pt-24 pb-20">
      <div className="max-w-7xl mx-auto space-y-6 w-full">
        
        {/* Fixed Top Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between p-3 md:px-8 md:py-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-white/10 overflow-hidden shrink-0">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover scale-150" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg md:text-2xl font-black text-white tracking-tighter uppercase leading-none">Calendario 2026</h1>
                <p className="text-blue-300/60 font-medium uppercase tracking-widest text-[8px] md:text-xs mt-1">Open Water Swim Season</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              {isAdmin && onNavigateToAdmin && (
                <button onClick={onNavigateToAdmin} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center gap-1.5 py-1.5 px-2.5 md:py-2 md:px-4 rounded-lg transition-all">
                  <Settings size={16} />
                  <span className="hidden sm:inline font-bold text-xs md:text-sm">Admin</span>
                </button>
              )}
              <button 
                onClick={() => { setEditingEvent(undefined); setShowForm(true); }}
                className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 py-1.5 px-3 md:py-2 md:px-4 rounded-lg shadow-lg shadow-blue-500/20 transition-all"
              >
                <Plus size={16} />
                <span className="font-bold text-xs md:text-sm">Nuova Gara</span>
              </button>
            </div>
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
              <div className="flex items-center justify-between ml-1 mb-2">
                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Gare Attive ({activeEvents.length})
                </h2>
                <div className="md:hidden text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1 animate-pulse">
                  <span>Scorri</span> <span>→</span>
                </div>
              </div>
              <div className={`glass-card !p-0 overflow-hidden border-white/5 shadow-2xl relative transition-all duration-300 ${isFullscreen ? 'fullscreen-landscape' : ''}`}>
                
                {/* Header specifically for fullscreen mode to allow exit or just show title */}
                {isFullscreen && (
                  <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gray-900">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Gare Attive ({activeEvents.length})
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Smartphone size={16} /> <span className="uppercase tracking-widest text-[10px]">Ruota per uscire</span>
                    </div>
                  </div>
                )}

                {/* Scroll hint overlay */}
                {!isFullscreen && <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none md:hidden z-10" />}
                
                <div className="overflow-x-auto pb-2 custom-scrollbar">
                  <table className="w-full text-left border-collapse table-nowrap">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Gara / Org</th>
                        <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Data Gara</th>
                        <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Scadenza Is.</th>
                        <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Distanze / Info</th>
                        <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Modificato Da</th>
                        <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Azioni</th>
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
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black border mt-1 block w-max ${
                                event.organization === 'FIN' ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' :
                                event.organization === 'UISP' ? 'bg-orange-500/20 text-orange-400 border-orange-500/20' :
                                'bg-purple-500/20 text-purple-400 border-purple-500/20'
                              }`}>
                                {event.organization}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 text-gray-300 font-bold capitalize">
                                <Calendar size={14} className="text-gray-500" />
                                {formatDateShort(event.date)}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg font-bold text-sm capitalize ${getDeadlineStyle(event.registration_deadline)}`}>
                                <Clock size={14} />
                                {formatDateShort(event.registration_deadline)}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="space-y-1.5 max-w-[200px] whitespace-normal">
                                {event.distances && <div className="text-xs text-gray-300 leading-tight">{event.distances}</div>}
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
                            <td className="px-5 py-4">
                              <div className="text-[10px] text-gray-500">
                                <div>{formatDateShort(event.updated_at)}</div>
                                <div className="text-blue-400 font-bold truncate max-w-[100px]">{event.updater_email}</div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingEvent(event); setShowForm(true); }} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"><Edit2 size={16} /></button>
                                <button onClick={() => { if(confirm('Annullare?')) handleCancelEvent(event.id); }} className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500/60 hover:text-red-400"><Trash2 size={16} /></button>
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
      {/* Fixed Bottom Profile Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between p-2 md:px-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white border border-white/10 shadow-inner shrink-0">
              <span className="text-sm font-black uppercase">{userProfile?.first_name?.charAt(0) || 'A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{userProfile?.first_name || 'Atleta'}</span>
              <button 
                onClick={() => setShowProfile(true)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:text-blue-400 hover:bg-white/10 transition-all active:scale-95"
                title="Modifica Profilo"
              >
                <Edit2 size={14} />
              </button>
            </div>
          </div>
          <button 
            onClick={() => setShowLogoutConfirm(true)} 
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500/80 hover:text-red-400 hover:bg-red-500/20 transition-all active:scale-95 shrink-0"
            title="Esci dalla sessione"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
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
            fetchEvents();
          }}
        />
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-sm p-8 animate-in zoom-in-95 duration-200 border-red-500/20 shadow-2xl shadow-red-500/10">
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
