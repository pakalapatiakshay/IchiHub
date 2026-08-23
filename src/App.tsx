import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Services from './pages/Services';
import ProviderProfile from './pages/ProviderProfile';
import BookService from './pages/BookService';
import About from './pages/About';
import AuthPage from './pages/auth/AuthPage';
import RoleProtectedRoute from './components/layout/RoleProtectedRoute';
import CustomerDashboard from './pages/dashboards/CustomerDashboard';
import VendorDashboard from './pages/dashboards/VendorDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import CustomerTracking from './pages/tracking/CustomerTracking';
import VendorTracking from './pages/tracking/VendorTracking';
import { useAuth } from './store/authStore';
import { useDataStore } from './store/dataStore';

function App() {
  const restoreSession = useAuth((state) => state.restoreSession);
  const loadMarketplace = useDataStore((state) => state.loadMarketplace);
  const loadBookings = useDataStore((state) => state.loadBookings);
  const startRealtime = useDataStore((state) => state.startRealtime);
  const stopRealtime = useDataStore((state) => state.stopRealtime);

  useEffect(() => {
    void loadMarketplace();
    void restoreSession().then((user) => {
      if (user) {
        startRealtime();
        void loadBookings();
      }
    });
    return stopRealtime;
  }, [loadBookings, loadMarketplace, restoreSession, startRealtime, stopRealtime]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="provider/:id" element={<ProviderProfile />} />
          <Route path="book/:id" element={<BookService />} />
          <Route path="about" element={<About />} />
          
          {/* Auth Routes */}
          <Route path="customer/login" element={<AuthPage role="customer" type="login" />} />
          <Route path="customer/register" element={<AuthPage role="customer" type="register" />} />
          <Route path="vendor/login" element={<AuthPage role="vendor" type="login" />} />
          <Route path="vendor/register" element={<AuthPage role="vendor" type="register" />} />
          <Route path="admin/login" element={<AuthPage role="admin" type="login" />} />

          {/* Protected Dashboards */}
          <Route element={<RoleProtectedRoute allowedRole="customer" />}>
            <Route path="customer/dashboard" element={<CustomerDashboard />} />
          </Route>
          
          <Route element={<RoleProtectedRoute allowedRole="vendor" />}>
            <Route path="vendor/dashboard" element={<VendorDashboard />} />
          </Route>

          <Route element={<RoleProtectedRoute allowedRole="admin" />}>
            <Route path="admin/dashboard" element={<AdminDashboard />} />
          </Route>
        </Route>

        {/* Tracking Routes — outside Layout (full-screen) */}
        <Route path="customer/bookings/:bookingId/track" element={<CustomerTracking />} />
        <Route path="vendor/bookings/:bookingId/track" element={<VendorTracking />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
