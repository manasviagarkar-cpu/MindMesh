import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { format, differenceInDays, addDays, formatDistanceToNow } from 'date-fns';
import CircularProgress from '../components/CircularProgress';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import { localDb } from '../utils/localDb';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good afternoon', emoji: '🌤️' };
  return { text: 'Good evening', emoji: '🌙' };
}

const PRIORITY_STYLE = {
  HIGH:   { badge: 'badge-high',   bar: '#FCA5A5', dot: '#EF4444' },
  MEDIUM: { badge: 'badge-medium', bar: '#FCD34D', dot: '#F59E0B' },
  LOW:    { badge: 'badge-low',    bar: '#6EE7B7', dot: '#10B981' },
};

const CAT_EMOJI = { work: '💼', personal: '🌸', relationship: '❤️', health: '💪' };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [habits, setHabits] = useState(null);
  const [loading, setLoading] = useState(true);
  const greeting = getGreeting();
  const firstName = user?.displayName?.split(' ')[0] || 'Friend';

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    try {
      const allTasks = await localDb.getTasks();
      const pendingTasks = allTasks.filter((t) => !t.done);
      
      // Top 3 priority tasks: sort HIGH first
      const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      const prioritySorted = [...pendingTasks].sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3));
      setTasks(prioritySorted.slice(0, 3));

      // Next 3 deadlines: sort by deadline ascending
      const upcoming = [...pendingTasks]
        .filter((t) => t.deadline)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 3);
      setDeadlines(upcoming);

      // Relationships needing attention (sort by days since contact desc)
      const rels = await localDb.getRelationships();
      const sortedRels = [...rels].sort((a, b) => {
        const dA = a.lastConnected ? differenceInDays(new Date(), new Date(a.lastConnected)) : 999;
        const dB = b.lastConnected ? differenceInDays(new Date(), new Date(b.lastConnected)) : 999;
        return dB - dA;
      });
      setRelationships(sortedRels.slice(0, 1)); // top nudge

      // Today's habits
      const today = format(new Date(), 'yyyy-MM-dd');
      const habitsMap = await localDb.getHabits();
      setHabits(habitsMap[today] || {});
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  }

  // Wellness score: % of today's habits completed
  const HABIT_KEYS = ['study', 'exercise', 'sleep', 'hydrate', 'journal'];
  const completedHabits = habits ? HABIT_KEYS.filter((k) => habits[k]).length : 0;
  const wellnessScore = Math.round((completedHabits / HABIT_KEYS.length) * 100);

  // Connection nudge
  const nudgePerson = relationships[0];
  const nudgeDays = nudgePerson?.lastConnected
    ? differenceInDays(new Date(), new Date(nudgePerson.lastConnected))
    : null;

  const getDeadlineCountdown = (deadline) => {
    if (!deadline) return null;
    const d = new Date(deadline);
    const days = differenceInDays(d, new Date());
    if (days < 0)  return { label: 'Overdue',       color: '#EF4444' };
    if (days === 0) return { label: 'Due today!',    color: '#F59E0B' };
    if (days === 1) return { label: 'Due tomorrow',  color: '#F59E0B' };
    return { label: `${days} days left`, color: '#10B981' };
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="fade-in-up" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
          {greeting.text}, {firstName} {greeting.emoji}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
          {format(new Date(), 'EEEE, MMMM d')} · Here's your day
        </p>
      </div>

      {/* ── Top Row: Tasks + Wellness ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* Priority Tasks */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="section-title">
            🔥 Today's Priorities
            <span style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-muted)', cursor: 'pointer' }} onClick={() => navigate('/aria')}>
              + Add task
            </span>
          </div>
          {tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
              <p>All clear! Add tasks by chatting with ARIA.</p>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/aria')}>
                Chat with ARIA
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tasks.map((task, i) => {
                const ps = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.MEDIUM;
                return (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '0.875rem', borderRadius: 14,
                    background: i === 0 ? 'rgba(167,139,250,0.06)' : '#FAFAFA',
                    border: i === 0 ? '1.5px solid rgba(167,139,250,0.15)' : '1px solid #F1F5F9',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ width: 4, height: 48, borderRadius: 4, background: ps.dot, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {CAT_EMOJI[task.category] || '📌'} {task.task}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className={`badge ${ps.badge}`}>{task.priority}</span>
                        <span className={`badge badge-${task.category}`}>{task.category}</span>
                        {task.deadline && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                            📅 {format(new Date(task.deadline), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                    {task.estimatedHours && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>⏱ {task.estimatedHours}h</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Wellness Score */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
          <div className="section-title" style={{ marginBottom: '1.25rem' }}>✨ Wellness Score</div>
          <CircularProgress
            percentage={wellnessScore}
            size={100}
            strokeWidth={10}
            color="#A78BFA"
            icon={<span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text)' }}>{wellnessScore}%</span>}
          />
          <p style={{ marginTop: '0.875rem', fontSize: '0.82rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            {wellnessScore >= 80 ? '🌟 Crushing it today!' :
             wellnessScore >= 50 ? '💪 Good progress!' :
             '🌱 Let\'s build some habits!'}
          </p>
          <button className="btn btn-ghost" style={{ marginTop: '0.75rem', fontSize: '0.78rem', padding: '0.4rem 0.875rem' }} onClick={() => navigate('/habits')}>
            View habits →
          </button>
        </div>
      </div>

      {/* ── Middle Row: Deadlines + Nudge ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Deadlines */}
        <div className="card">
          <div className="section-title">⏰ Upcoming Deadlines</div>
          {deadlines.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>No deadlines set. Tell ARIA about your upcoming work!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {deadlines.map((task) => {
                const cd = getDeadlineCountdown(task.deadline);
                return (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 12, background: '#FAFAFA', border: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: '1.5rem' }}>{CAT_EMOJI[task.category] || '📌'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.task}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                        {task.deadline ? format(new Date(task.deadline), 'EEE, MMM d') : '—'}
                      </div>
                    </div>
                    {cd && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: cd.color, background: cd.color + '18', padding: '0.2rem 0.5rem', borderRadius: 999, flexShrink: 0 }}>
                        {cd.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Relationship Nudge */}
        <div className="card">
          <div className="section-title">❤️ Relationship Pulse</div>
          {nudgePerson && nudgeDays !== null ? (
            <div>
              <div style={{
                background: 'linear-gradient(135deg, #FFF7ED, #FEF3C7)',
                border: '1.5px solid #FDBA74',
                borderRadius: 14,
                padding: '1rem',
                marginBottom: '0.875rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '2rem' }}>{nudgePerson.emoji || '👤'}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{nudgePerson.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{nudgePerson.type}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700, color: nudgeDays > 21 ? '#DC2626' : nudgeDays > 7 ? '#B45309' : '#059669', background: nudgeDays > 21 ? '#FEE2E2' : nudgeDays > 7 ? '#FFFBEB' : '#D1FAE5', padding: '0.2rem 0.5rem', borderRadius: 999 }}>
                    {nudgeDays}d ago
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#92400E', lineHeight: 1.5 }}>
                  💛 Haven't connected with <strong>{nudgePerson.name}</strong> in {nudgeDays} days. How about a quick message?
                </p>
              </div>
              <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/pulse')}>
                View All Relationships →
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌟</div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>You're well connected! Add people to track relationships.</p>
              <button className="btn btn-ghost" style={{ marginTop: '0.875rem' }} onClick={() => navigate('/pulse')}>Add People →</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Voice CTA ─────────────────────────────────────────────────── */}
      <div className="card" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '1rem', padding: '2.5rem',
        background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(253,186,116,0.06))',
        border: '1.5px solid rgba(167,139,250,0.15)',
        textAlign: 'center',
      }}>
        <div className="voice-btn-wrapper">
          <button className="voice-btn" id="dashboard-voice-btn" onClick={() => navigate('/aria')} title="Chat with ARIA">
            🎙️
          </button>
        </div>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.25rem' }}>Talk to ARIA</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Speak or type — I'll organize your life ✨</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/aria')}>Open ARIA Chat →</button>
      </div>
    </div>
  );
}
