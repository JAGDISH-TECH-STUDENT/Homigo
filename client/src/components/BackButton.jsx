import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Do not render on home pages (/, /listings, /listings/search) or inside /admin pages
  const isHomePage = location.pathname === '/' || location.pathname === '/listings' || location.pathname === '/listings/search';
  if (isHomePage || location.pathname.startsWith('/admin')) {
    return null;
  }

  const handleBack = () => {
    // Host Dashboard and auth pages (/signup, /login, /forgot-password) must always lead directly to home page (/)
    const homePaths = ['/host/dashboard', '/signup', '/login', '/forgot-password'];
    if (homePaths.includes(location.pathname)) {
      navigate('/');
      return;
    }

    if (location.pathname === '/host/listings') {
      navigate('/host/dashboard');
      return;
    }

    if (typeof window !== 'undefined' && window.history.state?.idx > 0) {
      navigate(-1);
    } else if (user?.role === 'admin' && location.pathname.startsWith('/listings')) {
      navigate('/admin/listings');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="back-button-bar">
      <button
        type="button"
        className="back-button"
        onClick={handleBack}
        aria-label="Go back"
        title="Go back"
      >
        <i className="fa-solid fa-arrow-left"></i>
        <span>Back</span>
      </button>
    </div>
  );
}
