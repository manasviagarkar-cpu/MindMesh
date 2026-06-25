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

        {/* Sign-in Button */}
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
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          By signing in, you agree that your data is stored securely in Firebase.<br />
          No passwords stored — Google OAuth only.
        </p>
      </div>
    </div>
  );
}
