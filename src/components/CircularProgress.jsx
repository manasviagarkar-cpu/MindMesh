// Reusable SVG circular progress ring (Apple Watch style)
export default function CircularProgress({
  percentage = 0,
  size = 80,
  strokeWidth = 8,
  color = '#A78BFA',
  trackColor,
  label,
  icon,
  children,
}) {
  const radius  = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset  = circumference - (Math.min(percentage, 100) / 100) * circumference;
  const tc      = trackColor || color;

  return (
    <div className="habit-ring-wrap">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tc}
          strokeWidth={strokeWidth}
          className="ring-track"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="ring-progress"
        />
        {/* Inner content */}
        {(icon || children) && (
          <foreignObject x={strokeWidth} y={strokeWidth} width={size - strokeWidth * 2} height={size - strokeWidth * 2}>
            <div
              style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: 'rotate(90deg)',
                fontSize: size > 70 ? '1.5rem' : '1rem',
              }}
            >
              {icon || children}
            </div>
          </foreignObject>
        )}
      </svg>
      {label && (
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'center' }}>
          {label}
        </div>
      )}
    </div>
  );
}
