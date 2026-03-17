import * as React from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Plus, LogOut, Settings, Trash2, Edit2, ExternalLink, Map, Navigation, AlignLeft, Clock } from 'lucide-react';

import EventForm from './EventForm';

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
  updater_email?: string; // We'll fetch this from joined profile
  updated_at: string;
}

export default function EventsCalendar({ onNavigateToAdmin }: { onNavigateToAdmin?: () => void }) {
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  
  // Modal state
  const [showForm, setShowForm] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<Event | undefined>(undefined);

  const fetchEvents = async () => {
    setLoading(true);
    // Fetch events and join with profiles to get updater's email
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*, profiles!events_updated_by_fkey(email)');
      
    if (!eventsError && eventsData) {
      // Map the joined data so we can use updater_email easily
      const formattedEvents = eventsData.map((e: any) => ({
        ...e,
        updater_email: e.profiles?.email || 'Sconosciuto'
      })) as Event[];

      // Sort logic
      formattedEvents.sort((a, b) => {
        // 1. Cancelled events at the bottom
        if (a.status === 'cancelled' && b.status !== 'cancelled') return 1;
        if (a.status !== 'cancelled' && b.status === 'cancelled') return -1;
        
        // 2. Sort by registration_deadline (ascending, so soonest first)
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
      
      // Check admin status from database
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single();
      setIsAdmin(profile?.is_admin || session.user.email === 'fnicora@gmail.com');
    }
  };

  React.useEffect(() => {
    checkUser();
    fetchEvents();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingEvent(undefined);
  };

  const handleSaved = () => {
    handleFormClose();
    fetchEvents(); // Refresh after save
  };

  const handleDelete = async (event: Event) => {
    if (window.confirm('Vuoi contrassegnare questa gara come ANNULLATA? (verrà spostata in fondo alla tabella). Se vuoi eliminarla definitivamente, contatta l\'amministratore.')) {
      const { error } = await supabase
        .from('events')
        .update({ status: 'cancelled', updated_by: currentUserId })
        .eq('id', event.id);
        
      if (!error) {
        fetchEvents();
      } else {
        alert('Errore durante l\'aggiornamento dello stato');
      }
    }
  };

  const getOrgColor = (org: string) => {
    switch(org) {
      case 'FIN': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'UISP': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getDeadlineStyle = (deadlineString: string, status: string) => {
    if (status === 'cancelled') return 'text-gray-500 line-through';
    
    const deadline = new Date(deadlineString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays < 0) {
      // Passed
      return 'text-gray-500 line-through';
    } else if (diffDays <= 10) {
      // Very close: pulsing red
      return 'bg-red-500 animate-pulse text-white font-bold px-2 py-1 rounded';
    } else if (diffDays <= 20) {
      // Close: yellow
      return 'bg-yellow-500 text-gray-900 font-bold px-2 py-1 rounded';
    } else {
      // Far
      return 'text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Calendar className="text-blue-500" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Calendario Gare</h1>
              <p className="text-gray-400">Open Water Swimming</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              className="btn btn-primary flex items-center gap-2"
              onClick={() => {
                setEditingEvent(undefined);
                setShowForm(true);
              }}
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Nuova Gara</span>
            </button>
            
            {onNavigateToAdmin && isAdmin && (
              <button 
                onClick={onNavigateToAdmin}
                className="btn btn-outline flex items-center gap-2"
                title="Pannello Amministratore"
              >
                <Settings size={18} />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
            
            <button 
              onClick={handleLogout}
              className="btn btn-outline flex items-center gap-2"
              title="Esci"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-gray-500" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Nessuna gara in calendario</h3>
            <p className="text-gray-400">Clicca su + Nuova Gara per inserire il primo evento.</p>
          </div>
        ) : (
          <div className="glass-card overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="text-xs uppercase bg-black/40 text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-4 rounded-tl-xl truncate">Gara & Ente</th>
                  <th scope="col" className="px-6 py-4 truncate">Data</th>
                  <th scope="col" className="px-6 py-4 truncate">Scadenza Iscr.</th>
                  <th scope="col" className="px-6 py-4">Distanze / Note</th>
                  <th scope="col" className="px-6 py-4 truncate text-center">Link Utili</th>
                  <th scope="col" className="px-6 py-4 min-w-[150px]">Ultima Modifica</th>
                  <th scope="col" className="px-6 py-4 rounded-tr-xl text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => {
                  const isCancelled = event.status === 'cancelled';
                  const rowClass = isCancelled 
                    ? "border-b border-white/5 bg-red-950/10 opacity-60 hover:opacity-100 transition-opacity" 
                    : "border-b border-white/5 hover:bg-white/5 transition-colors";
                    
                  return (
                    <tr key={event.id} className={rowClass}>
                      <td className="px-6 py-4 font-medium text-white max-w-[200px]">
                        <div className={`mb-1 ${isCancelled ? 'line-through text-gray-500' : ''}`}>
                          {event.name}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${getOrgColor(event.organization)}`}>
                          {event.organization}
                        </span>
                        {isCancelled && <span className="ml-2 text-xs text-red-500 font-bold uppercase">Annullata</span>}
                      </td>
                      <td className={`px-6 py-4 text-blue-400 font-medium ${isCancelled ? 'line-through' : ''}`}>
                        {new Date(event.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getDeadlineStyle(event.registration_deadline, event.status)}>
                          {new Date(event.registration_deadline).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 min-w-[200px]">
                        {event.distances && (
                          <div className="flex items-center gap-1 text-xs mb-1">
                            <Map size={14} className="text-blue-500 shrink-0" />
                            <span className="truncate" title={event.distances}>{event.distances}</span>
                          </div>
                        )}
                        {event.notes && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <AlignLeft size={14} className="text-gray-500 shrink-0" />
                            <span className="truncate max-w-[150px]" title={event.notes}>{event.notes}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {event.event_link && (
                            <a href={event.event_link} target="_blank" rel="noopener noreferrer" 
                               className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10" title="Sito Evento">
                              <ExternalLink size={16} />
                            </a>
                          )}
                          {event.results_link && (
                            <a href={event.results_link} target="_blank" rel="noopener noreferrer" 
                               className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors border border-blue-500/20" title="Classifiche/Risultati">
                              <Navigation size={16} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(event.updated_at).toLocaleDateString()}
                        </div>
                        {event.updater_email && (
                          <div className="truncate max-w-[120px]" title={event.updater_email}>
                            da: {event.updater_email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(isAdmin || currentUserId === event.created_by) && (
                            <>
                              <button 
                                onClick={() => handleEdit(event)}
                                className="p-2 text-gray-400 hover:text-blue-400 bg-white/5 hover:bg-white/10 rounded-lg transition-colors" 
                                title="Modifica"
                              >
                                <Edit2 size={16} />
                              </button>
                              {!isCancelled && (
                                <button 
                                  onClick={() => handleDelete(event)} 
                                  className="p-2 text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors" 
                                  title="Annulla Gara"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && currentUserId && (
        <EventForm 
          event={editingEvent} 
          currentUserId={currentUserId}
          onClose={handleFormClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
