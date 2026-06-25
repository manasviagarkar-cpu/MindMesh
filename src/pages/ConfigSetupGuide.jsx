export default function ConfigSetupGuide() {
  const isGeminiConfigured = !!import.meta.env.VITE_GEMINI_API_KEY;

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
            AI API Key Required
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.92rem', lineHeight: 1.5 }}>
            MindMesh is running locally, but requires a Gemini API Key to enable the ARIA conversational assistant.
          </p>
        </div>

        {/* Status Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: isGeminiConfigured ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: `1.5px solid ${isGeminiConfigured ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
            borderRadius: '16px',
            padding: '1rem 1.25rem',
          }}>
            <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>
              {isGeminiConfigured ? '🟢' : '🔴'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', fontFamily: 'monospace', color: isGeminiConfigured ? '#34D399' : '#F87171' }}>
                VITE_GEMINI_API_KEY
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                Google AI Studio API Key for the ARIA productivity engine.
              </div>
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isGeminiConfigured ? '#34D399' : '#F87171' }}>
              {isGeminiConfigured ? 'Configured' : 'Missing'}
            </span>
          </div>
        </div>

        {/* Action Steps */}
        <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: '2rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '1rem' }}>
            🚀 How to set this key:
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
              Obtain a free API Key from the <strong><a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#A78BFA', textDecoration: 'underline' }}>Google AI Studio Console</a></strong>.
            </li>
            <li>
              <strong>For Local Runs:</strong> Add <code>VITE_GEMINI_API_KEY=your_key_here</code> inside a <code>.env</code> file in your project root.
            </li>
            <li>
              <strong>For Vercel Runs:</strong> Go to Project Settings &gt; Environment Variables, add <code>VITE_GEMINI_API_KEY</code>, and trigger a Redeploy.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
