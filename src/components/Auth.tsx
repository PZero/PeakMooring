import * as React from 'react';
import { supabase } from '../lib/supabase';
import { Ship, Mail, Facebook, Chrome } from 'lucide-react';

function Auth({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage({ type: 'error', text: error.message });
    setLoading(false);
  };

  const handleEmailSignUp = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage({ type: 'error', text: error.message });
    else setMessage({ type: 'success', text: 'Controlla la tua email per confermare l\'iscrizione!' });
    setLoading(false);
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) setMessage({ type: 'error', text: error.message });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="gradient-bg" />
      <div className="glass-card w-full max-w-md p-8">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
            <Ship className="text-white" size={32} />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center mb-2">Benvenuto</h2>
        <p className="text-gray-400 text-center mb-8">Accedi a PeakMooring per gestire i tuoi ormeggi</p>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input 
              type="email" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="nome@esempio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input 
              type="password" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn btn-primary py-3 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Caricamento...' : <><Mail size={18} /> Accedi con Email</>}
          </button>
        </form>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <button 
            onClick={() => handleOAuthLogin('google')}
            className="btn btn-outline flex items-center justify-center gap-2 py-3"
          >
            <Chrome size={18} /> Google
          </button>
          <button 
            onClick={() => handleOAuthLogin('facebook')}
            className="btn btn-outline flex items-center justify-center gap-2 py-3"
          >
            <Facebook size={18} /> Facebook
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 text-center space-y-4">
          <button 
            onClick={handleEmailSignUp}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium block w-full"
          >
            Non hai un account? Registrati
          </button>
          <button 
            onClick={onBack}
            className="text-gray-500 hover:text-gray-400 text-sm block w-full"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;
