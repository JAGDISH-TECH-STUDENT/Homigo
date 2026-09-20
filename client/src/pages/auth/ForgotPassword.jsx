import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token') || '';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step] = useState(resetToken ? 2 : 1);
  const [token] = useState(resetToken);
  const [newPassword, setNewPassword] = useState('');

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await API.post('/forgot', { email: email.trim() });
      setMessage('Password reset link sent. Please check your Inbox, Spam, Promotions, and All Mail folders.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset email');
    }
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await API.post('/forgot/reset', { token, newPassword });
      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 120px)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f8f9fc',
      padding: '2rem'
    }}>
      <div style={{ 
        background: '#fff', 
        borderRadius: 16, 
        padding: '2.5rem',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
          </h1>
          <p style={{ color: '#64748b' }}>
            {step === 1 
              ? 'Enter your email to receive a reset link' 
              : 'Enter your new password'}
          </p>
        </div>

        {error && <FlashMessage message={error} type="error" />}
        {message && <FlashMessage message={message} type="success" />}

        {step === 1 ? (
          <form onSubmit={handleSendEmail}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.875rem' }}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.875rem' }}
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/login" style={{ color: '#5f60b9', fontWeight: 500 }}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}