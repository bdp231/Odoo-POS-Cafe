import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import Navbar from './components/layout/Navbar';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import PaymentMethods from './pages/admin/PaymentMethods';
import Floors from './pages/admin/Floors';
import Session from './pages/admin/Session';
import POSTerminal from './pages/admin/POSTerminal';
import Reports from './pages/admin/Reports';

// Kitchen
import KitchenDisplay from './pages/kitchen/KitchenDisplay';

// Customer
import CustomerDisplay from './pages/customer/CustomerDisplay';
import OrderStatus from './pages/customer/OrderStatus';
import LiveMenu from './pages/customer/LiveMenu';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#2C1810',
            color: '#fff',
            borderRadius: '10px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.875rem',
          },
        }}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<><Navbar /><Landing /></>} />
        <Route path="/login" element={<><Navbar /><Login /></>} />
        <Route path="/signup" element={<><Navbar /><Signup /></>} />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <Navbar onToggleSidebar={toggleSidebar} />
              <AdminLayout
                sidebarOpen={sidebarOpen}
                onCloseSidebar={closeSidebar}
              />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="payment-methods" element={<PaymentMethods />} />
          <Route path="floors" element={<Floors />} />
          <Route path="session" element={<Session />} />
          <Route path="pos" element={<POSTerminal />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* Kitchen route */}
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute roles={['kitchen']}>
              <Navbar />
              <KitchenDisplay />
            </ProtectedRoute>
          }
        />

        {/* Customer routes */}
        <Route path="/customer" element={<CustomerDisplay />}>
          <Route path="order-status" element={<OrderStatus />} />
          <Route path="menu" element={<LiveMenu />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  );
}
