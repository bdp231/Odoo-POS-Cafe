import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../data/seedData';
import StatusBadge from '../../components/shared/StatusBadge';

const ORDER_STEPS = [
  { key: 'sent_to_kitchen', label: 'Received', icon: '📥' },
  { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
  { key: 'completed', label: 'Ready', icon: '✅' },
];

export default function OrderStatus() {
  const { state } = useApp();
  const [selectedTableId, setSelectedTableId] = useState('');
  const [, setTick] = useState(0);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  const floorTables = state.floors.flatMap(f => 
    f.tables.map(t => ({ ...t, floorName: f.name }))
  );

  const getTable = (tableId) => {
    return state.floors.flatMap(f => f.tables).find(t => t.id === tableId);
  };

  const getStepIndex = (status) => {
    const idx = ORDER_STEPS.findIndex(s => s.key === status);
    return idx >= 0 ? idx : -1;
  };

  // Find active orders for the selected table
  const activeOrders = selectedTableId 
    ? state.orders.filter(o => o.tableId === selectedTableId && o.paymentStatus !== 'paid')
    : [];

  const hasOrders = activeOrders.length > 0;

  // Calculate bill summary
  const billSummary = activeOrders.reduce(
    (acc, order) => {
      acc.subtotal += order.subtotal;
      acc.tax += order.tax;
      acc.total += order.total;
      return acc;
    },
    { subtotal: 0, tax: 0, total: 0 }
  );

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Your Orders</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.938rem' }}>
        Select your table to view your current orders and bill details
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <select 
          className="form-select" 
          value={selectedTableId} 
          onChange={(e) => setSelectedTableId(e.target.value)}
          style={{ width: '100%', maxWidth: 400, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)', color: 'var(--text)', fontSize: '1rem' }}
        >
          <option value="">-- Select Your Table --</option>
          {floorTables.map(t => (
            <option key={t.id} value={t.id}>
              {t.floorName} - Table {t.number}
            </option>
          ))}
        </select>
      </div>

      <AnimatePresence mode="wait">
        {selectedTableId && !hasOrders && (
          <motion.div
            key="notfound"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🍽️</div>
            <p>No active orders for this table.</p>
          </motion.div>
        )}

        {hasOrders && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            {activeOrders.map(order => (
              <div key={order.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.125rem' }}>Order #{order.id.slice(-6)}</h4>
                    <span style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600 }}>
                      Table {getTable(order.tableId)?.number || '?'}
                    </span>
                  </div>
                  <motion.div
                    key={order.paymentStatus}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring' }}
                  >
                    <StatusBadge status={order.paymentStatus} />
                  </motion.div>
                </div>

                {/* Order Progress Stepper */}
                <div className="order-stepper" style={{ marginBottom: '1.5rem' }}>
                  {ORDER_STEPS.map((step, i) => {
                    const currentIdx = getStepIndex(order.status);
                    const isCompleted = i <= currentIdx;
                    const isActive = i === currentIdx;
                    return (
                      <div key={step.key} style={{ display: 'flex', alignItems: 'center' }}>
                        <div className={`stepper-step ${isActive ? 'active' : ''} ${isCompleted && !isActive ? 'completed' : ''}`}>
                          <motion.div
                            className="stepper-circle"
                            animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            {step.icon}
                          </motion.div>
                          <span className="stepper-label">{step.label}</span>
                        </div>
                        {i < ORDER_STEPS.length - 1 && (
                          <div className={`stepper-line ${i < currentIdx ? 'active' : ''}`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Items */}
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.875rem' }}>
                      <span>{item.emoji} {item.name} × {item.qty}</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
                
                <div style={{ marginTop: '0.75rem', textAlign: 'right', fontSize: '1rem', fontWeight: 600 }}>
                  Order Total: <span style={{ color: 'var(--primary)' }}>{formatCurrency(order.total)}</span>
                </div>
              </div>
            ))}

            {/* Bill Summary */}
            <div className="card" style={{ marginTop: '0.5rem', background: 'var(--surface)', border: '2px solid var(--border)' }}>
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Bill Summary</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <span>Subtotal ({activeOrders.length} {activeOrders.length === 1 ? 'order' : 'orders'})</span>
                <span>{formatCurrency(billSummary.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                <span>Tax</span>
                <span>{formatCurrency(billSummary.tax)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700 }}>
                <span>Total Amount Due</span>
                <span style={{ color: 'var(--primary)' }}>{formatCurrency(billSummary.total)}</span>
              </div>
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.813rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
              Auto-refreshes every 5 seconds
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedTableId && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📋</div>
          <p>Please select your table to continue</p>
        </div>
      )}
    </div>
  );
}
