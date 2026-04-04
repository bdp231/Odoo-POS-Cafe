import { Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function ProtectedRoute({ roles, children }) {
  const { state } = useApp();

  if (!state.currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(state.currentUser.role)) {
    // Redirect to the appropriate dashboard based on role
    const roleRedirects = {
      admin: '/admin',
      kitchen: '/kitchen',
      customer: '/customer',
    };
    return <Navigate to={roleRedirects[state.currentUser.role] || '/'} replace />;
  }

  return children;
}
