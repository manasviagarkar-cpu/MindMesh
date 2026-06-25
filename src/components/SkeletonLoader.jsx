// Simple skeleton loader for cards and lists
export function SkeletonCard({ height = 100 }) {
  return (
    <div className="skeleton" style={{ height, borderRadius: 20, marginBottom: 12 }} />
  );
}

export function SkeletonText({ width = '100%', height = 16 }) {
  return <div className="skeleton" style={{ width, height, borderRadius: 6, marginBottom: 8 }} />;
}

export function SkeletonAvatar({ size = 48 }) {
  return <div className="skeleton" style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0 }} />;
}

export function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SkeletonText width="240px" height={32} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <SkeletonCard height={160} />
        <SkeletonCard height={160} />
        <SkeletonCard height={160} />
      </div>
      <SkeletonCard height={200} />
    </div>
  );
}
