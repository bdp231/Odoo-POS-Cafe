import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { LogOut, User, Menu, X, ChefHat, ShieldCheck, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const roleConfig = {
  admin: { label: 'Admin', icon: ShieldCheck, className: 'admin' },
  kitchen: { label: 'Kitchen', icon: ChefHat, className: 'kitchen' },
  customer: { label: 'Customer', icon: Coffee, className: 'customer' },
};

export default function Navbar({ onToggleSidebar }) {
  const { state, dispatch } = useApp();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLanding = location.pathname === '/';
  const isAuth = ['/login', '/signup'].includes(location.pathname);
  const isAdmin = location.pathname.startsWith('/admin');
  const isCustomer = location.pathname.startsWith('/customer');
  const isPublic = isLanding || isAuth || isCustomer;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    setMobileMenuOpen(false);
  };

  const userRole = state.currentUser?.role;
  const RoleIcon = userRole ? roleConfig[userRole]?.icon : null;

  return (
    <nav className="navbar">
      <div className="navbar-content">
        {/* Left section: sidebar toggle (admin only on mobile) + logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isAdmin && (
            <button
              className="sidebar-hamburger"
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
            >
              <Menu size={22} />
            </button>
          )}
          <Link to="/" className="navbar-logo">
            <span className="navbar-logo-icon">☕</span>
            Odoo POS Cafe
          </Link>
        </div>

        {/* Center: Desktop nav links (landing/auth pages only) */}
        {isPublic && (
          <div className="navbar-links">
            <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}>
              Home
            </Link>
            <a href="#features" className="navbar-link">Features</a>
            <a href="#stats" className="navbar-link">Stats</a>
            <Link to="/customer" className={`navbar-link ${isCustomer ? 'active' : ''}`}>
              Customer Portal
            </Link>
          </div>
        )}

        {/* Right section */}
        <div className="navbar-actions">
          {state.currentUser ? (
            <>
              {/* Role indicator */}
              {userRole && (
                <span className={`role-indicator ${roleConfig[userRole]?.className}`}>
                  {RoleIcon && <RoleIcon size={12} />}
                  {roleConfig[userRole]?.label}
                </span>
              )}
              {/* Session badge (desktop only) */}
              {state.currentSession && (
                <span className="badge badge-success">Session Open</span>
              )}
              {/* Desktop logout */}
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          )}

          {/* Mobile hamburger — for public/non-admin pages, or logged-in users */}
          {(isPublic || state.currentUser) && (
            <button
              className="hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="mobile-dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Public nav links */}
            {isPublic && (
              <>
                <Link
                  to="/"
                  className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <a href="#features" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                  Features
                </a>
                <a href="#stats" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                  Stats
                </a>
                <Link to="/customer" className={`navbar-link ${isCustomer ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                  Customer Portal
                </Link>
                <div className="mobile-dropdown-divider" />
              </>
            )}

            {/* User section */}
            {state.currentUser ? (
              <div className="mobile-user-section">
                <div className="mobile-user-info">
                  <User size={16} />
                  {state.currentUser.name}
                  <span className={`role-indicator ${roleConfig[userRole]?.className}`}>
                    {roleConfig[userRole]?.label}
                  </span>
                </div>
                {state.currentSession && (
                  <span className="badge badge-success" style={{ alignSelf: 'flex-start' }}>
                    Session Open
                  </span>
                )}
                <div className="mobile-dropdown-divider" />
                <button
                  className="btn btn-ghost"
                  onClick={handleLogout}
                  style={{ justifyContent: 'flex-start', width: '100%', color: 'var(--danger)' }}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="navbar-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="navbar-link"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ color: 'var(--primary)', fontWeight: 600 }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
