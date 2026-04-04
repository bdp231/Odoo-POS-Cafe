import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Monitor, CreditCard, BarChart3, ArrowRight } from 'lucide-react';
import BlurText from '../components/ui/BlurText';
import SpotlightCard from '../components/ui/SpotlightCard';
import ShimmerButton from '../components/ui/ShimmerButton';
import Marquee from '../components/ui/Marquee';

const features = [
  {
    icon: <Zap size={28} />,
    title: 'Fast Billing',
    description: 'Lightning-fast POS terminal with intuitive product selection and instant order processing.',
  },
  {
    icon: <Monitor size={28} />,
    title: 'Kitchen Display',
    description: 'Real-time kitchen Kanban board with order tracking, food availability, and status updates.',
  },
  {
    icon: <CreditCard size={28} />,
    title: 'Multi-Payment',
    description: 'Accept Cash, Digital payments, and UPI QR codes with seamless payment processing.',
  },
  {
    icon: <BarChart3 size={28} />,
    title: 'Real-time Reports',
    description: 'Comprehensive sales analytics with charts, filters, and exportable reports.',
  },
];

const floatingFoods = ['🍕', '🍔', '☕', '🍝', '🥗', '🍰', '🍟', '🥖'];

export default function Landing() {
  return (
    <div className="page-transition">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="floating-icons">
          {floatingFoods.map((emoji, i) => (
            <span key={i} className="floating-icon">{emoji}</span>
          ))}
        </div>

        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="hero-title">
            <BlurText text="Modern Restaurant POS" delay={0.2} />
            <br />
            <span style={{ color: 'var(--primary)' }}>
              <BlurText text="— Serving Smarter" delay={0.8} />
            </span>
          </h1>
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            Streamline your restaurant operations with our all-in-one POS system.
            From order management to kitchen coordination and real-time analytics.
          </motion.p>
          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
          >
            <Link to="/signup">
              <ShimmerButton className="btn-lg">
                Get Started <ArrowRight size={18} />
              </ShimmerButton>
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Login
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Marquee */}
      <section className="stats-bar" id="stats">
        <Marquee speed={25}>
          <span style={{ fontSize: '0.938rem', fontWeight: 600, letterSpacing: '0.03em' }}>
            ⚡ 500+ Orders/Day
          </span>
          <span style={{ fontSize: '0.938rem', fontWeight: 600, letterSpacing: '0.03em' }}>
            💳 3 Payment Methods
          </span>
          <span style={{ fontSize: '0.938rem', fontWeight: 600, letterSpacing: '0.03em' }}>
            🍳 Real-time Kitchen Sync
          </span>
          <span style={{ fontSize: '0.938rem', fontWeight: 600, letterSpacing: '0.03em' }}>
            📊 Live Sales Analytics
          </span>
          <span style={{ fontSize: '0.938rem', fontWeight: 600, letterSpacing: '0.03em' }}>
            🪑 Floor & Table Management
          </span>
          <span style={{ fontSize: '0.938rem', fontWeight: 600, letterSpacing: '0.03em' }}>
            📱 Mobile-First Design
          </span>
        </Marquee>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="container">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Everything You Need to Run Your Restaurant</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', fontSize: '1.063rem' }}>
              Powerful features designed for modern restaurant management
            </p>
          </motion.div>

          <div className="features-grid">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <SpotlightCard>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--primary-bg)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    {feature.icon}
                  </div>
                  <h4 style={{ marginBottom: '0.5rem' }}>{feature.title}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    {feature.description}
                  </p>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div>
            <div className="footer-brand">☕ Odoo POS Cafe</div>
            <p style={{ fontSize: '0.875rem', maxWidth: 300 }}>
              Modern restaurant management system built for speed, efficiency, and great customer experience.
            </p>
          </div>
          <div>
            <h4 style={{ color: 'white', fontSize: '0.938rem', marginBottom: '0.75rem' }}>Quick Links</h4>
            <div className="footer-links">
              <Link to="/login" className="footer-link">Login</Link>
              <Link to="/signup" className="footer-link">Sign Up</Link>
            </div>
          </div>
          <div>
            <h4 style={{ color: 'white', fontSize: '0.938rem', marginBottom: '0.75rem' }}>Features</h4>
            <div className="footer-links">
              <span className="footer-link">POS Terminal</span>
              <span className="footer-link">Kitchen Display</span>
              <span className="footer-link">Reports</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 Odoo POS Cafe. Built with ❤️ for restaurant excellence.
        </div>
      </footer>
    </div>
  );
}
