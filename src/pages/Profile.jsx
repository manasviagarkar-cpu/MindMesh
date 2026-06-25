import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { localDb } from '../utils/localDb';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import CircularProgress from '../components/CircularProgress';

const TIMEZONES = [
  'Asia/Kolkata', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Dubai', 'Australia/Sydney',
];

const HABIT_KEYS = ['study', 'exercise', 'sleep', 'hydrate', 'journal'];

export default function Profile() {
  const { user, logOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ tasks: 0, relationships: 0, habitStreak: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    timezone: 'Asia/Kolkata',
    notifications: { email: true, push: false },
  });
  const [editMode, setEditMode] = useState(false);

  const firstName = user?.displayName?.split(' ')[0] || 'Friend';

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user]);

  async function loadProfile() {
    try {
      const [profData, allTasks, allRels, habitMap] = await Promise.all([
        localDb.getProfile(),
        localDb.getTasks(),
        localDb.getRelationships(),
        localDb.getHabits(),
      ]);

      setProfile(profData);
      setForm({
        displayName: profData.displayName || user.displayName || '',
        timezone: profData.timezone || 'Asia/Kolkata',
        notifications: profData.notifications || { email: true, push: false },
      });

      // Compute stats
      const tasksDone = allTasks.filter((t) => t.done).length;
      const rels = allRels.length;

      // Streak: consecutive days with any habit
      let streak = 0;
      let day = new Date();
      // skip today if nothing yet
      const todayKey = format(day, 'yyyy-MM-dd');
      const todayData = habitMap[todayKey] || {};
      if (!HABIT_KEYS.some((k) => todayData[k])) {
        day = new Date(day.getTime() - 86400000);
      }
      while (true) {
        const key = format(day, 'yyyy-MM-dd');
        const d = habitMap[key] || {};
        if (!HABIT_KEYS.some((k) => d[k])) break;
        streak++;
        day = new Date(day.getTime() - 86400000);
      }

      setStats({ tasks: tasksDone, relationships: rels, habitStreak: streak });
    } catch (e) {
      console.error('Profile load error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const updated = {
        ...profile,
        displayName: form.displayName.trim(),
        timezone: form.timezone,
        notifications: form.notifications,
        updatedAt: new Date().toISOString(),
      };
      await localDb.saveProfile(updated);
      setProfile(updated);
      setEditMode(false);
      toast.success('Profile updated! ✨');
    } catch (e) {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  const joinedDate = profile?.createdAt ? new Date(profile.createdAt) : null;
  const memberDays = joinedDate ? differenceInDays(new Date(), joinedDate) + 1 : null;

  const STAT_ITEMS = [
    { icon: '✅', label: 'Tasks Completed', value: stats.tasks, color: '#10B981' },
    { icon: '❤️',  label: 'Relationships', value: stats.relationships, color: '#F43F5E' },
    { icon: '🔥', label: 'Habit Streak', value: stats.habitStreak, suffix: 'days', color: '#F59E0B' },
    { icon: '🗓️', label: 'Days as Member', value: memberDays ?? '—', color: '#A78BFA' },
  ];

  if (loading) {
    return (
      <div className="fade-in-up" style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="skeleton" style={{ height: 180, borderRadius: 20 }} />
        <div className="skeleton" style={{ height: 100, borderRadius: 20 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 20 }} />
      </div>
    );
  }

  return (
    <div className="fade-in-up" style={{ maxWidth: 720, margin: '0 auto' }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>👤 My Profile</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Your MindMesh identity and settings
        </p>
      </div>

      {/* ── Identity Card ──────────────────────────────────────────── */}
      <div className="card" style={{
        marginBottom: '1.25rem',
        background: 'linear-gradient(135deg, rgba(167,139,250,0.06), rgba(253,186,116,0.05))',
        border: '1.5px solid rgba(167,139,250,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* Avatar */}
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={firstName}
              style={{
                width: 72, height: 72, borderRadius: 20, objectFit: 'cover',
                border: '3px solid rgba(167,139,250,0.3)',
                boxShadow: '0 4px 16px rgba(167,139,250,0.2)',
              }}
            />
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: 20, flexShrink: 0,
              background: 'linear-gradient(135deg, #A78BFA, #FDBA74)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '1.75rem',
              boxShadow: '0 4px 16px rgba(167,139,250,0.3)',
            }}>
              {firstName[0]}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-text)', lineHeight: 1.2 }}>
              {form.displayName || firstName}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              {user?.email}
            </div>
            {joinedDate && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                🗓️ Joined {format(joinedDate, 'MMMM d, yyyy')}
              </div>
            )}
          </div>

          <button
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? '✕ Cancel' : '✏️ Edit'}
          </button>
        </div>

        {/* Edit Form */}
        {editMode && (
          <div style={{
            marginTop: '1.25rem', paddingTop: '1.25rem',
            borderTop: '1px solid rgba(167,139,250,0.12)',
            display: 'flex', flexDirection: 'column', gap: '1rem',
            animation: 'fadeInUp 0.2s ease',
          }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.375rem' }}>
                Display Name
              </label>
              <input
                id="profile-name-input"
                className="input-field"
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder="Your name"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.375rem' }}>
                Timezone
              </label>
              <select
                id="profile-timezone-select"
                className="input-field"
                value={form.timezone}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.625rem' }}>
                Notifications
              </label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {[
                  { key: 'email', label: '📧 Email reminders' },
                  { key: 'push',  label: '🔔 Push notifications' },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
                  >
                    <input
                      type="checkbox"
                      id={`notif-${key}`}
                      checked={form.notifications[key]}
                      onChange={(e) => setForm((f) => ({ ...f, notifications: { ...f.notifications, [key]: e.target.checked } }))}
                      style={{ width: 16, height: 16, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
              <button
                id="save-profile-btn"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={saveProfile}
                disabled={saving}
              >
                {saving ? (
                  <><div className="spin-slow" style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} /> Saving…</>
                ) : '💾 Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Stats Grid ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.875rem', marginBottom: '1.25rem' }}>
        {STAT_ITEMS.map((s) => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem 1.25rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0,
              background: s.color + '18',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem',
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>
                {s.value}{s.suffix ? <span style={{ fontSize: '0.75rem', fontWeight: 600, marginLeft: 3 }}>{s.suffix}</span> : ''}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 500, marginTop: '0.125rem' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Habit Snapshot ─────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="section-title">🎯 Habit Overview</div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Streak', value: stats.habitStreak, color: '#F59E0B', icon: '🔥', suffix: 'days' },
            { label: 'Wellness', value: stats.habitStreak > 0 ? Math.min(100, stats.habitStreak * 5) : 0, color: '#A78BFA', isRing: true },
          ].map((item) => (
            item.isRing ? (
              <div key="ring" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <CircularProgress
                  percentage={item.value}
                  size={72}
                  strokeWidth={8}
                  color={item.color}
                  icon={<span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{item.value}%</span>}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Consistency</span>
              </div>
            ) : (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>{item.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '1.5rem', color: item.color }}>{item.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{item.suffix} {item.label}</div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* ── Account Actions ────────────────────────────────────────── */}
      <div className="card" style={{ border: '1.5px solid rgba(239,68,68,0.15)', background: '#FFFBFB' }}>
        <div className="section-title" style={{ color: '#DC2626' }}>⚙️ Account</div>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
          Your data is stored 100% locally on this device. Signing out will return you to the login screen.
        </p>
        <button
          id="signout-btn"
          className="btn"
          style={{
            background: '#FEE2E2', color: '#DC2626', border: '1.5px solid #FCA5A5',
            fontWeight: 600, transition: 'all 0.18s',
          }}
          onClick={async () => {
            await logOut();
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#FCA5A5'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#FEE2E2'; }}
        >
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}
