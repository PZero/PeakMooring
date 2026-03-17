import * as React from 'react';
import { supabase } from '../lib/supabase';
import { Waves, Mail, Chrome, Lock, User } from 'lucide-react';

function Auth({ onBack }: { onBack: () => void }) {
  const [isLogin, setIsLogin] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage({ type: 'error', text: error.message });
    } else {
      if (!firstName || !lastName) {
        setMessage({ type: 'error', text: 'Nome e cognome sono obbligatori' });
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      });
      if (error) setMessage({ type: 'error', text: error.message });
      else setMessage({ 
        type: 'success', 
        text: 'Registrazione completata! Riceverai un\'email da "Supabase Auth": clicca sul link di conferma per attivare l\'account prima di accedere.' 
      });
    }
    
    setLoading(false);
  };

  const handleOAuthLogin = async (provider: 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) setMessage({ type: 'error', text: error.message });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950 bg-opacity-50">
      <div className="gradient-bg opacity-50" />
      
      <div className="w-full max-w-[400px]">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl shadow-xl shadow-blue-500/20 mb-4 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <Waves className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">OpenWater Regs</h2>
          <p className="text-blue-300/80 mt-2 font-medium">Calendario Gare Nuoto</p>
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

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300 ml-1">Nome</label>
                  <div className="input-group">
                    <User className="input-icon" size={18} />
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 input-with-icon focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all text-white placeholder:text-gray-600"
                      placeholder="Mario"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300 ml-1">Cognome</label>
                  <div className="input-group">
                    <User className="input-icon" size={18} />
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 input-with-icon focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all text-white placeholder:text-gray-600"
                      placeholder="Rossi"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                </div>
              </>
            )}

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
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" /> : (isLogin ? 'Accedi' : 'Registrati')}
            </button>
          </form>

          <div className="social-divider">oppure continua con</div>

          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={() => handleOAuthLogin('google')}
              className="btn btn-outline flex items-center justify-center gap-2 py-3 text-sm hover:bg-white/5 transition-colors"
            >
              <Chrome size={20} className="text-blue-400" />
              <span>Continua con Google</span>
            </button>
          </div>

          <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage(null);
              }}
              className="auth-footer-link text-sm"
            >
              {isLogin ? (
                <>Non hai un account? <span className="text-blue-400 font-bold hover:underline ml-1">Registrati</span></>
              ) : (
                <>Hai già un account? <span className="text-blue-400 font-bold hover:underline ml-1">Accedi</span></>
              )}
            </button>
            
            <button 
              onClick={onBack}
              className="text-[10px] text-gray-500 hover:text-white transition-all uppercase tracking-[0.2em] font-black py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10"
            >
              ← Torna alla Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
