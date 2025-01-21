import React, { useEffect } from 'react';
import { useStore } from './store';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import Auth from './components/Auth';
import DatasetList from './components/DatasetList';

function App() {
  const { user, setUser } = useStore();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!user) {
    return <Auth />;
  }

  return (
    <Layout>
      <div className="w-full">
        <DatasetList />
      </div>
    </Layout>
  );
}

export default App;