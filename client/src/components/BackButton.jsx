import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Do not render on home page or inside /admin pages (admin has its own topbar back button)
  if (location.pathname === '/' || location.pathname.startsWith('/admin')) {
    return null;
  }

  const handleBack = () => {
    // Auth pages (/signup, /login, /forgot-password) should always navigate directly to home page (/)
    const authPaths = ['/signup', '/login', '/forgot-password'];
    if (authPaths.includes(location.pathname)) {
      navigate('/');
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
