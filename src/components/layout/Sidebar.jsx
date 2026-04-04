import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Map,
  Play,
  Monitor,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/products', icon: ShoppingBag, label: 'Products' },
  { to: '/admin/payment-methods', icon: CreditCard, label: 'Payment Methods' },
  { to: '/admin/floors', icon: Map, label: 'Floor Plans' },
  { to: '/admin/session', icon: Play, label: 'POS Session' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
];

export default function Sidebar({ isOpen, onClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isOpen && window.innerWidth <= 768) {
      onClose?.();
    }
  }, [location.pathname]);

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />

      <aside
        className={`sidebar ${isOpen ? 'open' : ''}`}
        style={collapsed && window.innerWidth > 768 ? { width: 72 } : {}}
      >
        {/* Desktop collapse toggle */}
        <div
          className="sidebar-collapse-toggle"
          style={{
            display: 'flex',
            justifyContent: collapsed ? 'center' : 'flex-end',
            marginBottom: '1rem',
          }}
        >
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setCollapsed(!collapsed)}
            style={{ width: 32, height: 32 }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {!collapsed && <div className="sidebar-section">Main Menu</div>}

        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to) && !item.exact;

            // More precise matching for non-exact routes
            const finalActive = item.exact
              ? location.pathname === item.to
              : location.pathname === item.to || location.pathname.startsWith(item.to + '/');

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={() => `sidebar-link ${finalActive ? 'active' : ''}`}
                onClick={() => {
                  if (window.innerWidth <= 768) {
                    onClose?.();
                  }
                }}
                title={collapsed ? item.label : undefined}
              >
                <span className="icon"><Icon size={20} /></span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
