export default function AnimatedBorderCard({ children, className = '', active = false, style = {} }) {
  return (
    <div
      className={`animated-border-card ${active ? 'pulse-animation' : ''} ${className}`}
      style={{
        position: 'relative',
        background: 'var(--card-bg)',
        borderRadius: 'var(--radius-lg)',
        padding: '2px',
        overflow: 'hidden',
        ...style,
      }}
    >
      {active && (
        <div
          style={{
            position: 'absolute',
            inset: '-50%',
            background: 'conic-gradient(from 0deg, var(--primary), var(--accent), var(--primary))',
            animation: 'glow-rotate 3s linear infinite',
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          background: 'var(--card-bg)',
          borderRadius: 'calc(var(--radius-lg) - 2px)',
          padding: '1rem',
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}
