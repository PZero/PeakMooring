import * as React from 'react';
import { supabase } from '../lib/supabase';
import { X, User, Save } from 'lucide-react';

interface ProfileModalProps {
  userId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export default function ProfileModal({ userId, onClose, onUpdated }: ProfileModalProps) {
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    async function fetchProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
      }
      setLoading(false);
    }
    fetchProfile();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName
      })
      .eq('id', userId);

    if (error) {
      alert('Errore durante l\'aggiornamento del profilo: ' + error.message);
    } else {
      onUpdated();
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-card w-full max-w-md relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <User className="text-blue-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Il Tuo Profilo</h2>
              <p className="text-gray-400 text-sm">Aggiorna le tue informazioni personali</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Nome</label>
                <input 
                  type="text" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all text-white placeholder:text-gray-600"
                  placeholder="Il tuo nome"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Cognome</label>
                <input 
                  type="text" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all text-white placeholder:text-gray-600"
                  placeholder="Il tuo cognome"
                  required
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full btn btn-primary py-3 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" />
                  ) : (
                    <>
                      <Save size={18} />
                      Salva Modifiche
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
