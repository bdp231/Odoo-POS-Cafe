import { useEffect, useState, useRef } from 'react';

export default function AnimatedCounter({ value, duration = 1500, prefix = '', suffix = '', decimals = 0 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef(null);
  const startValue = useRef(0);
  const animFrame = useRef(null);

  useEffect(() => {
    startValue.current = displayValue;
    startTime.current = null;

    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue.current + (value - startValue.current) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        animFrame.current = requestAnimationFrame(animate);
      }
    };

    animFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [value, duration]);

  const formatted = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toLocaleString();

  return (
    <span className="animated-counter">
      {prefix}{formatted}{suffix}
    </span>
  );
}
