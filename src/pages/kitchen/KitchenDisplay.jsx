import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Clock, CheckCircle, XCircle, ChevronRight, Menu, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatTime, getTimeAgo } from '../../data/seedData';
import AnimatedBorderCard from '../../components/ui/AnimatedBorderCard';
import Toggle from '../../components/shared/Toggle';
import toast from 'react-hot-toast';

export default function KitchenDisplay() {
  const { state, dispatch } = useApp();
  const [showAvailability, setShowAvailability] = useState(true);

  // Organize orders into columns
  const toKitchenOrders = state.orders.filter(o => o.status === 'sent_to_kitchen');
  const preparingOrders = state.orders.filter(o => o.status === 'preparing');
  const completedOrders = state.orders.filter(o => o.status === 'completed').slice(0, 10);

  const getTable = (tableId) => {
    return state.floors.flatMap(f => f.tables).find(t => t.id === tableId);
  };

  const acceptOrder = (orderId) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status: 'preparing' } });
    toast.success('Order accepted — Preparing!');
  };

  const declineOrder = (orderId) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status: 'declined' } });
    toast('Order declined', { icon: '❌' });
  };

  const advanceOrder = (orderId, currentStatus) => {
    const nextStatus = {
      sent_to_kitchen: 'preparing',
      preparing: 'completed',
    };
    const next = nextStatus[currentStatus];
    if (next) {
      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status: next } });
      toast.success(next === 'completed' ? 'Order ready to serve! 🎉' : 'Order moved to preparing');
    }
  };

  const toggleItemPrepared = (orderId, itemIndex) => {
    dispatch({ type: 'UPDATE_ORDER_ITEM_STATUS', payload: { orderId, itemIndex } });
  };

  const toggleAvailability = (productId) => {
    dispatch({ type: 'TOGGLE_KITCHEN_AVAILABILITY', payload: productId });
    const isNowAvailable = !state.kitchenAvailability[productId];
    toast(isNowAvailable ? 'Item marked available' : 'Item marked unavailable', {
      icon: isNowAvailable ? '✅' : '🚫',
    });
  };

  const columns = [
    { title: '🔴 To Cook', orders: toKitchenOrders, color: 'var(--danger)', showAcceptDecline: true },
    { title: '🟡 Preparing', orders: preparingOrders, color: 'var(--accent)' },
    { title: '🟢 Completed', orders: completedOrders, color: 'var(--success)' },
  ];

  return (
    <div className="kitchen-layout">
      <div className="kitchen-board">
        {columns.map((col, colIdx) => (
          <div className="kitchen-column" key={colIdx}>
            <div className="kitchen-column-header" style={{ borderBottomColor: col.color }}>
              <span>{col.title}</span>
              <span className="count" style={{ background: col.color }}>{col.orders.length}</span>
            </div>
            <div className="kitchen-column-body">
              <AnimatePresence>
                {col.orders.map(order => {
                  const table = getTable(order.tableId);
                  const isNew = col.showAcceptDecline;
                  const CardWrapper = isNew ? AnimatedBorderCard : 'div';
                  const wrapperProps = isNew ? { active: true } : { className: 'kitchen-ticket' };

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      layout
                    >
                      <CardWrapper {...wrapperProps}>
                        <div className={isNew ? 'kitchen-ticket' : undefined} style={isNew ? { boxShadow: 'none', padding: 0 } : undefined}>
                          <div className="kitchen-ticket-header">
                            <span className="kitchen-ticket-order">#{order.id.slice(-6)}</span>
                            <span className="kitchen-ticket-time">{getTimeAgo(order.createdAt)}</span>
                          </div>
                          <div className="kitchen-ticket-table">Table {table?.number || '?'}</div>

                          <ul className="kitchen-ticket-items">
                            {order.items.map((item, idx) => (
                              <li
                                key={idx}
                                className={`kitchen-ticket-item ${item.prepared ? 'done' : ''}`}
                                onClick={() => toggleItemPrepared(order.id, idx)}
                                style={{ cursor: 'pointer' }}
                              >
                                <span>{item.emoji} {item.name}</span>
                                <span style={{ fontWeight: 600 }}>×{item.qty}</span>
                              </li>
                            ))}
                          </ul>

                          <div className="kitchen-ticket-actions">
                            {col.showAcceptDecline ? (
                              <>
                                <button className="btn btn-success btn-sm w-full" onClick={() => acceptOrder(order.id)}>
                                  <CheckCircle size={14} /> Accept
                                </button>
                                <button className="btn btn-danger btn-sm w-full" onClick={() => declineOrder(order.id)}>
                                  <XCircle size={14} /> Decline
                                </button>
                              </>
                            ) : col.color !== 'var(--success)' ? (
                              <button className="btn btn-primary btn-sm w-full" onClick={() => advanceOrder(order.id, order.status)}>
                                <ChevronRight size={14} /> {order.status === 'preparing' ? 'Mark Ready' : 'Start Preparing'}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </CardWrapper>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {col.orders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  {colIdx === 0 ? '🎉 No pending orders' : colIdx === 1 ? '⏳ Nothing preparing' : '📭 No recent completed orders'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Food Availability Panel */}
      <div className={`kitchen-availability ${showAvailability ? 'mobile-visible' : ''}`}>
        <div className="kitchen-availability-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Menu size={18} />
            Food Availability
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowAvailability(false)}
            style={{ display: 'none' }}
            id="kitchen-availability-close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="kitchen-availability-list">
          {state.products.map(product => (
            <div key={product.id} className="kitchen-availability-item">
              <span className="kitchen-availability-item-name">
                {product.emoji} {product.name}
              </span>
              <Toggle
                checked={state.kitchenAvailability[product.id] !== false}
                onChange={() => toggleAvailability(product.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile toggle for availability panel */}
      <button
        className="btn btn-primary btn-icon"
        onClick={() => setShowAvailability(!showAvailability)}
        style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          zIndex: 86,
          width: 52,
          height: 52,
          borderRadius: 'var(--radius-full)',
          boxShadow: '0 4px 16px rgba(196,92,38,0.3)',
          display: 'none',
        }}
        id="kitchen-availability-toggle"
      >
        <ChefHat size={22} />
      </button>

      <style>{`
        @media (max-width: 1024px) {
          #kitchen-availability-toggle { display: flex !important; }
          #kitchen-availability-close { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
