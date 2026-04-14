import React from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Layout({ children, currentUser, activeTab, onTabSwitch }) {
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div id="screen-app" className="screen active">
      {/* NAVBAR */}
      <div className="navbar">
        <div className="nav-logo">Reviso</div>
        <div className="nav-right">
          <span className="user-email" id="user-email-display">
            {currentUser?.email}
          </span>
          <button className="btn btn-ghost" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>

      {/* DYNAMIC CONTENT */}
      {children}

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        <button
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onTabSwitch('dashboard')}
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </button>
        
        <button
          className={`nav-btn add-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => onTabSwitch('add')}
        >
          <div className="add-circle">
            <svg fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </button>
        
        <button
          className={`nav-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => onTabSwitch('schedule')}
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Schedule
        </button>
      </div>
    </div>
  );
}
