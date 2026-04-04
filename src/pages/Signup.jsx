import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateId } from '../data/seedData';
import toast from 'react-hot-toast';

export default function Signup() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }

    // Check if email already exists for this role
    const exists = state.users.find(u => u.email === form.email && u.role === form.role);
    if (exists) {
      toast.error('An account with this email and role already exists');
      return;
    }

    const newUser = {
      id: generateId(),
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'SIGNUP', payload: newUser });
    toast.success(`Welcome to Odoo POS Cafe, ${form.name}!`);

    const redirects = { admin: '/admin', kitchen: '/kitchen' };
    navigate(redirects[form.role] || '/');
  };

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="auth-header">
          <Link to="/" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>☕</Link>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join Odoo POS Cafe today</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Role Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Select Role</label>
            <div className="pill-group" style={{ width: '100%', display: 'flex' }}>
              {[
                { value: 'admin', label: 'Admin/Staff' },
                { value: 'kitchen', label: 'Kitchen Staff' },
              ].map(r => (
                <button
                  key={r.value}
                  type="button"
                  className={`pill-btn ${form.role === r.value ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, role: r.value })}
                  style={{ flex: 1 }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" style={{ marginTop: '0.5rem' }}>
            <UserPlus size={18} />
            Create Account
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
}
