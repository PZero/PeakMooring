import { X, Calendar, MapPin, Link as LinkIcon, AlertCircle, FileText, Clock, User, AlignLeft } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  date: string;
  organization: 'FIN' | 'UISP' | 'ALTRO';
  registration_deadline: string | null;
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

interface EventDetailsModalProps {
  event: Event;
  onClose: () => void;
}

export default function EventDetailsModal({ event, onClose }: EventDetailsModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', ' ore');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto pt-4 sm:p-4">
      <div className="bg-gray-900 border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl w-full max-w-2xl shadow-2xl relative animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gray-900 z-10 rounded-t-3xl sm:rounded-t-2xl shrink-0">
          <h2 className="text-2xl font-black text-white pr-4 leading-tight">{event.name}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <div className="p-6 space-y-6 pb-24 sm:pb-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Data Gara */}
              <div className="space-y-2 bg-white/5 border border-white/10 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                  <Calendar size={16} /> Data Gara
                </div>
                <div className="text-lg font-bold text-white capitalize">
                  {formatDate(event.date)}
                </div>
              </div>

              {/* Termine Iscrizioni */}
              <div className="space-y-2 bg-white/5 border border-white/10 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                  <Clock size={16} /> Scadenza Iscrizioni
                </div>
                <div className="text-lg font-bold text-red-400 capitalize">
                  {event.registration_deadline ? formatDate(event.registration_deadline) : 'Non specificata'}
                </div>
              </div>

              {/* Ente Organizzatore */}
              <div className="space-y-2 bg-white/5 border border-white/10 p-4 rounded-xl md:col-span-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                  <AlertCircle size={16} /> Circuito / Ente
                </div>
                <div className="inline-block px-3 py-1 rounded-lg text-sm font-black border uppercase tracking-wider bg-white/10 text-white border-white/20">
                  {event.organization}
                </div>
              </div>

              {/* Distanze */}
              {event.distances && (
                <div className="space-y-2 bg-white/5 border border-white/10 p-4 rounded-xl md:col-span-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                    <MapPin size={16} /> Distanze
                  </div>
                  <div className="text-white text-base leading-relaxed">
                    {event.distances}
                  </div>
                </div>
              )}

              {/* Note Libere */}
              {event.notes && (
                <div className="space-y-2 bg-white/5 border border-white/10 p-4 rounded-xl md:col-span-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                    <FileText size={16} /> Note / Info Utili
                  </div>
                  <div className="text-white text-base leading-relaxed whitespace-pre-wrap">
                    {event.notes}
                  </div>
                </div>
              )}

              {/* Link Evento */}
              {event.event_link && (
                <div className="space-y-2 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl md:col-span-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
                    <LinkIcon size={16} /> Link Sito Ufficiale / Iscrizioni
                  </div>
                  <a href={event.event_link} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 hover:underline break-all block text-base font-medium">
                    {event.event_link}
                  </a>
                </div>
              )}

              {/* Link Risultati */}
              {event.results_link && (
                <div className="space-y-2 bg-green-500/10 border border-green-500/20 p-4 rounded-xl md:col-span-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-400">
                    <AlignLeft size={16} /> Link Risultati (Post-gara)
                  </div>
                  <a href={event.results_link} target="_blank" rel="noopener noreferrer" className="text-green-300 hover:text-green-200 hover:underline break-all block text-base font-medium">
                    {event.results_link}
                  </a>
                </div>
              )}

              {/* Metadati (Ultima Modifica) */}
              <div className="space-y-2 bg-black/40 border border-white/5 p-4 rounded-xl md:col-span-2 mt-4">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                  <User size={14} /> Sistema e Aggiornamenti
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-400">
                  <div>
                    <span className="block text-gray-500 text-xs">Stato:</span>
                    <span className={`font-bold ${event.status === 'cancelled' ? 'text-red-400 line-through' : 'text-green-400'}`}>
                      {event.status === 'cancelled' ? 'Annullata / Passata' : 'Attiva'}
                    </span>
                  </div>
                  {event.updated_at && (
                    <div>
                      <span className="block text-gray-500 text-xs">Ultimo aggiornamento:</span>
                      {formatDateTime(event.updated_at)} by <span className="text-sky-400">{event.updater_email || 'Sconosciuto'}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
