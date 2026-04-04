import { useState } from 'react';

export default function GlowCard({ children, className = '', glowColor = 'rgba(196, 92, 38, 0.4)', style = {} }) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className={`glow-card ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        position: 'relative',
        background: 'var(--card-bg)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        boxShadow: isHovering
          ? `0 0 30px ${glowColor}, var(--card-shadow-hover)`
          : 'var(--card-shadow)',
        transform: isHovering ? 'translateY(-4px)' : 'none',
        border: `1px solid ${isHovering ? glowColor : 'var(--border-light)'}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
