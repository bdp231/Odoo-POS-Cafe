import { motion } from 'framer-motion';
import { Play, Clock, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, formatTime } from '../../data/seedData';
import StatusBadge from '../../components/shared/StatusBadge';
import toast from 'react-hot-toast';

export default function Session() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const handleOpenSession = () => {
    dispatch({ type: 'OPEN_SESSION' });
    toast.success('POS Session opened!');
    navigate('/admin/pos');
  };

  // Count tables with active unpaid orders
  const allTables = state.floors.flatMap(f => f.tables);
  const unpaidOrders = state.orders.filter(o => o.paymentStatus !== 'paid');
  const occupiedTableIds = [...new Set(unpaidOrders.map(o => o.tableId))];
  const activeTableCount = occupiedTableIds.length;

  const handleCloseSession = () => {
    // Check for unpaid orders
    if (unpaidOrders.length > 0) {
      toast.error(`Cannot close session — ${unpaidOrders.length} unpaid order(s) remain. Please collect payments first.`);
      return;
    }
    const todaysSales = state.orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0);
    dispatch({ type: 'CLOSE_SESSION', payload: todaysSales });
    toast.success('Session closed');
  };


  const lastSession = state.sessionHistory[0];

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">POS Session</h1>
        <p className="admin-page-subtitle">Manage your POS sessions</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Current Session */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: state.currentSession ? 'var(--success-bg)' : 'var(--primary-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem', fontSize: '2rem',
            }}>
              {state.currentSession ? '🟢' : '⏸️'}
            </div>
            <h3 style={{ marginBottom: '0.25rem' }}>Current Session</h3>
            <div style={{ marginBottom: '1rem' }}>
              <StatusBadge status={state.currentSession ? 'open' : 'closed'} />
            </div>
            {state.currentSession && (
              <>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Opened: {formatTime(state.currentSession.openedAt)}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600, color: activeTableCount > 0 ? '#B07A18' : 'var(--success)' }}>
                  {activeTableCount > 0 ? <AlertTriangle size={16} /> : null}
                  {activeTableCount} / {allTables.length} tables active
                </div>
              </>
            )}
            {state.currentSession ? (
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => navigate('/admin/pos')}>
                  <Play size={18} /> Go to POS
                </button>
                <button className="btn btn-danger" onClick={handleCloseSession}
                  title={activeTableCount > 0 ? `${activeTableCount} table(s) still have unpaid orders` : 'Close this POS session'}
                >
                  Close Session
                </button>
              </div>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={handleOpenSession}>
                <Play size={18} /> Open Session
              </button>
            )}
          </div>
        </motion.div>

        {/* Last Session Info */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h4 style={{ marginBottom: '1rem' }}>Last Session</h4>
          {lastSession ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <Clock size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.938rem' }}>{formatDate(lastSession.closedAt)}</div>
                  <div style={{ fontSize: '0.813rem', color: 'var(--text-muted)' }}>
                    {formatTime(lastSession.openedAt)} — {formatTime(lastSession.closedAt)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'var(--bg-cream)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '0.813rem', color: 'var(--text-muted)' }}>Closing Sale</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                    {formatCurrency(lastSession.closingSale)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No previous sessions</p>
          )}
        </motion.div>
      </div>

      {/* Session History */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ marginTop: '1.5rem' }}
      >
        <div className="card-header">
          <span className="card-title">Session History</span>
        </div>
        {state.sessionHistory.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem 0' }}>No session history yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Opened</th>
                <th>Closed</th>
                <th>Closing Sale</th>
              </tr>
            </thead>
            <tbody>
              {state.sessionHistory.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{formatDate(s.closedAt)}</td>
                  <td>{formatTime(s.openedAt)}</td>
                  <td>{formatTime(s.closedAt)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(s.closingSale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
