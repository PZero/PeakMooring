import * as React from 'react';
import { supabase } from './lib/supabase';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import PendingApproval from './components/PendingApproval';
import AdminPanel from './components/AdminPanel';
import EventsCalendar from './components/EventsCalendar';
import { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = React.useState<Session | null>(null);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [userStatus, setUserStatus] = React.useState<string | null>(null);
  const [showAuth, setShowAuth] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  
  // Per gestire la navigazione interna dell'admin
  const [adminView, setAdminView] = React.useState<'panel' | 'calendar'>('calendar');

  const fetchProfile = async (userId: string, email?: string) => {
    // Failsafe admin: guarantee access even if profile record is missing or query fails
    if (email === 'fnicora@gmail.com') {
      setUserRole('admin');
      setUserStatus('approved');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin, status')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setUserRole(data.is_admin ? 'admin' : 'user');
        setUserStatus(data.status);
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
      setUserRole('user');
      setUserStatus('pending'); // Fallback to pending if profile missing
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.email);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.email);
      else {
        setUserRole(null);
        setUserStatus(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (session) {
    if (userRole === 'admin') {
      if (adminView === 'panel') {
        return <AdminPanel onNavigateToCalendar={() => setAdminView('calendar')} />;
      } else {
        return <EventsCalendar onNavigateToAdmin={() => setAdminView('panel')} />;
      }
    }
    
    if (userStatus === 'approved') {
      return <EventsCalendar />;
    }
    
    if (userStatus === 'rejected') {
      return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
          <div className="glass-card max-w-md w-full text-center p-8">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Accesso Negato</h2>
            <p className="text-gray-400 mb-8">La tua richiesta di accesso è stata rifiutata dall'amministratore.</p>
            <button onClick={() => supabase.auth.signOut()} className="btn btn-outline w-full">Esci</button>
          </div>
        </div>
      );
    }
    
    return <PendingApproval />;
  }

  if (showAuth) {
    return <Auth onBack={() => setShowAuth(false)} />;
  }

  return <LandingPage onLogin={() => setShowAuth(true)} />;
}

export default App;
