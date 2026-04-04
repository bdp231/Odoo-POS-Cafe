import { motion } from 'framer-motion';
import { IndianRupee, ShoppingCart, Coffee, Clock, Monitor, BarChart3 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import StatusBadge from '../../components/shared/StatusBadge';
import { formatCurrency, formatTime, getTimeAgo } from '../../data/seedData';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { state } = useApp();
  const today = new Date().toDateString();

  const todaysOrders = state.orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const todaysSales = todaysOrders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0);
  const completedOrders = todaysOrders.filter(o => o.status === 'completed').length;
  const activeTables = state.floors.reduce(
    (count, f) => count + f.tables.filter(t => t.status === 'occupied').length,
    0
  );
  const pendingKitchen = state.orders.filter(
    o => ['sent_to_kitchen', 'preparing'].includes(o.status)
  ).length;

  const recentOrders = state.orders.slice(0, 5);

  const stats = [
    { label: "Today's Sales", value: todaysSales, prefix: '₹', decimals: 2, icon: <IndianRupee size={22} />, color: 'primary', cardClass: '' },
    { label: 'Orders Completed', value: completedOrders, icon: <ShoppingCart size={22} />, color: 'accent', cardClass: 'accent' },
    { label: 'Active Tables', value: activeTables, icon: <Coffee size={22} />, color: 'success', cardClass: 'success' },
    { label: 'Pending Kitchen', value: pendingKitchen, icon: <Clock size={22} />, color: 'info', cardClass: 'info' },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">Overview of today's restaurant operations</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            className={`stat-card ${stat.cardClass}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <div className={`stat-card-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-card-value">
              <AnimatedCounter
                value={stat.value}
                prefix={stat.prefix || ''}
                decimals={stat.decimals || 0}
              />
            </div>
            <div className="stat-card-label">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}
      >
        <Link to="/admin/pos" className="btn btn-primary">
          <Monitor size={18} /> Open POS
        </Link>
        <Link to="/admin/reports" className="btn btn-outline">
          <BarChart3 size={18} /> Reports
        </Link>
      </motion.div>

      {/* Recent Orders */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="card-header">
          <span className="card-title">Recent Orders</span>
          <Link to="/admin/reports" className="btn btn-ghost btn-sm">View All</Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No orders yet</div>
            <p className="empty-state-text">Orders will appear here as they are created from the POS terminal.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Table</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => {
                  const table = state.floors.flatMap(f => f.tables).find(t => t.id === order.tableId);
                  return (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600, color: 'var(--dark)' }}>#{order.id.slice(-6)}</td>
                      <td>Table {table?.number || '?'}</td>
                      <td>{order.items.length} items</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(order.total)}</td>
                      <td><StatusBadge status={order.status} /></td>
                      <td><StatusBadge status={order.paymentStatus} /></td>
                      <td>{getTimeAgo(order.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
