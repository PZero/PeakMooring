import * as React from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User } from 'lucide-react';

function Auth({ onBack }: { onBack: () => void }) {
  const [isLogin, setIsLogin] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(true);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'error' | 'success', text: string } | null>(null);

  React.useEffect(() => {
    const savedEmail = localStorage.getItem('peak_mooring_email');
    const remember = localStorage.getItem('peak_mooring_remember') !== 'false';
    if (savedEmail && remember) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Persist or clear email based on rememberMe
    if (rememberMe) {
      localStorage.setItem('peak_mooring_email', email);
      localStorage.setItem('peak_mooring_remember', 'true');
    } else {
      localStorage.removeItem('peak_mooring_email');
      localStorage.setItem('peak_mooring_remember', 'false');
    }

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
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-2xl border border-white/10 mb-6 transform -rotate-3 hover:rotate-0 transition-all duration-300 overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover scale-150" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase">OpenWater Regs</h2>
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

            {isLogin && (
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${rememberMe ? 'bg-blue-500 border-blue-500' : 'bg-white/5 border-white/10'}`}>
                  {rememberMe && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors select-none">Recordami su questo dispositivo</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn btn-primary py-3 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-blue-600/20"
            >
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" /> : (isLogin ? 'Accedi' : 'Registrati')}
            </button>
          </form>

          <div className="social-divider">oppure continua con</div>

          <div className="grid grid-cols-1 gap-3 mt-6">
            <button 
              onClick={() => handleOAuthLogin('google')}
              className="btn btn-outline flex items-center justify-center gap-3 py-3 text-sm hover:bg-white/5 transition-colors border-white/10"
            >
              <svg className="w-5 h-5 flex-shrink-0" width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continua con Google</span>
            </button>
          </div>

          <div className="mt-16 pt-12 border-t border-white/5 flex flex-col items-center gap-10">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage(null);
              }}
              className="auth-footer-link text-sm py-2"
            >
              {isLogin ? (
                <>Non hai un account? <span className="text-blue-400 font-bold hover:underline ml-1">Registrati</span></>
              ) : (
                <>Hai già un account? <span className="text-blue-400 font-bold hover:underline ml-1">Accedi</span></>
              )}
            </button>
            
            <div className="pt-8 mt-4">
              <button 
                onClick={onBack}
                className="text-[10px] text-gray-500 hover:text-white transition-all uppercase tracking-[1.5em] font-black py-4 px-8 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 shadow-xl"
              >
                ← TORNA ALLA HOME
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
