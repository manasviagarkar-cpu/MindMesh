import { isFirebaseConfigured, firebaseConfig } from '../firebase';

export default function ConfigSetupGuide() {
  const isGeminiConfigured = !!import.meta.env.VITE_GEMINI_API_KEY;

  const vars = [
    { name: 'VITE_FIREBASE_API_KEY', value: firebaseConfig.apiKey, desc: 'Firebase Authentication API key' },
    { name: 'VITE_FIREBASE_PROJECT_ID', value: firebaseConfig.projectId, desc: 'Firebase Database Project Identifier' },
    { name: 'VITE_GEMINI_API_KEY', value: import.meta.env.VITE_GEMINI_API_KEY, desc: 'Google AI Studio key for ARIA companion' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #1E1B4B, #0F172A)',
      fontFamily: 'Inter, sans-serif',
      color: '#F8FAFC',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: '640px',
        width: '100%',
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(167, 139, 250, 0.2)',
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #C084FC, #A78BFA)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.025em',
            marginBottom: '0.5rem',
          }}>
            API Configuration Required
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.92rem', lineHeight: 1.5 }}>
            MindMesh is successfully deployed, but some mandatory environment variables are missing from your configuration.
          </p>
        </div>

        {/* Status Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '2.5rem' }}>
          {vars.map((v) => {
            const ok = !!v.value;
            return (
              <div key={v.name} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: ok ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: `1.5px solid ${ok ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                borderRadius: '16px',
                padding: '1rem 1.25rem',
              }}>
                <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>
                  {ok ? '🟢' : '🔴'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', fontFamily: 'monospace', color: ok ? '#34D399' : '#F87171' }}>
                    {v.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                    {v.desc}
                  </div>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: ok ? '#34D399' : '#F87171' }}>
                  {ok ? 'Configured' : 'Missing'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action Steps */}
        <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: '2rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '1rem' }}>
            🚀 How to Fix This on Vercel:
          </h2>
          <ol style={{
            fontSize: '0.85rem',
            color: '#94A3B8',
            lineHeight: 1.6,
            paddingLeft: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}>
            <li>
              Open your <strong>Vercel Dashboard</strong> and select your project.
            </li>
            <li>
              Navigate to <strong>Settings</strong> &gt; <strong>Environment Variables</strong>.
            </li>
            <li>
              Add the missing variables listed above. Refer to <code>.env.example</code> for standard key names.
            </li>
            <li>
              Go to the <strong>Deployments</strong> tab, click the three dots on your latest deployment, select <strong>Redeploy</strong>, and make sure to uncheck "Use existing build cache" to run a fresh build.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
