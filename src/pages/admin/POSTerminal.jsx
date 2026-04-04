import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Minus, Plus, Trash2, Send, CreditCard, Banknote, QrCode, Check, RefreshCw, X, Home, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateId, formatCurrency, PRODUCT_CATEGORIES } from '../../data/seedData';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const VIEWS = {
  TABLES: 'tables',
  ORDER: 'order',
  PAYMENT: 'payment',
  CONFIRMATION: 'confirmation',
};

export default function POSTerminal() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [view, setView] = useState(VIEWS.TABLES);
  const [selectedTable, setSelectedTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [cashTendered, setCashTendered] = useState('');
  const [digitalRef, setDigitalRef] = useState('');
  const [activeTab, setActiveTab] = useState('tables');
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const pm = state.paymentMethods;

  // Helper: get active (unpaid) order for a given table
  const getActiveOrderForTable = useCallback((tableId) => {
    return state.orders.find(o => o.tableId === tableId && o.paymentStatus !== 'paid');
  }, [state.orders]);

  const selectTable = (table) => {
    const existingOrder = getActiveOrderForTable(table.id);

    if (existingOrder) {
      // Table has active orders — open it with empty cart for adding more items
      setSelectedTable(table);
      setCart([]);
      setCurrentOrderId(null);
      setView(VIEWS.ORDER);
      toast.success('Table ' + table.number + ' — ' + state.orders.filter(o => o.tableId === table.id && o.paymentStatus !== 'paid').length + ' active order(s)');
    } else {
      // Start fresh order
      setSelectedTable(table);
      setCart([]);
      setCurrentOrderId(null);
      setView(VIEWS.ORDER);
      dispatch({
        type: 'UPDATE_TABLE_STATUS',
        payload: { tableId: table.id, status: 'occupied' },
      });
    }
  };

  const addToCart = (product) => {
    if (state.kitchenAvailability[product.id] === false) {
      toast.error('Item unavailable');
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1, emoji: product.emoji, prepared: false }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart(prev => {
      return prev
        .map(i => i.productId === productId ? { ...i, qty: i.qty + delta } : i)
        .filter(i => i.qty > 0);
    });
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartTax = cartTotal * 0.05;
  const cartGrandTotal = cartTotal + cartTax;

  const sendToKitchen = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const orderId = generateId();
    const order = {
      id: orderId,
      tableId: selectedTable.id,
      items: cart.map(i => ({ ...i })),
      subtotal: cartTotal,
      tax: cartTax,
      total: cartGrandTotal,
      status: 'sent_to_kitchen',
      paymentStatus: 'unpaid',
      paymentMethod: null,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_ORDER', payload: order });
    dispatch({
      type: 'UPDATE_TABLE_STATUS',
      payload: { tableId: selectedTable.id, status: 'occupied' },
    });
    // Clear cart so new items can be added for another order
    setCart([]);
    setCurrentOrderId(null);
    toast.success('Order sent to kitchen! 🍳');
  };

  // Check if ALL unpaid orders for this table are ready (completed by kitchen)
  const tableUnpaidOrders = selectedTable
    ? state.orders.filter(o => o.tableId === selectedTable.id && o.paymentStatus !== 'paid')
    : [];
  const hasTableOrders = tableUnpaidOrders.length > 0;
  const allOrdersReady = hasTableOrders && tableUnpaidOrders.every(o => o.status === 'completed');

  // Combined totals across all unpaid orders for this table
  const combinedSubtotal = tableUnpaidOrders.reduce((s, o) => s + o.subtotal, 0);
  const combinedTax = tableUnpaidOrders.reduce((s, o) => s + o.tax, 0);
  const combinedTotal = tableUnpaidOrders.reduce((s, o) => s + o.total, 0);

  const proceedToPayment = () => {
    // If cart has unsent items, ask to send first
    if (cart.length > 0) {
      toast.error('Please send current cart items to kitchen first');
      return;
    }
    if (!hasTableOrders) {
      toast.error('No orders to pay for this table');
      return;
    }
    if (!allOrdersReady) {
      toast.error('Food is not ready yet. Please wait for kitchen confirmation.');
      return;
    }
    setPaymentMethod(null);
    setCashTendered('');
    setDigitalRef('');
    setView(VIEWS.PAYMENT);
  };

  const confirmPayment = () => {
    if (!paymentMethod) {
      toast.error('Select a payment method');
      return;
    }
    if (paymentMethod === 'cash' && parseFloat(cashTendered) < combinedTotal) {
      toast.error('Insufficient amount');
      return;
    }

    // Mark ALL unpaid orders for this table as paid
    tableUnpaidOrders.forEach(order => {
      dispatch({
        type: 'UPDATE_PAYMENT_STATUS',
        payload: { orderId: order.id, paymentMethod },
      });
    });

    toast.success('Payment confirmed! ✅');
    setView(VIEWS.CONFIRMATION);

    // Auto-return to floor view after 3 seconds
    setTimeout(() => {
      dispatch({
        type: 'UPDATE_TABLE_STATUS',
        payload: { tableId: selectedTable.id, status: 'available' },
      });
      setView(VIEWS.TABLES);
      setSelectedTable(null);
      setCart([]);
      setCurrentOrderId(null);
    }, 3000);
  };

  const goBackToTables = () => {
    // Only free the table if there is NO active unpaid order
    if (selectedTable) {
      const hasActiveOrder = getActiveOrderForTable(selectedTable.id);
      if (!hasActiveOrder) {
        dispatch({
          type: 'UPDATE_TABLE_STATUS',
          payload: { tableId: selectedTable.id, status: 'available' },
        });
      }
    }
    setView(VIEWS.TABLES);
    setSelectedTable(null);
    setCart([]);
    setCurrentOrderId(null);
  };

  const filteredProducts = state.products.filter(p =>
    activeCategory === 'All' || p.category === activeCategory
  );

  const allTables = state.floors.flatMap(f => f.tables);

  return (
    <div style={{ height: 'calc(100vh - var(--navbar-height))', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top Menu Bar */}
      <div className="pos-top-bar">
        <div className="pos-top-bar-actions">
          <button
            className={`pill-btn ${activeTab === 'tables' ? 'active' : ''}`}
            onClick={() => { setActiveTab('tables'); if (view !== VIEWS.CONFIRMATION) goBackToTables(); }}
          >
            Table View
          </button>
          <button
            className={`pill-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Register
          </button>
        </div>
        <div className="pos-top-bar-right">
          <button className="btn btn-ghost btn-sm" onClick={() => window.location.reload()}>
            <RefreshCw size={16} /> <span>Reload</span>
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin')}>
            <Home size={16} /> <span>Backend</span>
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => {
            const unpaidCount = state.orders.filter(o => o.paymentStatus !== 'paid').length;
            if (unpaidCount > 0) {
              toast.error(`Cannot close — ${unpaidCount} unpaid order(s) remain`);
              return;
            }
            dispatch({ type: 'CLOSE_SESSION', payload: state.orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0) });
            toast.success('Register closed');
            navigate('/admin/session');
          }}>
            <X size={16} /> <span>Close</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {/* TABLE VIEW */}
          {view === VIEWS.TABLES && (
            <motion.div
              key="tables"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ padding: '1.5rem', height: '100%', overflowY: 'auto' }}
            >
              {state.floors.map(floor => (
                <div key={floor.id} style={{ marginBottom: '2rem' }}>
                  <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>{floor.name}</h3>
                  <div className="floor-tables">
                    {floor.tables.map(table => {
                      const activeOrder = getActiveOrderForTable(table.id);
                      const orderStatus = activeOrder?.status;
                      const statusLabel = orderStatus === 'sent_to_kitchen' ? 'In Kitchen'
                        : orderStatus === 'preparing' ? 'Preparing'
                        : orderStatus === 'completed' ? '✅ Ready'
                        : table.status === 'occupied' ? 'Occupied'
                        : 'Available';
                      const statusColor = orderStatus === 'completed' ? 'var(--success)'
                        : orderStatus === 'preparing' ? 'var(--accent)'
                        : orderStatus === 'sent_to_kitchen' ? '#B07A18'
                        : table.status === 'available' ? 'var(--success)'
                        : '#B07A18';

                      return (
                        <motion.div
                          key={table.id}
                          className={`floor-table-card ${activeOrder ? 'occupied' : table.status}`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => selectTable(table)}
                        >
                          <div className="floor-table-number">T{table.number}</div>
                          <div className="floor-table-seats">{table.seats} seats</div>
                          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: statusColor, textTransform: 'capitalize' }}>
                            {statusLabel}
                          </div>
                          {activeOrder && (
                            <div style={{ marginTop: '0.25rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              #{activeOrder.id.slice(-6)}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* ORDER VIEW */}
          {view === VIEWS.ORDER && (
            <motion.div
              key="order"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="pos-layout"
            >
              {/* Product Grid */}
              <div className="pos-products">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <button className="btn btn-ghost btn-sm" onClick={goBackToTables}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <h4>Table {selectedTable?.number}</h4>
                </div>

                <div className="category-tabs" style={{ marginBottom: '1rem' }}>
                  {PRODUCT_CATEGORIES.map(c => (
                    <button
                      key={c}
                      className={`category-tab ${activeCategory === c ? 'active' : ''}`}
                      onClick={() => setActiveCategory(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="pos-product-grid">
                  {filteredProducts.map(product => {
                    const isUnavailable = state.kitchenAvailability[product.id] === false;
                    return (
                      <motion.div
                        key={product.id}
                        className={`pos-product-card ${isUnavailable ? 'unavailable' : ''}`}
                        whileHover={!isUnavailable ? { scale: 1.03 } : {}}
                        whileTap={!isUnavailable ? { scale: 0.97 } : {}}
                        onClick={() => !isUnavailable && addToCart(product)}
                      >
                        <div className="pos-product-emoji">{product.emoji}</div>
                        <div className="pos-product-name">{product.name}</div>
                        <div className="pos-product-price">{formatCurrency(product.price)}</div>
                        {isUnavailable && (
                          <span className="badge badge-danger" style={{ marginTop: '0.25rem' }}>Sold Out</span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Cart — Desktop */}
              <div className="pos-cart desktop-cart">
                <div className="pos-cart-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShoppingCart size={20} style={{ color: 'var(--primary)' }} />
                    <h4 style={{ fontSize: '1rem' }}>Current Order</h4>
                  </div>
                  <span className="badge badge-primary">{cart.length} items</span>
                </div>

                <div className="pos-cart-items">
                  {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1rem' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛒</div>
                      <p style={{ fontSize: '0.875rem' }}>Tap products to add them to the order</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.productId} className="pos-cart-item">
                        <div style={{ flex: 1 }}>
                          <div className="pos-cart-item-name">{item.emoji} {item.name}</div>
                          <div className="pos-cart-item-price">{formatCurrency(item.price)} each</div>
                        </div>
                        <div className="pos-cart-qty">
                          <button onClick={() => updateQty(item.productId, -1)}>−</button>
                          <span style={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{item.qty}</span>
                          <button onClick={() => updateQty(item.productId, 1)}>+</button>
                        </div>
                        <div style={{ fontWeight: 600, minWidth: 60, textAlign: 'right', fontSize: '0.875rem' }}>
                          {formatCurrency(item.price * item.qty)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {(cart.length > 0 || hasTableOrders) && (
                  <div className="pos-cart-footer">
                    {cart.length > 0 && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                          <span>Cart Subtotal</span>
                          <span>{formatCurrency(cartTotal)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                          <span>Cart Tax (5%)</span>
                          <span>{formatCurrency(cartTax)}</span>
                        </div>
                        <div className="pos-cart-total" style={{ marginBottom: '0.75rem' }}>
                          <span>Cart Total</span>
                          <span style={{ color: 'var(--primary)' }}>{formatCurrency(cartGrandTotal)}</span>
                        </div>
                      </>
                    )}
                    {hasTableOrders && (
                      <>
                        <div style={{ borderTop: cart.length > 0 ? '1px dashed var(--border)' : 'none', paddingTop: cart.length > 0 ? '0.75rem' : 0, marginBottom: '0.25rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                            <span>Bill Subtotal</span>
                            <span>{formatCurrency(combinedSubtotal)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            <span>Bill Tax</span>
                            <span>{formatCurrency(combinedTax)}</span>
                          </div>
                          <div className="pos-cart-total">
                            <span>Bill Total</span>
                            <span style={{ color: 'var(--primary)' }}>{formatCurrency(combinedTotal)}</span>
                          </div>
                        </div>
                      </>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {cart.length > 0 && (
                        <button className="btn btn-accent w-full" onClick={sendToKitchen}>
                          <Send size={16} /> Send to Kitchen
                        </button>
                      )}
                      <button
                        className="btn btn-primary w-full"
                        onClick={proceedToPayment}
                        disabled={!allOrdersReady || cart.length > 0}
                        title={cart.length > 0 ? 'Send cart items first' : !allOrdersReady ? 'Waiting for kitchen to mark all orders ready' : 'Proceed to payment'}
                        style={(!allOrdersReady || cart.length > 0) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      >
                        {!hasTableOrders ? <Lock size={16} /> : <CreditCard size={16} />}
                        {!hasTableOrders ? 'Send First' : !allOrdersReady ? 'Not Ready' : 'Pay'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart FAB — Mobile */}
              {view === VIEWS.ORDER && (
                <button
                  className="cart-fab"
                  onClick={() => setMobileCartOpen(true)}
                >
                  <ShoppingCart size={24} />
                  {cart.length > 0 && (
                    <span className="cart-fab-badge">{cart.reduce((s, i) => s + i.qty, 0)}</span>
                  )}
                </button>
              )}

              {/* Mobile Cart Drawer */}
              <div
                className={`cart-drawer-overlay ${mobileCartOpen ? 'visible' : ''}`}
                onClick={() => setMobileCartOpen(false)}
              />
              <div className={`cart-drawer ${mobileCartOpen ? 'visible' : ''}`}>
                <div className="cart-drawer-handle" onClick={() => setMobileCartOpen(false)} />
                <div className="pos-cart" style={{ border: 'none', height: '100%', maxHeight: '75vh' }}>
                  <div className="pos-cart-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ShoppingCart size={20} style={{ color: 'var(--primary)' }} />
                      <h4 style={{ fontSize: '1rem' }}>Current Order</h4>
                    </div>
                    <span className="badge badge-primary">{cart.length} items</span>
                  </div>

                  <div className="pos-cart-items">
                    {cart.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 1rem' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛒</div>
                        <p style={{ fontSize: '0.875rem' }}>Tap products to add them</p>
                      </div>
                    ) : (
                      cart.map(item => (
                        <div key={item.productId} className="pos-cart-item">
                          <div style={{ flex: 1 }}>
                            <div className="pos-cart-item-name">{item.emoji} {item.name}</div>
                            <div className="pos-cart-item-price">{formatCurrency(item.price)} each</div>
                          </div>
                          <div className="pos-cart-qty">
                            <button onClick={() => updateQty(item.productId, -1)}>−</button>
                            <span style={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{item.qty}</span>
                            <button onClick={() => updateQty(item.productId, 1)}>+</button>
                          </div>
                          <div style={{ fontWeight: 600, minWidth: 60, textAlign: 'right', fontSize: '0.875rem' }}>
                            {formatCurrency(item.price * item.qty)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {(cart.length > 0 || hasTableOrders) && (
                    <div className="pos-cart-footer">
                      {cart.length > 0 && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                            <span>Cart Subtotal</span>
                            <span>{formatCurrency(cartTotal)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                            <span>Cart Tax (5%)</span>
                            <span>{formatCurrency(cartTax)}</span>
                          </div>
                          <div className="pos-cart-total" style={{ marginBottom: '0.75rem' }}>
                            <span>Cart Total</span>
                            <span style={{ color: 'var(--primary)' }}>{formatCurrency(cartGrandTotal)}</span>
                          </div>
                        </>
                      )}
                      {hasTableOrders && (
                        <>
                          <div style={{ borderTop: cart.length > 0 ? '1px dashed var(--border)' : 'none', paddingTop: cart.length > 0 ? '0.75rem' : 0, marginBottom: '0.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                              <span>Bill Subtotal</span>
                              <span>{formatCurrency(combinedSubtotal)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                              <span>Bill Tax</span>
                              <span>{formatCurrency(combinedTax)}</span>
                            </div>
                            <div className="pos-cart-total">
                              <span>Bill Total</span>
                              <span style={{ color: 'var(--primary)' }}>{formatCurrency(combinedTotal)}</span>
                            </div>
                          </div>
                        </>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {cart.length > 0 && (
                          <button className="btn btn-accent w-full" onClick={() => { sendToKitchen(); setMobileCartOpen(false); }}>
                            <Send size={16} /> Kitchen
                          </button>
                        )}
                        <button
                          className="btn btn-primary w-full"
                          onClick={() => { proceedToPayment(); setMobileCartOpen(false); }}
                          disabled={!allOrdersReady || cart.length > 0}
                          style={(!allOrdersReady || cart.length > 0) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                          {!hasTableOrders ? <Lock size={16} /> : <CreditCard size={16} />}
                          {!hasTableOrders ? 'Send First' : !allOrdersReady ? 'Not Ready' : 'Pay'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* PAYMENT VIEW */}
          {view === VIEWS.PAYMENT && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              style={{ height: '100%', overflowY: 'auto' }}
            >
              <div className="payment-screen">
                <button className="btn btn-ghost btn-sm" onClick={() => setView(VIEWS.ORDER)} style={{ marginBottom: '1rem' }}>
                  <ArrowLeft size={16} /> Back to Order
                </button>

                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem' }}>Order Summary — Table {selectedTable?.number} ({tableUnpaidOrders.length} order{tableUnpaidOrders.length > 1 ? 's' : ''})</h4>
                  {tableUnpaidOrders.map(order => (
                    <div key={order.id} style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Order #{order.id.slice(-6)}</div>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.875rem' }}>
                          <span>{item.emoji} {item.name} × {item.qty}</span>
                          <span style={{ fontWeight: 600 }}>{formatCurrency(item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    <span>Subtotal</span>
                    <span>{formatCurrency(combinedSubtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    <span>Tax</span>
                    <span>{formatCurrency(combinedTax)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '2px solid var(--border)', fontWeight: 700, fontSize: '1.125rem' }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--primary)' }}>{formatCurrency(combinedTotal)}</span>
                  </div>
                </div>

                <h4 style={{ marginBottom: '0.75rem' }}>Select Payment Method</h4>
                <div className="payment-method-cards">
                  {pm.cash && (
                    <div
                      className={`payment-method-card ${paymentMethod === 'cash' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('cash')}
                    >
                      <div className="payment-method-icon">💵</div>
                      <div className="payment-method-name">Cash</div>
                    </div>
                  )}
                  {pm.digital && (
                    <div
                      className={`payment-method-card ${paymentMethod === 'digital' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('digital')}
                    >
                      <div className="payment-method-icon">💳</div>
                      <div className="payment-method-name">Digital</div>
                    </div>
                  )}
                  {pm.upi && (
                    <div
                      className={`payment-method-card ${paymentMethod === 'upi' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('upi')}
                    >
                      <div className="payment-method-icon">📱</div>
                      <div className="payment-method-name">UPI QR</div>
                    </div>
                  )}
                </div>

                {/* Payment Details */}
                <AnimatePresence mode="wait">
                  {paymentMethod === 'cash' && (
                    <motion.div key="cash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginTop: '1.5rem' }}>
                      <div className="form-group">
                        <label className="form-label">Amount Tendered (₹)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={cashTendered}
                          onChange={e => setCashTendered(e.target.value)}
                          placeholder={combinedTotal.toFixed(2)}
                          style={{ fontSize: '1.25rem', fontWeight: 700 }}
                        />
                      </div>
                      {cashTendered && parseFloat(cashTendered) >= combinedTotal && (
                        <div style={{ background: 'var(--success-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Change</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                            {formatCurrency(parseFloat(cashTendered) - combinedTotal)}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {paymentMethod === 'digital' && (
                    <motion.div key="digital" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginTop: '1.5rem' }}>
                      <div className="form-group">
                        <label className="form-label">Transaction Reference / Confirmation</label>
                        <input
                          className="form-input"
                          value={digitalRef}
                          onChange={e => setDigitalRef(e.target.value)}
                          placeholder="Enter reference number"
                        />
                      </div>
                    </motion.div>
                  )}

                  {paymentMethod === 'upi' && (
                    <motion.div key="upi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginTop: '1.5rem' }}>
                      <div className="qr-container">
                        <QRCodeSVG
                          value={`upi://pay?pa=${pm.upiId}&pn=OdooPOSCafe&am=${combinedTotal.toFixed(2)}&cu=INR`}
                          size={200}
                          level="M"
                        />
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {formatCurrency(combinedTotal)}
                          </div>
                          <div style={{ fontSize: '0.813rem', color: 'var(--text-muted)' }}>{pm.upiId}</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {paymentMethod && (
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button className="btn btn-ghost w-full" onClick={() => setView(VIEWS.ORDER)}>
                      Cancel
                    </button>
                    <button className="btn btn-success btn-lg w-full" onClick={confirmPayment}>
                      <Check size={18} /> Validate Payment
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* CONFIRMATION VIEW */}
          {view === VIEWS.CONFIRMATION && (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <div className="confirmation-screen">
                <motion.div
                  className="confirmation-icon"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                >
                  ✅
                </motion.div>
                <h2 style={{ color: 'var(--success)' }}>Payment Confirmed!</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                  Table {selectedTable?.number} — {formatCurrency(combinedTotal)}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Returning to floor view in 3 seconds...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
