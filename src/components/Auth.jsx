import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Auth() {
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setErrorMsg('');
    setInfoMsg('');

    if (!email || !password) {
      setErrorMsg('Please fill in both fields.');
      return;
    }

    setLoading(true);

    let result;
    if (authMode === 'login') {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({ email, password });
    }

    setLoading(false);

    if (result.error) {
      setErrorMsg(result.error.message);
    } else if (authMode === 'signup' && !result.data?.session) {
      setInfoMsg('Account created! Check your email to confirm, then log in.');
    }
  };

  return (
    <div id="screen-auth" className="screen active">
      <div className="auth-wrap">
        <div className="auth-logo">Reviso</div>
        <div className="auth-tagline">Study smarter. Review on time.</div>
        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => setAuthMode('login')}
            >
              Log In
            </button>
            <button
              className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => setAuthMode('signup')}
            >
              Sign Up
            </button>
          </div>
          
          <div className={`error-msg ${errorMsg ? 'show' : ''}`}>{errorMsg}</div>
          <div className={`info-msg ${infoMsg ? 'show' : ''}`}>{infoMsg}</div>
          
          <label htmlFor="auth-email">Email</label>
          <input
            type="email"
            id="auth-email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
          />
          
          <label htmlFor="auth-password">Password</label>
          <input
            type="password"
            id="auth-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
          />
          
          <button className="btn" onClick={handleAuth} disabled={loading}>
            {loading ? '…' : authMode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
