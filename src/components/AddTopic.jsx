import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { fetchGeminiSubtopics } from '../lib/geminiApi';

export default function AddTopic({ currentUser, onSaveComplete }) {
  const [topicInput, setTopicInput] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchedSubtopics, setFetchedSubtopics] = useState([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState(new Set());
  const [saving, setSaving] = useState(false);

  const fetchSubtopics = async () => {
    if (!topicInput.trim()) return;
    setFetching(true);
    setFetchedSubtopics([]);
    setSelectedSubtopics(new Set());

    try {
      const subtopics = await fetchGeminiSubtopics(topicInput.trim());
      setFetchedSubtopics(subtopics);
    } catch (e) {
      console.error(e);
      alert('Could not fetch subtopics. Check your Gemini API key configuration.');
    }
    setFetching(false);
  };

  const toggleSub = (index) => {
    const nextSet = new Set(selectedSubtopics);
    if (nextSet.has(index)) {
      nextSet.delete(index);
    } else {
      nextSet.add(index);
    }
    setSelectedSubtopics(nextSet);
  };

  const toggleSelectAll = () => {
    if (selectedSubtopics.size === fetchedSubtopics.length) {
      setSelectedSubtopics(new Set());
    } else {
      setSelectedSubtopics(new Set(fetchedSubtopics.map((_, i) => i)));
    }
  };

  const todayStr = () => new Date().toISOString().split('T')[0];

  const addDays = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  };

  const saveStudySession = async () => {
    if (selectedSubtopics.size === 0) {
      alert('Please select at least one subtopic you studied today.');
      return;
    }

    setSaving(true);
    const topicName = topicInput.trim();

    try {
      // 1) insert topic
      const { data: topic, error: e1 } = await supabase
        .from('topics')
        .insert({ user_id: currentUser.id, name: topicName })
        .select()
        .single();
      if (e1) throw e1;

      // 2) insert chosen subtopics
      const subRows = [...selectedSubtopics].map(i => ({
        topic_id: topic.id,
        user_id: currentUser.id,
        name: fetchedSubtopics[i],
        studied_date: todayStr()
      }));
      const { data: subs, error: e2 } = await supabase.from('subtopics').insert(subRows).select();
      if (e2) throw e2;

      // 3) create spaced-repetition schedule: +1, +3, +5, +7 days
      const intervals = [1, 3, 5, 7];
      const reviewRows = [];
      subs.forEach(sub => {
        intervals.forEach(d => {
          reviewRows.push({
            subtopic_id: sub.id,
            user_id: currentUser.id,
            due_date: addDays(d),
            completed: false
          });
        });
      });
      const { error: e3 } = await supabase.from('reviews').insert(reviewRows);
      if (e3) throw e3;

      // 4) record today's activity for streak
      await supabase.from('activity').upsert(
        { user_id: currentUser.id, activity_date: todayStr() },
        { onConflict: 'user_id,activity_date' }
      );

      // Reset and trigger dashboard reload
      setTopicInput('');
      setFetchedSubtopics([]);
      setSelectedSubtopics(new Set());
      setSaving(false);
      onSaveComplete();

    } catch (err) {
      console.error(err);
      alert('Error saving. See browser console for details.');
      setSaving(false);
    }
  };

  return (
    <div className="main-content">
      <div className="container">
        <div className="page-header">
          <h1>What did you study?</h1>
          <p>Type one topic — AI will list all its subtopics</p>
        </div>

        <div className="input-wrap">
          <input
            type="text"
            className="big-input"
            placeholder="e.g. Binary Trees, French Revolution…"
            value={topicInput}
            onChange={e => setTopicInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchSubtopics()}
          />
          <button className="btn input-action-btn" onClick={fetchSubtopics} disabled={fetching}>
            Fetch →
          </button>
        </div>

        {fetching && (
          <div className="loading">
            <div className="spinner"></div> AI is researching subtopics…
          </div>
        )}

        {fetchedSubtopics.length > 0 && (
          <div className="subtopics-container show">
            <div className="subtopics-header">
              <div className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                Select what you covered today
              </div>
              <button className="select-all-btn" onClick={toggleSelectAll}>
                Select all
              </button>
            </div>
            
            <div id="subtopics-list">
              {fetchedSubtopics.map((s, i) => {
                const isSelected = selectedSubtopics.has(i);
                return (
                  <div
                    key={i}
                    className={`subtopic-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSub(i)}
                  >
                    <div className="check-box">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="subtopic-name">{s}</div>
                  </div>
                );
              })}
            </div>
            
            <div className="save-row">
              <button
                className={`btn ${saving ? 'btn-green' : ''}`}
                style={{ width: 'auto', padding: '10px 22px' }}
                onClick={saveStudySession}
                disabled={saving}
              >
                {saving ? '✓ Saved!' : 'Save & Schedule Reviews'}
              </button>
              <span className="selected-count">
                {selectedSubtopics.size > 0 ? `${selectedSubtopics.size} selected` : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
