import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard({ currentUser }) {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState({ topics: '—', pending: '—' });

  useEffect(() => {
    if (currentUser) {
      loadDashboard();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const todayStr = () => new Date().toISOString().split('T')[0];

  const loadDashboard = async () => {
    setLoadingReviews(true);
    await Promise.all([loadTodayReviews(), loadStreak(), loadStats()]);
  };

  const loadTodayReviews = async () => {
    const today = todayStr();
    const { data, error } = await supabase
      .from('reviews')
      .select('id, subtopics(name, topics(name))')
      .eq('user_id', currentUser.id)
      .eq('due_date', today)
      .eq('completed', false);

    if (error || !data) {
      setReviews([]);
    } else {
      setReviews(data);
    }
    setLoadingReviews(false);
  };

  const loadStreak = async () => {
    const { data } = await supabase
      .from('activity')
      .select('activity_date')
      .eq('user_id', currentUser.id)
      .order('activity_date', { ascending: false });

    let currentStreak = 0;
    if (data && data.length > 0) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      for (let i = 0; i < data.length; i++) {
        const d = new Date(data[i].activity_date);
        const diff = Math.round((now - d) / 86400000);
        if (diff === i || (i === 0 && diff <= 1)) currentStreak++;
        else break;
      }
    }
    setStreak(currentStreak);
  };

  const loadStats = async () => {
    const [t, p] = await Promise.all([
      supabase.from('topics').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id),
      supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id).eq('completed', false)
    ]);
    setStats({ topics: t.count ?? 0, pending: p.count ?? 0 });
  };

  const markDone = async (reviewId) => {
    await supabase
      .from('reviews')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', reviewId);
    
    // Update local state to hide it
    setReviews(prev => prev.filter(r => r.id !== reviewId));
    loadStats();
  };

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="main-content">
      <div className="container">
        <div className="page-header">
          <h1>{greeting}</h1>
          <p>Here's your study summary</p>
        </div>

        <div className="streak-card">
          <div className="streak-flame">🔥</div>
          <div className="streak-num">{streak}</div>
          <div className="streak-info">
            <strong>Day streak</strong>
            <span>Study daily to keep it going</span>
          </div>
        </div>

        <div className="section">
          <div className="section-title">Due for review today</div>
          <div>
            {loadingReviews ? (
              <div className="loading">
                <div className="spinner"></div>Loading reviews…
              </div>
            ) : reviews.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✓</div>
                Nothing due today!<br />
                <span style={{ fontSize: '12px' }}>Tap + to log what you studied.</span>
              </div>
            ) : (
              reviews.map(r => (
                <div className="review-item" key={r.id}>
                  <div className="review-info">
                    <div className="review-subtopic">{r.subtopics?.name || ''}</div>
                    <div className="review-topic">from: {r.subtopics?.topics?.name || ''}</div>
                  </div>
                  <button className="btn btn-green btn-sm" onClick={() => markDone(r.id)}>
                    Done ✓
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="section">
          <div className="section-title">Quick stats</div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-num">{stats.topics}</div>
              <div className="stat-label">Topics added</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{stats.pending}</div>
              <div className="stat-label">Pending reviews</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
