import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/',           icon: '🏠', label: 'Dashboard' },
  { to: '/aria',       icon: '🤖', label: 'ARIA Chat' },
  { to: '/calendar',   icon: '📅', label: 'Calendar' },
  { to: '/pulse',      icon: '❤️',  label: 'Pulse' },
  { to: '/habits',     icon: '🎯', label: 'Habits' },
  { to: '/profile',    icon: '👤', label: 'Profile' },
];

export default function Layout({ children }) {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logOut();
    navigate('/login');
  };

  const firstName = user?.displayName?.split(' ')[0] || 'Friend';

  return (
    <div className="app-layout">
      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '0 0.5rem 1.5rem', borderBottom: '1px solid rgba(167,139,250,0.12)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 38, height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem'
            }}>🧠</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)', lineHeight: 1 }}>MindMesh</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>Life companion</div>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div style={{
          borderTop: '1px solid rgba(167,139,250,0.12)',
          paddingTop: '1rem',
          marginTop: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
        }}>
          {user?.photoURL
            ? <img src={user.photoURL} alt={firstName} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #A78BFA, #FDBA74)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{firstName[0]}</div>
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0.25rem', borderRadius: 8, color: 'var(--color-text-muted)', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#DC2626'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
          >🚪</button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="main-content">
        {children}
      </main>

      {/* ── Mobile Bottom Nav ─────────────────────────────────────────── */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              padding: '0.4rem 0.5rem', borderRadius: 10, textDecoration: 'none',
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
              background: isActive ? 'rgba(167,139,250,0.12)' : 'transparent',
              fontSize: '0.62rem', fontWeight: 600, transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
