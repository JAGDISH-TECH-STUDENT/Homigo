import { useLocation, useNavigate } from 'react-router-dom';

export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const canGoBack = typeof window !== 'undefined' && window.history.state?.idx > 0;

  if (!canGoBack || location.pathname === '/') return null;

  return (
    <div className="back-button-bar">
      <button type="button" className="back-button" onClick={() => navigate(-1)} aria-label="Go back">
        <span aria-hidden="true">&#8592;</span>
        Back
      </button>
    </div>
  );
}
