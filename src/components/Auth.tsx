import * as React from 'react';
import { supabase } from '../lib/supabase';
import { Ship, Mail, Facebook, Chrome, Lock } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950 bg-opacity-50">
      <div className="gradient-bg opacity-50" />
      
      <div className="w-full max-w-[400px]">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 mb-4 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <Ship className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">PeakMooring</h2>
          <p className="text-gray-400 mt-2">Gestione ormeggi professionale</p>
        </div>

        <div className="glass-card !p-8 !mt-0 shadow-2xl border-white/5">
          {message && (
            <div className={`p-4 rounded-xl mb-6 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
              message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${message.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`} />
              {message.text}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 ml-1">Email</label>
              <div className="input-group">
                <Mail className="input-icon" size={18} />
                <input 
                  type="email" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 input-with-icon focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all text-white placeholder:text-gray-600"
                  placeholder="nome@esempio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
              <div className="input-group">
                <Lock className="input-icon" size={18} />
                <input 
                  type="password" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 input-with-icon focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all text-white placeholder:text-gray-600"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn btn-primary py-3 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-blue-600/20"
            >
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" /> : 'Accedi'}
            </button>
          </form>

          <div className="social-divider">oppure continua con</div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleOAuthLogin('google')}
              className="btn btn-outline flex items-center justify-center gap-2 py-2.5 text-sm hover:bg-white/5 transition-colors"
            >
              <Chrome size={18} /> Google
            </button>
            <button 
              onClick={() => handleOAuthLogin('facebook')}
              className="btn btn-outline flex items-center justify-center gap-2 py-2.5 text-sm hover:bg-white/5 transition-colors"
            >
              <Facebook size={18} /> Facebook
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-3">
            <button 
              onClick={handleEmailSignUp}
              className="auth-footer-link font-medium"
            >
              Non hai un account? <span className="text-blue-400">Registrati</span>
            </button>
            <button 
              onClick={onBack}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors uppercase tracking-widest font-semibold"
            >
              ← Torna alla Home
            </button>
          </div>
        </div>
        
        <p className="text-center text-gray-600 text-[11px] mt-8 uppercase tracking-[0.2em]">
          &copy; 2024 PeakMooring • Sicurezza Crittografata
        </p>
      </div>
    </div>
  );
}

export default Auth;
