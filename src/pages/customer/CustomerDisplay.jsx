import { NavLink, Outlet, useLocation, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, UtensilsCrossed, Home } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function CustomerDisplay() {
  const location = useLocation();
  const { dispatch } = useApp();

  if (location.pathname === '/customer') {
    return <Navigate to="/customer/order-status" replace />;
  }

  return (
    <div className="customer-layout">
      {/* Customer Header */}
      <div className="customer-header">
        <div className="customer-header-brand">
          <span>☕</span>
          <span>Odoo POS Cafe</span>
        </div>
        <Link to="/" className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)' }}>
          <Home size={16} />
          <span>Home</span>
        </Link>
      </div>

      {/* Navigation Pills */}
      <div className="customer-nav">
        <NavLink
          to="/customer/order-status"
          className={({ isActive }) => `pill-btn ${isActive ? 'active' : ''}`}
        >
          <ClipboardList size={18} />
          My Order
        </NavLink>
        <NavLink
          to="/customer/menu"
          className={({ isActive }) => `pill-btn ${isActive ? 'active' : ''}`}
        >
          <UtensilsCrossed size={18} />
          Live Menu
        </NavLink>
      </div>

      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Outlet />
      </motion.div>
    </div>
  );
}
