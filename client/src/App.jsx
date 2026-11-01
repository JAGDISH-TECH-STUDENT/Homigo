import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ListingIndex from './pages/listings/ListingIndex';
import BackButton from './components/BackButton';

const ListingShow = lazy(() => import('./pages/listings/ListingShow'));
const ListingNew = lazy(() => import('./pages/listings/ListingNew'));
const ListingEdit = lazy(() => import('./pages/listings/ListingEdit'));
const HostListings = lazy(() => import('./pages/listings/HostListings'));
const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const BookingIndex = lazy(() => import('./pages/bookings/BookingIndex'));
const BookingShow = lazy(() => import('./pages/bookings/BookingShow'));
const HostDashboard = lazy(() => import('./pages/bookings/HostDashboard'));
const Favorites = lazy(() => import('./pages/Favorites'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminListings = lazy(() => import('./pages/admin/AdminListings'));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminComplaints = lazy(() => import('./pages/admin/AdminComplaints'));
const Complaints = lazy(() => import('./pages/Complaints'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner" />;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="admin-loading-screen">
        <div className="admin-spinner"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className={`app-wrapper ${isAdmin ? 'admin-app-wrapper' : ''}`}>
      {!isAdmin && <Navbar />}
      {!isAdmin && <BackButton />}
      <main className="main-content">
        <Suspense
          fallback={
            isAdmin ? (
              <div className="admin-loading-screen">
                <div className="admin-spinner"></div>
              </div>
            ) : (
              <div className="loading-spinner" />
            )
          }
        >
          <Routes>
            <Route path="/" element={<ListingIndex />} />
            <Route path="/listings" element={<ListingIndex />} />
            <Route path="/listings/search" element={<ListingIndex />} />
            <Route path="/listings/new" element={<PrivateRoute><ListingNew /></PrivateRoute>} />
            <Route path="/listings/:id" element={<ListingShow />} />
            <Route path="/listings/:id/edit" element={<PrivateRoute><ListingEdit /></PrivateRoute>} />
            <Route path="/host/listings" element={<PrivateRoute><HostListings /></PrivateRoute>} />
            <Route path="/host/dashboard" element={<PrivateRoute><HostDashboard /></PrivateRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/chat/*" element={<Navigate to="/" replace />} />
            <Route path="/bookings" element={<PrivateRoute><BookingIndex /></PrivateRoute>} />
            <Route path="/bookings/:bookingId" element={<PrivateRoute><BookingShow /></PrivateRoute>} />
            <Route path="/favorites" element={<PrivateRoute><Favorites /></PrivateRoute>} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/listings" element={<AdminRoute><AdminListings /></AdminRoute>} />
            <Route path="/admin/bookings" element={<AdminRoute><AdminBookings /></AdminRoute>} />
            <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
            <Route path="/admin/complaints" element={<AdminRoute><AdminComplaints /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdmin && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
