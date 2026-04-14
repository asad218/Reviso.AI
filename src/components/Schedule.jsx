import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Schedule({ currentUser }) {
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadSchedule();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const todayStr = () => new Date().toISOString().split('T')[0];

  const loadSchedule = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('id, due_date, subtopics(name, topics(name))')
      .eq('user_id', currentUser.id)
      .eq('completed', false)
      .gte('due_date', todayStr())
      .order('due_date', { ascending: true })
      .limit(80);

    if (error || !data) {
      setScheduleData([]);
    } else {
      const groups = {};
      data.forEach(r => {
        (groups[r.due_date] = groups[r.due_date] || []).push(r);
      });
      
      const res = Object.entries(groups).map(([date, reviews]) => {
        const d = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = Math.round((d - today) / 86400000);
        
        let labelStr = '';
        let isToday = false;
        
        if (diff === 0) {
          isToday = true;
          labelStr = 'Today';
        } else if (diff === 1) {
          labelStr = 'Tomorrow';
        } else {
          labelStr = `In ${diff} days · ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
        }

        return { date, reviews, labelStr, isToday, diff };
      });
      setScheduleData(res);
    }
    setLoading(false);
  };

  const markDone = async (reviewId) => {
    await supabase
      .from('reviews')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', reviewId);
    
    // Optimistic update
    setScheduleData(prev => prev.map(group => ({
      ...group,
      reviews: group.reviews.filter(r => r.id !== reviewId)
    })).filter(group => group.reviews.length > 0));
  };

  return (
    <div className="main-content">
      <div className="container">
        <div className="page-header">
          <h1>Review Schedule</h1>
          <p>Spaced repetition: Day +1, +3, +5, +7 after studying</p>
        </div>

        <div>
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>Loading schedule…
            </div>
          ) : scheduleData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              No upcoming reviews yet.<br />
              <span style={{ fontSize: '12px' }}>Log a study session to build your schedule.</span>
            </div>
          ) : (
            scheduleData.map(group => (
              <div className="date-group" key={group.date}>
                <div className="date-label">
                  {group.isToday ? <span style={{ color: 'var(--green)' }}>Today</span> : group.labelStr}
                </div>
                {group.reviews.map(r => (
                  <div className="review-item" key={r.id}>
                    <div className="review-info">
                      <div className="review-subtopic">{r.subtopics?.name || ''}</div>
                      <div className="review-topic">from: {r.subtopics?.topics?.name || ''}</div>
                    </div>
                    {group.isToday ? (
                      <button className="btn btn-green btn-sm" onClick={() => markDone(r.id)}>
                        Done ✓
                      </button>
                    ) : (
                      <span className="day-badge">+{group.diff}d</span>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
