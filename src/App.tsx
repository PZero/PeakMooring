import * as React from 'react';
import { supabase } from './lib/supabase';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = React.useState<Session | null>(null);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [showAuth, setShowAuth] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const fetchRole = async (userId: string, email?: string) => {
    // Failsafe: fnicora@gmail.com is always admin
    if (email === 'fnicora@gmail.com') {
      setUserRole('admin');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (error) throw error;
      if (data) setUserRole(data.role);
    } catch (e) {
      console.error('Error fetching role:', e);
      setUserRole('user'); // Fallback to user role if profile is missing
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRole(session.user.id, session.user.email);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchRole(session.user.id, session.user.email);
      else {
        setUserRole(null);
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
    if (userRole === 'admin') return <AdminDashboard />;
    return <UserDashboard session={session} />;
  }

  if (showAuth) {
    return <Auth onBack={() => setShowAuth(false)} />;
  }

  return <LandingPage onLogin={() => setShowAuth(true)} />;
}

export default App;
