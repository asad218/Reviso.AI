import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AddTopic from './components/AddTopic';
import Schedule from './components/Schedule';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    // Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      setAuthInitialized(true);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
  };

  const handleSaveComplete = () => {
    setActiveTab('dashboard'); // Redirect to dashboard after saving a topic
  };

  if (!authInitialized) {
    return <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <Layout currentUser={currentUser} activeTab={activeTab} onTabSwitch={handleTabSwitch}>
      <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
        {activeTab === 'dashboard' && <Dashboard currentUser={currentUser} />}
      </div>
      <div style={{ display: activeTab === 'add' ? 'block' : 'none' }}>
        {activeTab === 'add' && <AddTopic currentUser={currentUser} onSaveComplete={handleSaveComplete} />}
      </div>
      <div style={{ display: activeTab === 'schedule' ? 'block' : 'none' }}>
        {activeTab === 'schedule' && <Schedule currentUser={currentUser} />}
      </div>
    </Layout>
  );
}
