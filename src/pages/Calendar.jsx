import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday, differenceInDays } from 'date-fns';
import { quickPrompt } from '../gemini';
import toast from 'react-hot-toast';

const CAT_COLOR = {
  work:         '#A78BFA',
  personal:     '#FDBA74',
  health:       '#6EE7B7',
  relationship: '#FCD34D',
};
const CAT_EMOJI = { work: '💼', personal: '🌸', health: '💪', relationship: '❤️' };

export default function Calendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month' | 'week'
  const [tasks, setTasks] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadTasks();
  }, [user]);

  async function loadTasks() {
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'tasks'));
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Build calendar days for month view
  function getMonthDays() {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end   = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    const days  = [];
    let cur = start;
    while (cur <= end) {
      days.push(new Date(cur));
      cur = addDays(cur, 1);
    }
    return days;
  }

  // Build week days for week view
  function getWeekDays() {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }

  const days = view === 'month' ? getMonthDays() : getWeekDays();

  // Tasks per day
  function tasksForDay(day) {
    return tasks.filter((t) => t.deadline && isSameDay(new Date(t.deadline), day));
  }

  // Conflict detection (2+ tasks same day)
  const conflictDays = days.filter((d) => tasksForDay(d).length >= 2);
  const hasConflicts = conflictDays.length > 0;

  // AI Reschedule suggestion
  const handleAiReschedule = async () => {
    setAiLoading(true);
    setAiSuggestion('');
    try {
      const taskSummary = tasks
        .filter((t) => !t.done && t.deadline)
        .map((t) => `"${t.task}" due ${t.deadline} (${t.priority}, ${t.estimatedHours || 1}h)`)
        .join('; ');
      const prompt = `I have these upcoming tasks: ${taskSummary || 'no tasks'}. Today is ${format(new Date(), 'yyyy-MM-dd')}. Analyze for scheduling conflicts (2+ tasks same day or overloaded days) and suggest a specific rescheduling plan in 3-4 sentences. Be friendly and actionable.`;
      const suggestion = await quickPrompt(prompt);
      setAiSuggestion(suggestion || 'No conflicts found — your schedule looks great! 🎉');
    } catch (e) {
      toast.error('AI reschedule unavailable. Check your API key.');
    } finally {
      setAiLoading(false);
    }
  };

  const selectedTasks = selectedDay ? tasksForDay(selectedDay) : [];

  const navigate = (dir) => {
    if (view === 'month') {
      setCurrentDate((d) => {
        const n = new Date(d);
        n.setMonth(n.getMonth() + dir);
        return n;
      });
    } else {
      setCurrentDate((d) => addDays(d, dir * 7));
    }
  };

  const WEEK_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }} className="fade-in-up">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>📅 Smart Calendar</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>AI-powered scheduling with conflict detection</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 10, padding: 3, gap: 2 }}>
            {['month', 'week'].map((v) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '0.35rem 0.875rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: view === v ? 'white' : 'transparent',
                color: view === v ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontWeight: view === v ? 700 : 500, fontSize: '0.82rem',
                boxShadow: view === v ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={handleAiReschedule} disabled={aiLoading} style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}>
            {aiLoading ? '⏳ Analyzing…' : '🤖 AI Reschedule'}
          </button>
        </div>
      </div>

      {/* ── Conflict Banner ────────────────────────────────────────────── */}
      {hasConflicts && (
        <div className="conflict-banner" style={{ marginBottom: '1rem' }}>
          ⚠️ <div>
            <strong>Scheduling conflict detected!</strong> You have {conflictDays.length} day{conflictDays.length > 1 ? 's' : ''} with 2+ deadlines.
            Use "AI Reschedule" to get suggestions.
          </div>
        </div>
      )}

      {/* ── AI Suggestion Box ─────────────────────────────────────────── */}
      {aiSuggestion && (
        <div className="card fade-in-up" style={{ marginBottom: '1rem', background: 'linear-gradient(135deg, #F0FDF4, #D1FAE5)', border: '1.5px solid #6EE7B7' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: '#065F46' }}>ARIA's Reschedule Suggestion</div>
              <p style={{ fontSize: '0.875rem', color: '#065F46', lineHeight: 1.6 }}>{aiSuggestion}</p>
            </div>
            <button onClick={() => setAiSuggestion('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6EE7B7', fontSize: '1.1rem', marginLeft: 'auto' }}>✕</button>
          </div>
        </div>
      )}

      {/* ── Calendar ──────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '1.25rem' }}>
        {/* Nav Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.9rem' }}>← Prev</button>
          <h2 style={{ fontWeight: 700, fontSize: '1.05rem' }}>
            {view === 'month'
              ? format(currentDate, 'MMMM yyyy')
              : `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'MMM d, yyyy')}`}
          </h2>
          <button onClick={() => navigate(1)} className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.9rem' }}>Next →</button>
        </div>

        {/* Day Labels */}
        <div className="cal-grid" style={{ marginBottom: '0.5rem' }}>
          {WEEK_LABELS.map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', padding: '0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="cal-grid">
          {days.map((day, i) => {
            const dayTasks = tasksForDay(day);
            const isOther  = view === 'month' && !isSameMonth(day, currentDate);
            const isTod    = isToday(day);
            const isSel    = selectedDay && isSameDay(day, selectedDay);
            const hasConfl = dayTasks.length >= 2;

            return (
              <div
                key={i}
                className={`cal-day${isTod ? ' today' : ''}${isOther ? ' other-month' : ''}`}
                style={{
                  background: isSel && !isTod ? 'rgba(167,139,250,0.15)' : undefined,
                  outline: isSel ? '2px solid #A78BFA' : hasConfl ? '2px solid #F59E0B' : 'none',
                  outlineOffset: -2,
                  minHeight: view === 'week' ? 90 : 52,
                }}
                onClick={() => setSelectedDay(isSameDay(day, selectedDay) ? null : day)}
              >
                <span style={{ fontSize: '0.82rem', fontWeight: isTod ? 700 : 500, lineHeight: 1 }}>
                  {format(day, 'd')}
                </span>

                {/* Event dots / mini bars */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', marginTop: 2 }}>
                  {dayTasks.slice(0, view === 'week' ? 4 : 3).map((t) => (
                    view === 'week'
                      ? <div key={t.id} style={{
                          width: '100%', padding: '1px 3px', borderRadius: 4,
                          background: (CAT_COLOR[t.category] || '#A78BFA') + '22',
                          borderLeft: `2px solid ${CAT_COLOR[t.category] || '#A78BFA'}`,
                          fontSize: '0.62rem', fontWeight: 600, color: 'var(--color-text)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>{CAT_EMOJI[t.category]} {t.task}</div>
                      : <div key={t.id} className="cal-dot" style={{ background: CAT_COLOR[t.category] || '#A78BFA' }} />
                  ))}
                  {dayTasks.length > (view === 'week' ? 4 : 3) && (
                    <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>+{dayTasks.length - (view === 'week' ? 4 : 3)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Selected Day Tasks ─────────────────────────────────────────── */}
      {selectedDay && (
        <div className="card fade-in-up" style={{ marginTop: '1rem' }}>
          <div className="section-title">
            📋 {format(selectedDay, 'EEEE, MMMM d')}
            {selectedTasks.length >= 2 && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.78rem', color: '#D97706', background: '#FEF3C7', padding: '0.2rem 0.5rem', borderRadius: 999 }}>
                ⚠️ Overloaded
              </span>
            )}
          </div>
          {selectedTasks.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No tasks for this day. Enjoy! 🎉</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {selectedTasks.map((t) => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem', borderRadius: 12,
                  borderLeft: `4px solid ${CAT_COLOR[t.category] || '#A78BFA'}`,
                  background: (CAT_COLOR[t.category] || '#A78BFA') + '0D',
                }}>
                  <span style={{ fontSize: '1.25rem' }}>{CAT_EMOJI[t.category] || '📌'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.task}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <span className={`badge badge-${t.priority?.toLowerCase()}`}>{t.priority}</span>
                      <span className={`badge badge-${t.category}`}>{t.category}</span>
                      {t.estimatedHours && <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>⏱ {t.estimatedHours}h</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Legend ────────────────────────────────────────────────────── */}
      <div className="card" style={{ marginTop: '1rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Legend:</span>
        {Object.entries(CAT_COLOR).map(([cat, color]) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{CAT_EMOJI[cat]} {cat}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #F59E0B' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>⚠️ Conflict</span>
        </div>
      </div>
    </div>
  );
}
