import { useState, useRef, useEffect } from 'react';

export default function SpotlightCard({ children, className = '', style = {} }) {
  const cardRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      className={`spotlight-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--card-bg)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--card-shadow)',
        padding: '2rem',
        transition: 'box-shadow 0.3s ease, transform 0.3s ease',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isHovering ? 1 : 0,
          transition: 'opacity 0.3s ease',
          background: `radial-gradient(350px circle at ${position.x}px ${position.y}px, rgba(196, 92, 38, 0.08), transparent 60%)`,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
