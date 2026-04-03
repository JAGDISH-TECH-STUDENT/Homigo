import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NotFound from './pages/NotFound';
import ListingIndex from './pages/listings/ListingIndex';
import ListingShow from './pages/listings/ListingShow';
import ListingNew from './pages/listings/ListingNew';
import ListingEdit from './pages/listings/ListingEdit';
import HostListings from './pages/listings/HostListings';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import BookingIndex from './pages/bookings/BookingIndex';
import BookingShow from './pages/bookings/BookingShow';
import HostDashboard from './pages/bookings/HostDashboard';
import Favorites from './pages/Favorites';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminListings from './pages/admin/AdminListings';
import AdminBookings from './pages/admin/AdminBookings';
import AdminReviews from './pages/admin/AdminReviews';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner" />;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <Navbar />
        <main className="main-content">
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
            <Route path="/bookings" element={<PrivateRoute><BookingIndex /></PrivateRoute>} />
            <Route path="/bookings/:bookingId" element={<PrivateRoute><BookingShow /></PrivateRoute>} />
            <Route path="/favorites" element={<PrivateRoute><Favorites /></PrivateRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/listings" element={<AdminRoute><AdminListings /></AdminRoute>} />
            <Route path="/admin/bookings" element={<AdminRoute><AdminBookings /></AdminRoute>} />
            <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
