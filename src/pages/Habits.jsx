import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import CircularProgress from '../components/CircularProgress';
import toast from 'react-hot-toast';

const HABITS = [
  { key: 'study',    label: 'Study',    emoji: '📚', color: '#A78BFA', desc: 'Learn something new' },
  { key: 'exercise', label: 'Exercise', emoji: '💪', color: '#6EE7B7', desc: 'Move your body' },
  { key: 'sleep',    label: 'Sleep',    emoji: '😴', color: '#93C5FD', desc: '7–8 hours of rest' },
  { key: 'hydrate',  label: 'Hydrate',  emoji: '💧', color: '#67E8F9', desc: 'Drink enough water' },
  { key: 'journal',  label: 'Journal',  emoji: '✍️',  color: '#FCD34D', desc: 'Reflect & write' },
];

const TODAY = format(new Date(), 'yyyy-MM-dd');

export default function Habits() {
  const { user } = useAuth();
  const [todayHabits, setTodayHabits] = useState({});
  const [weekHistory, setWeekHistory] = useState({});  // { 'yyyy-MM-dd': { study: true, ... } }
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // which habit key is saving

  const last7 = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() })
    .map((d) => format(d, 'yyyy-MM-dd'));

  useEffect(() => {
    if (!user) return;
    loadHabits();
  }, [user]);

  async function loadHabits() {
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'habits'));
      const all = {};
      snap.docs.forEach((d) => { all[d.id] = d.data(); });

      setWeekHistory(all);
      setTodayHabits(all[TODAY] || {});
      setStreak(computeStreak(all));
    } catch (e) {
      console.error('Habits load error:', e);
    } finally {
      setLoading(false);
    }
  }

  function computeStreak(all) {
    let count = 0;
    let day = new Date();
    // Don't count today if nothing done yet
    const todayData = all[format(day, 'yyyy-MM-dd')] || {};
    const todayDone = HABITS.some((h) => todayData[h.key]);
    if (!todayDone) day = subDays(day, 1);

    while (true) {
      const key = format(day, 'yyyy-MM-dd');
      const data = all[key] || {};
      const anyDone = HABITS.some((h) => data[h.key]);
      if (!anyDone) break;
      count++;
      day = subDays(day, 1);
    }
    return count;
  }

  async function toggleHabit(key) {
    const newVal = !todayHabits[key];
    const updated = { ...todayHabits, [key]: newVal };
    setTodayHabits(updated);

    // Optimistically update week history
    setWeekHistory((prev) => ({ ...prev, [TODAY]: updated }));
    setStreak(computeStreak({ ...weekHistory, [TODAY]: updated }));

    setSaving(key);
    try {
      await setDoc(doc(db, 'users', user.uid, 'habits', TODAY), updated, { merge: true });
      toast.success(newVal ? `${HABITS.find(h => h.key === key)?.emoji} Great job!` : 'Habit unchecked', {
        duration: 1500,
      });
    } catch (e) {
      // revert on failure
      setTodayHabits(todayHabits);
      toast.error('Failed to save habit');
    } finally {
      setSaving(null);
    }
  }

  const completedCount = HABITS.filter((h) => todayHabits[h.key]).length;
  const wellnessPct = Math.round((completedCount / HABITS.length) * 100);

  const motivationMsg = wellnessPct === 100
    ? '🌟 Perfect day! You\'re on fire!'
    : wellnessPct >= 60
      ? '💪 Great momentum, keep going!'
      : wellnessPct >= 20
        ? '🌱 Good start — build on it!'
        : '✨ Your journey starts with one habit.';

  if (loading) {
    return (
      <div className="fade-in-up" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ height: 40, width: 200, borderRadius: 8 }} className="skeleton" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
          {HABITS.map((_, i) => <div key={i} className="skeleton" style={{ height: 130, borderRadius: 20 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-up" style={{ maxWidth: 720, margin: '0 auto' }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>🎯 Daily Habits</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            {format(new Date(), 'EEEE, MMMM d')} · Build your ideal day
          </p>
        </div>

        {/* Streak Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 1.1rem', borderRadius: 999,
          background: streak > 0
            ? 'linear-gradient(135deg, #FEF3C7, #FDE68A)'
            : 'rgba(167,139,250,0.08)',
          border: streak > 0 ? '1.5px solid #F59E0B' : '1.5px solid rgba(167,139,250,0.2)',
        }}>
          <span className={streak > 0 ? 'fire-emoji' : ''} style={{ fontSize: '1.3rem' }}>
            {streak > 0 ? '🔥' : '✨'}
          </span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: streak > 0 ? '#92400E' : 'var(--color-primary)', lineHeight: 1 }}>
              {streak}
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: streak > 0 ? '#B45309' : 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              day streak
            </div>
          </div>
        </div>
      </div>

      {/* ── Overall Wellness Ring ──────────────────────────────────── */}
      <div className="card" style={{
        display: 'flex', alignItems: 'center', gap: '1.5rem',
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, rgba(167,139,250,0.06), rgba(253,186,116,0.05))',
        border: '1.5px solid rgba(167,139,250,0.12)',
        flexWrap: 'wrap',
      }}>
        <CircularProgress
          percentage={wellnessPct}
          size={96}
          strokeWidth={10}
          color="#A78BFA"
          icon={<span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>{wellnessPct}%</span>}
        />
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>Today's Wellness</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.625rem' }}>{motivationMsg}</div>
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            {HABITS.map((h) => (
              <div
                key={h.key}
                title={h.label}
                style={{
                  width: 28, height: 28, borderRadius: 8, fontSize: '0.875rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: todayHabits[h.key] ? h.color + '30' : '#F1F5F9',
                  border: `1.5px solid ${todayHabits[h.key] ? h.color : 'transparent'}`,
                  transition: 'all 0.2s',
                  opacity: todayHabits[h.key] ? 1 : 0.45,
                }}
              >{h.emoji}</div>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>{completedCount}/{HABITS.length}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>done today</div>
        </div>
      </div>

      {/* ── Habit Toggle Cards ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
        {HABITS.map((habit) => {
          const done = !!todayHabits[habit.key];
          const isSaving = saving === habit.key;
          return (
            <button
              key={habit.key}
              id={`habit-${habit.key}`}
              onClick={() => toggleHabit(habit.key)}
              disabled={isSaving}
              style={{
                all: 'unset',
                cursor: isSaving ? 'wait' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: '0.625rem',
                padding: '1.25rem 1rem',
                borderRadius: 20,
                background: done
                  ? `linear-gradient(135deg, ${habit.color}22, ${habit.color}10)`
                  : 'var(--color-card)',
                border: done
                  ? `2px solid ${habit.color}60`
                  : '2px solid rgba(167,139,250,0.08)',
                boxShadow: done
                  ? `0 4px 20px ${habit.color}25`
                  : '0 2px 12px rgba(0,0,0,0.04)',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: done ? 'scale(1.02)' : 'scale(1)',
                userSelect: 'none',
              }}
            >
              {/* Emoji */}
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: done ? habit.color + '25' : '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem',
                transition: 'all 0.2s',
                boxShadow: done ? `0 2px 8px ${habit.color}40` : 'none',
              }}>
                {isSaving ? <div className="spin-slow" style={{ width: 22, height: 22, border: `2px solid ${habit.color}`, borderTopColor: 'transparent', borderRadius: '50%' }} />
                  : habit.emoji}
              </div>

              {/* Label */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: done ? habit.color : 'var(--color-text)' }}>
                  {habit.label}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
                  {habit.desc}
                </div>
              </div>

              {/* Check indicator */}
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                border: `2px solid ${done ? habit.color : '#CBD5E1'}`,
                background: done ? habit.color : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                fontSize: '0.7rem', color: 'white',
              }}>
                {done && '✓'}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── 7-Day History Grid ─────────────────────────────────────── */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: '1.25rem' }}>📆 This Week's Progress</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {last7.map((dateStr) => {
            const data = weekHistory[dateStr] || {};
            const done = HABITS.filter((h) => data[h.key]).length;
            const pct = (done / HABITS.length) * 100;
            const isToday = dateStr === TODAY;
            const label = format(new Date(dateStr + 'T00:00:00'), 'EEE');
            const dayNum = format(new Date(dateStr + 'T00:00:00'), 'd');

            return (
              <div key={dateStr} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
                <div style={{
                  fontSize: '0.65rem', fontWeight: 700,
                  color: isToday ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>{label}</div>

                {/* Mini circular progress */}
                <CircularProgress
                  percentage={pct}
                  size={40}
                  strokeWidth={5}
                  color={pct === 100 ? '#10B981' : pct >= 60 ? '#A78BFA' : pct > 0 ? '#FCD34D' : '#CBD5E1'}
                  trackColor="#E2E8F0"
                  icon={
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      {done > 0 ? done : ''}
                    </span>
                  }
                />

                <div style={{
                  fontSize: '0.72rem', fontWeight: isToday ? 700 : 500,
                  color: isToday ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }}>{dayNum}</div>
              </div>
            );
          })}
        </div>

        {/* Habit legend below grid */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(167,139,250,0.08)' }}>
          {HABITS.map((h) => (
            <div key={h.key} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: h.color }} />
              {h.emoji} {h.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Tips Banner ───────────────────────────────────────────── */}
      <div className="card" style={{
        marginTop: '1rem',
        background: 'linear-gradient(135deg, #F0FDF4, #D1FAE5)',
        border: '1.5px solid #6EE7B7',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: '2rem' }}>🧠</div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 700, color: '#065F46', marginBottom: '0.2rem', fontSize: '0.9rem' }}>Habit Science Tip</div>
          <p style={{ color: '#047857', fontSize: '0.8rem', lineHeight: 1.5 }}>
            Consistency beats intensity. Even completing 3/5 habits daily for 30 days is transformative. Talk to ARIA to build a personalized routine!
          </p>
        </div>
      </div>
    </div>
  );
}
