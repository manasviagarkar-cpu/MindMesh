import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="voice-btn-wrapper" style={{ margin: '0 auto 1rem' }}>
            <div className="voice-btn" style={{ cursor: 'default' }}>🧠</div>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Loading MindMesh…</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
