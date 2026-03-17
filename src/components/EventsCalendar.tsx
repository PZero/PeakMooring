import * as React from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Plus, LogOut, Settings, Trash2, Edit2, ExternalLink, MapPin, Map, Navigation, AlignLeft } from 'lucide-react';

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
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });
      
    if (!error && data) {
      setEvents(data as Event[]);
    }
    setLoading(false);
  };

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUserId(session.user.id);
      setIsAdmin(session.user.email === 'fnicora@gmail.com');
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

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo evento?')) {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (!error) {
        setEvents(events.filter(e => e.id !== id));
      } else {
        alert('Errore durante l\'eliminazione');
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

  const isDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date();
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
            
            {onNavigateToAdmin && (
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
          <div className="grid grid-cols-1 gap-4">
            {events.map(event => (
              <div key={event.id} className="glass-card p-0 overflow-hidden group">
                <div className="p-5 flex flex-col md:flex-row gap-6">
                  
                  {/* Event Info Left */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getOrgColor(event.organization)}`}>
                            {event.organization}
                          </span>
                          <span className="text-blue-400 font-semibold text-sm">
                            {new Date(event.date).toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                          {event.name}
                        </h2>
                      </div>
                      
                      {/* Mobile Actions */}
                      <div className="flex md:hidden items-center gap-2">
                        {(isAdmin || currentUserId === event.created_by) && (
                          <>
                            <button 
                              onClick={() => handleEdit(event)}
                              className="p-2 text-gray-400 hover:text-blue-400 bg-white/5 rounded-lg"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(event.id)} className="p-2 text-gray-400 hover:text-red-400 bg-white/5 rounded-lg">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                      {event.distances && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Map size={16} className="text-blue-500" />
                          <span><span className="text-gray-500">Distanze:</span> {event.distances}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Calendar size={16} className={isDeadlinePassed(event.registration_deadline) ? 'text-red-500' : 'text-yellow-500'} />
                        <span className={isDeadlinePassed(event.registration_deadline) ? 'text-red-400 line-through' : ''}>
                          <span className="text-gray-500">Iscrizioni entro:</span> {new Date(event.registration_deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {event.notes && (
                      <div className="flex items-start gap-2 text-sm text-gray-400 bg-black/20 p-3 rounded-lg border border-white/5">
                        <AlignLeft size={16} className="text-gray-500 shrink-0 mt-0.5" />
                        <p className="line-clamp-2">{event.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions Right (Desktop) & Links */}
                  <div className="flex flex-col justify-between items-start md:items-end gap-4 border-t border-white/10 md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0 min-w-[200px]">
                    
                    <div className="flex flex-row md:flex-col gap-2 w-full">
                      {event.event_link && (
                        <a href={event.event_link} target="_blank" rel="noopener noreferrer" 
                           className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-white/10">
                          <ExternalLink size={14} /> Sito Evento
                        </a>
                      )}
                      {event.results_link && (
                        <a href={event.results_link} target="_blank" rel="noopener noreferrer" 
                           className="flex-1 flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg text-sm transition-colors border border-blue-500/20">
                          <Navigation size={14} /> Risultati
                        </a>
                      )}
                    </div>
                    
                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-2 mt-auto w-full justify-end">
                      {(isAdmin || currentUserId === event.created_by) && (
                        <>
                          <button 
                            onClick={() => handleEdit(event)}
                            className="p-2 text-gray-400 hover:text-blue-400 bg-white/5 hover:bg-white/10 rounded-lg transition-colors" 
                            title="Modifica"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(event.id)} className="p-2 text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors" title="Elimina">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                    
                  </div>

                </div>
              </div>
            ))}
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
