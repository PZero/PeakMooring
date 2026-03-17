import * as React from 'react';
import { supabase } from '../lib/supabase';
import { X, Calendar, MapPin, Link as LinkIcon, AlertCircle, FileText } from 'lucide-react';

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

interface EventFormProps {
  event?: Event;
  onClose: () => void;
  onSaved: () => void;
  currentUserId: string;
}

export default function EventForm({ event, onClose, onSaved, currentUserId }: EventFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form State
  const [name, setName] = React.useState(event?.name || '');
  const [date, setDate] = React.useState(event?.date || '');
  const [organization, setOrganization] = React.useState<'FIN' | 'UISP' | 'ALTRO'>(event?.organization || 'FIN');
  const [deadline, setDeadline] = React.useState(event?.registration_deadline || '');
  const [eventLink, setEventLink] = React.useState(event?.event_link || '');
  const [distances, setDistances] = React.useState(event?.distances || '');
  const [notes, setNotes] = React.useState(event?.notes || '');
  const [resultsLink, setResultsLink] = React.useState(event?.results_link || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const eventData = {
      name,
      date,
      organization,
      registration_deadline: deadline,
      event_link: eventLink || null,
      distances: distances || null,
      notes: notes || null,
      results_link: resultsLink || null,
      created_by: event?.created_by || currentUserId,
      updated_at: new Date().toISOString()
    };

    try {
      if (event?.id) {
        // Update
        const { error: updateError } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id);
        if (updateError) throw updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('events')
          .insert([eventData]);
        if (insertError) throw insertError;
      }
      onSaved();
    } catch (err: any) {
      console.error('Error saving event:', err);
      setError(err.message || 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl relative my-8 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-gray-900 z-10 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">
            {event ? 'Modifica Gara' : 'Nuova Gara'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Nome Gara */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Nome Evento *</label>
              <input 
                type="text" 
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white/5 transition-all text-white placeholder:text-gray-600"
                placeholder="Es. 10km del Golfo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Data Gara */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 ml-1">Data Gara *</label>
              <div className="input-group">
                <Calendar className="input-icon" size={18} />
                <input 
                  type="date" 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 input-with-icon focus:outline-none focus:border-blue-500 focus:bg-white/5 transition-all text-white"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Termine Iscrizioni */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 ml-1">Scadenza Iscrizioni *</label>
              <div className="input-group">
                <AlertCircle className="input-icon" size={18} />
                <input 
                  type="date" 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 input-with-icon focus:outline-none focus:border-blue-500 focus:bg-white/5 transition-all text-white"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Ente Organizzatore */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 ml-1">Ente *</label>
              <select 
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white/5 transition-all text-white appearance-none"
                value={organization}
                onChange={(e) => setOrganization(e.target.value as 'FIN' | 'UISP' | 'ALTRO')}
                required
              >
                <option value="FIN">FIN</option>
                <option value="UISP">UISP</option>
                <option value="ALTRO">ALTRO</option>
              </select>
            </div>

            {/* Distanze */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 ml-1">Distanze</label>
              <div className="input-group">
                <MapPin className="input-icon" size={18} />
                <input 
                  type="text" 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 input-with-icon focus:outline-none focus:border-blue-500 focus:bg-white/5 transition-all text-white placeholder:text-gray-600"
                  placeholder="Es. 3km, 5km, Miglio"
                  value={distances}
                  onChange={(e) => setDistances(e.target.value)}
                />
              </div>
            </div>

            {/* Link Evento */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Link Sito / Iscrizioni</label>
              <div className="input-group">
                <LinkIcon className="input-icon" size={18} />
                <input 
                  type="url" 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 input-with-icon focus:outline-none focus:border-blue-500 focus:bg-white/5 transition-all text-white placeholder:text-gray-600"
                  placeholder="https://..."
                  value={eventLink}
                  onChange={(e) => setEventLink(e.target.value)}
                />
              </div>
            </div>

            {/* Link Risultati */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Link Risultati (post-gara)</label>
              <div className="input-group">
                <LinkIcon className="input-icon text-blue-400" size={18} />
                <input 
                  type="url" 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 input-with-icon focus:outline-none focus:border-blue-500 focus:bg-white/5 transition-all text-white placeholder:text-gray-600"
                  placeholder="https://..."
                  value={resultsLink}
                  onChange={(e) => setResultsLink(e.target.value)}
                />
              </div>
            </div>

            {/* Note Libere */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Note / Info Utili</label>
              <div className="input-group items-start">
                <FileText className="input-icon mt-3" size={18} />
                <textarea 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:border-blue-500 focus:bg-white/5 transition-all text-white placeholder:text-gray-600 min-h-[100px] resize-y"
                  placeholder="Aggiungi dettagli su orari, ritrovo, regole..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10 mt-6 sticky bottom-0 bg-gray-900 pb-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 btn btn-outline py-3"
            >
              Annulla
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 btn btn-primary py-3 flex items-center justify-center gap-2"
            >
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" /> : 'Salva Gara'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
