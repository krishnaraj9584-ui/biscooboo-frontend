import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { BiscoobooProvider, useBiscooboo } from './components/context';
import Home from './App';
import About from './pages/About';
import Shop from './pages/Shop';
import Contact from './pages/Contact';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Account from './pages/Account';
import Orders from './pages/Orders';
import Admin from './pages/Admin';
import AddressSelection from './pages/AddressSelection';

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useBiscooboo();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRouter() {
  return (
    <BiscoobooProvider>
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        gutter={12}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(17, 24, 39, 0.85)',
            color: '#f3f4f6',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '12px',
            padding: '16px 20px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          },
          success: {
            duration: 4000,
            style: {
              background: 'rgba(5, 150, 105, 0.75)',
              color: '#ecfdf5',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2)',
            },
            icon: '✓',
          },
          error: {
            duration: 4000,
            style: {
              background: 'rgba(220, 38, 38, 0.75)',
              color: '#fef2f2',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)',
            },
            icon: '✗',
          },
        }}
      />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/address-selection" element={<ProtectedRoute><AddressSelection /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </BiscoobooProvider>
  );
}

export default AppRouter;
