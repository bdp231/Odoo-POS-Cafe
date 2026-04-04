export default function Marquee({ children, speed = 30, className = '' }) {
  return (
    <div className={`marquee-container ${className}`} style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
      <div
        className="marquee-track"
        style={{
          display: 'inline-flex',
          animation: `marquee-scroll ${speed}s linear infinite`,
          gap: '3rem',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3rem' }}>{children}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3rem' }}>{children}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3rem' }}>{children}</span>
      </div>
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
