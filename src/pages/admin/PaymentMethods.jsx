import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Banknote, CreditCard, QrCode, CheckCircle, XCircle, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Toggle from '../../components/shared/Toggle';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

export default function PaymentMethods() {
  const { state, dispatch } = useApp();
  const pm = state.paymentMethods;
  const [upiInput, setUpiInput] = useState(pm.upiId || '');

  const handleToggle = (method) => {
    dispatch({ type: 'TOGGLE_PAYMENT_METHOD', payload: method });
    toast.success(`${method.charAt(0).toUpperCase() + method.slice(1)} ${pm[method] ? 'disabled' : 'enabled'}`);
  };

  const handleUpiSave = () => {
    dispatch({ type: 'SET_UPI_ID', payload: upiInput });
    toast.success('UPI ID updated');
  };

  const methods = [
    {
      key: 'cash',
      label: 'Cash',
      desc: 'Accept cash payments with automatic change calculation at the POS terminal.',
      icon: Banknote,
      iconBg: 'var(--success-bg)',
      iconColor: 'var(--success)',
      enabled: pm.cash,
    },
    {
      key: 'digital',
      label: 'Digital (Card / Bank)',
      desc: 'Accept debit/credit card and bank transfer payments with transaction confirmation.',
      icon: CreditCard,
      iconBg: 'var(--info-bg)',
      iconColor: 'var(--info)',
      enabled: pm.digital,
    },
    {
      key: 'upi',
      label: 'UPI QR Code',
      desc: 'Generate dynamic UPI QR codes for quick mobile payments at the terminal.',
      icon: QrCode,
      iconBg: 'var(--primary-bg)',
      iconColor: 'var(--primary)',
      enabled: pm.upi,
    },
    {
      key: 'razorpay',
      label: 'Razorpay',
      desc: 'Accept online payments via Razorpay — cards, UPI, netbanking, wallets & more.',
      icon: Shield,
      iconBg: '#eef2ff',
      iconColor: '#528FF0',
      enabled: pm.razorpay,
    },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Payment Methods</h1>
        <p className="admin-page-subtitle">Configure accepted payment methods for your POS</p>
      </div>

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: 0, overflow: 'hidden' }}
      >
        {methods.map((method, i) => {
          const Icon = method.icon;
          const isLast = i === methods.length - 1;

          return (
            <motion.div
              key={method.key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08 }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.25rem 1.5rem',
                  borderBottom: (isLast && !(method.key === 'upi' && pm.upi)) ? 'none' : '1px solid var(--border-light)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Icon */}
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-md)',
                  background: method.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: method.iconColor, flexShrink: 0,
                }}>
                  <Icon size={24} />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <h4 style={{ fontSize: '1rem', margin: 0 }}>{method.label}</h4>
                    {method.enabled
                      ? <span className="badge badge-success" style={{ fontSize: '0.688rem' }}><CheckCircle size={12} /> Active</span>
                      : <span className="badge badge-danger" style={{ fontSize: '0.688rem' }}><XCircle size={12} /> Off</span>
                    }
                  </div>
                  <p style={{ fontSize: '0.813rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    {method.desc}
                  </p>
                </div>

                {/* Toggle */}
                <Toggle checked={method.enabled} onChange={() => handleToggle(method.key)} />
              </div>

              {/* UPI Expanded Section */}
              {method.key === 'upi' && (
                <AnimatePresence>
                  {pm.upi && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        padding: '1.25rem 1.5rem',
                        background: 'var(--bg-cream)',
                        display: 'flex',
                        gap: '2rem',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                      }}>
                        {/* UPI Input */}
                        <div style={{ flex: '1 1 250px' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">UPI ID</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input
                                className="form-input"
                                value={upiInput}
                                onChange={e => setUpiInput(e.target.value)}
                                placeholder="yourname@upi"
                                style={{ flex: 1 }}
                              />
                              <button className="btn btn-primary btn-sm" onClick={handleUpiSave}>Save</button>
                            </div>
                            {pm.upiId && (
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                Current: <strong>{pm.upiId}</strong>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* QR Preview */}
                        {pm.upiId && (
                          <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            padding: '1rem', background: 'white', borderRadius: 'var(--radius-md)',
                            boxShadow: '0 1px 6px rgba(44,24,16,0.06)',
                          }}>
                            <QRCodeSVG
                              value={`upi://pay?pa=${pm.upiId}&pn=OdooPOSCafe`}
                              size={120}
                              bgColor="transparent"
                              fgColor="var(--dark)"
                              level="M"
                            />
                            <p style={{ fontSize: '0.688rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                              Scan to pay
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
