import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      toast.error('Sign-in failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FEFCE8 0%, #F5F0FF 50%, #FFF7ED 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 380, height: 380, borderRadius: '50%', background: 'rgba(167,139,250,0.12)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 380, height: 380, borderRadius: '50%', background: 'rgba(253,186,116,0.15)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div className="card fade-in-up" style={{ maxWidth: 440, width: '100%', padding: '3rem 2.5rem', textAlign: 'center', position: 'relative' }}>
        {/* Brand */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            width: 72, height: 72,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
            margin: '0 auto 1.25rem',
            boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
          }}>🧠</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.5rem', lineHeight: 1.2 }}>
            Welcome to<br />
            <span style={{ background: 'linear-gradient(135deg, #A78BFA, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              MindMesh
            </span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Your AI-powered life companion.<br />
            Voice, tasks, relationships — all in one place.
          </p>
        </div>

        {/* Feature Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}>
          {['🤖 ARIA Voice AI', '📅 Smart Calendar', '❤️ Relationship Pulse', '🎯 Habit Rings'].map((f) => (
            <span key={f} style={{ padding: '0.3rem 0.75rem', borderRadius: 999, background: 'rgba(167,139,250,0.1)', color: 'var(--color-primary)', fontSize: '0.78rem', fontWeight: 600, border: '1px solid rgba(167,139,250,0.2)' }}>{f}</span>
          ))}
        </div>

        {/* Guest Sign-in Button */}
        <button
          id="google-signin-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.875rem 1.5rem',
            borderRadius: 14,
            border: '1.5px solid rgba(167,139,250,0.25)',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--color-text)',
            transition: 'all 0.18s ease',
            boxShadow: '0 2px 8px rgba(167,139,250,0.12)',
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.boxShadow = '0 4px 16px rgba(167,139,250,0.25)')}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(167,139,250,0.12)')}
        >
          {loading ? (
            <div className="spin-slow" style={{ width: 20, height: 20, border: '2px solid #A78BFA', borderTopColor: 'transparent', borderRadius: '50%' }} />
          ) : (
            <span style={{ fontSize: '1.2rem' }}>⚡</span>
          )}
          {loading ? 'Initializing dashboard…' : 'Enter Dashboard as Guest'}
        </button>

        <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          All your tasks, habits, and preferences are stored securely on your local browser. <br />
          No backend configuration or login credentials required.
        </p>
      </div>
    </div>
  );
}
