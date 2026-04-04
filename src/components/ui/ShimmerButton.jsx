export default function ShimmerButton({ children, onClick, className = '', style = {}, ...props }) {
  return (
    <button
      onClick={onClick}
      className={`btn btn-primary shimmer-btn ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      {...props}
    >
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2.5s ease-in-out infinite',
        }}
      />
    </button>
  );
}
