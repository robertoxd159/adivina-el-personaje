import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import Game from './pages/Game';
import Auth from './pages/Auth';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Revisar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Escuchar cambios (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      {!session ? <Auth /> : <Game session={session} />}
    </div>
  );
}

export default App;