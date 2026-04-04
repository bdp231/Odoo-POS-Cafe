import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { formatCurrency, PRODUCT_CATEGORIES } from '../../data/seedData';

export default function LiveMenu() {
  const { state } = useApp();
  const [activeCategory, setActiveCategory] = useState('All');
  const [, setTick] = useState(0);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = state.products.filter(p =>
    activeCategory === 'All' || p.category === activeCategory
  );

  // Sort: available first, then sold out
  const sorted = [...filtered].sort((a, b) => {
    const aAvailable = state.kitchenAvailability[a.id] !== false;
    const bAvailable = state.kitchenAvailability[b.id] !== false;
    if (aAvailable === bAvailable) return 0;
    return aAvailable ? -1 : 1;
  });

  const hasAnyAvailable = state.products.some(p => state.kitchenAvailability[p.id] !== false);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.25rem' }}>Our Menu</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.938rem' }}>
          Live kitchen availability — updated every 10 seconds
        </p>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <div className="category-tabs">
          {PRODUCT_CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state" style={{ padding: '4rem' }}>
          <div className="empty-state-icon">👨‍🍳</div>
          <div className="empty-state-title">Our kitchen is getting things ready</div>
          <p className="empty-state-text">Check back soon!</p>
        </div>
      ) : (
        <div className="menu-grid">
          <AnimatePresence>
            {sorted.map((product, i) => {
              const isAvailable = state.kitchenAvailability[product.id] !== false;
              return (
                <motion.div
                  key={product.id}
                  className={`menu-card ${!isAvailable ? 'sold-out' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  layout
                >
                  <div className="menu-card-image">
                    <span style={{ filter: !isAvailable ? 'grayscale(1)' : 'none' }}>
                      {product.emoji}
                    </span>
                  </div>
                  <div className="menu-card-body">
                    <div className="menu-card-name">{product.name}</div>
                    <div className="menu-card-category">{product.category}</div>
                    <div className="menu-card-footer">
                      <span className="menu-card-price">{formatCurrency(product.price)}</span>
                      {isAvailable ? (
                        <span className="badge badge-success">Available</span>
                      ) : (
                        <span className="badge badge-danger" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
                          Sold Out
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
