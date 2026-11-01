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
  const [devResetUrl, setDevResetUrl] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [notRegistered, setNotRegistered] = useState(false);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    const cleanInput = email.trim();
    if (!cleanInput) {
      setError('Please enter your registered email address or username');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    setDevResetUrl('');
    setNotRegistered(false);

    try {
      const res = await API.post('/forgot', { email: cleanInput });
      const msg = res.data?.message || '';

      // If backend signaled that account does not exist (even on 200 OK from older server cache)
      if (
        res.data?.notRegistered ||
        (msg.toLowerCase().includes('if') && msg.toLowerCase().includes('exist'))
      ) {
        setNotRegistered(true);
        setError('This email is not registered with us. Please sign up first before resetting your password.');
        setLoading(false);
        return;
      }

      setMessage(msg || 'Password reset link sent!');
      if (res.data?.resetUrl) {
        setDevResetUrl(res.data.resetUrl);
      }
      if (res.data?.email) {
        setSentEmail(res.data.email);
      }
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 404 || data?.notRegistered) {
        setNotRegistered(true);
        setError(data?.error || 'This account does not exist. Please sign up first before attempting to reset your password.');
      } else {
        setError(data?.error || 'Failed to send reset email. Please verify your account details.');
      }
    } finally {
      setLoading(false);
    }
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
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            {step === 1 
              ? 'Enter your registered email address or username' 
              : 'Enter your new password'}
          </p>
        </div>

        {error && (
          <div style={{
            marginBottom: '1rem',
            padding: '0.85rem 1rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '10px',
            color: '#f87171',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '1rem', flexShrink: 0 }}></i>
            <span style={{ flex: 1, lineHeight: '1.4' }}>{error}</span>
          </div>
        )}
        {notRegistered && (
          <div style={{
            marginBottom: '1.25rem',
            padding: '1.2rem',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.6rem', fontSize: '1.1rem' }}>
              <i className="fa-solid fa-user-xmark"></i>
            </div>
            <h4 style={{ margin: '0 0 0.4rem 0', color: '#fff', fontSize: '0.98rem', fontWeight: 600 }}>
              Account Not Registered
            </h4>
            <p style={{ margin: '0 0 0.9rem 0', color: '#cbd5e1', fontSize: '0.84rem', lineHeight: '1.45' }}>
              You cannot reset a password for an email that is not registered. Please create your account first!
            </p>
            <Link
              to={`/signup?email=${encodeURIComponent(email.trim())}`}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.4rem',
                fontSize: '0.86rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <i className="fa-solid fa-user-plus"></i> Sign Up First
            </Link>
          </div>
        )}
        {message && !error && <FlashMessage message={message} type="success" />}

        {step === 1 ? (
          <div>
            <form onSubmit={handleSendEmail}>
              <div className="form-group">
                <label>Registered Email or Username</label>
                <input
                  type="text"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. your_email@gmail.com or username"
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

            {message && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ color: '#fbbf24', marginTop: 3 }}></i>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.45' }}>
                    <strong style={{ color: '#fff' }}>Check your Spam / Junk folder:</strong>
                    <br />
                    Automated reset emails may land in your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folder depending on your email provider.
                  </div>
                </div>

                {devResetUrl && (
                  <div style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    textAlign: 'center'
                  }}>
                    <a
                      href={devResetUrl}
                      style={{
                        display: 'inline-block',
                        padding: '0.5rem 1rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#818cf8',
                        textDecoration: 'none',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '8px'
                      }}
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square" style={{ marginRight: 6 }}></i>
                      Open Reset Page Directly
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter at least 8 characters"
                minLength={8}
                required
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.875rem' }}
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Set New Password'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/login" style={{ color: '#818cf8', fontWeight: 500 }}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
