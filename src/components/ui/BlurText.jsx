import { motion } from 'framer-motion';

export default function BlurText({ text, className = '', delay = 0, duration = 0.5 }) {
  const words = text.split(' ');

  return (
    <span className={className} style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.3em' }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ filter: 'blur(8px)', opacity: 0, y: 10 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{
            duration,
            delay: delay + i * 0.08,
            ease: 'easeOut',
          }}
          style={{ display: 'inline-block' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
