import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import API from '../api/axios';
import FlashMessage from '../components/FlashMessage';

export default function Complaints() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ subject: '', description: '', category: 'other', priority: 'medium', againstUser: '' });
  const [hostSearch, setHostSearch] = useState('');

  useEffect(() => {
    if (showForm) {
      loadUsers();
    }
  }, [showForm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/listings/hosts');
      setUsers(res.data.users || []);
    } catch {
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role === 'host' || user.role === 'admin') {
      setError('Only guests can submit complaints');
      return;
    }
    if (!form.againstUser) {
      setError('Please select a host');
      return;
    }
    try {
      await API.post('/complaints', form);
      setSuccess('Complaint submitted successfully!');
      setForm({ subject: '', description: '', category: 'other', priority: 'medium', againstUser: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit complaint');
    }
  };

  const canSubmitComplaint = user && user.role !== 'host' && user.role !== 'admin';
  const filteredHosts = users.filter(h => 
    hostSearch === '' || 
    h.username.toLowerCase().includes(hostSearch.toLowerCase()) ||
    h.email.toLowerCase().includes(hostSearch.toLowerCase()) ||
    h._id.toLowerCase().includes(hostSearch.toLowerCase())
  );

  const helpCards = [
    {
      icon: 'fa-calendar-check',
      title: 'Booking Issues',
      description: 'View and manage your bookings, cancellations, and modifications.',
      link: '/bookings',
      show: canSubmitComplaint
    },
    {
      icon: 'fa-credit-card',
      title: 'Payment Help',
      description: 'Learn about payment methods, refunds, and billing questions.',
      link: null,
      show: true
    },
    {
      icon: 'fa-headset',
      title: 'Contact Support',
      description: 'Reach our support team for urgent assistance.',
      link: null,
      show: true
    },
    {
      icon: 'fa-shield-halved',
      title: 'Safety & Security',
      description: 'Learn about safety guidelines and how we protect you.',
      link: null,
      show: true
    }
  ];

  const contactMethods = [
    { icon: 'fa-envelope', title: 'Email', value: 'support@homigo.com', action: 'mailto:support@homigo.com' },
    { icon: 'fa-phone', title: 'Phone', value: '+91 12345 67890', action: null },
    { icon: 'fa-clock', title: 'Hours', value: 'Mon-Fri, 9AM-6PM', action: null }
  ];

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ 
          width: 80, height: 80, borderRadius: '50%', 
          background: 'linear-gradient(135deg, #6D67C9 0%, #5a54b3 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem', fontSize: '2rem', color: '#fff'
        }}>
          <i className="fa-solid fa-headset"></i>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1a1a2e' }}>Help & Support</h1>
        <p style={{ fontSize: '1.1rem', color: '#666' }}>We're here to help you with any questions or concerns</p>
      </div>

      {error && <FlashMessage message={error} type="error" />}
      {success && <FlashMessage message={success} type="success" />}

      {!showForm ? (
        <div>
          {canSubmitComplaint && (
            <div style={{ 
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              borderRadius: 16, padding: '2rem', color: '#fff', marginBottom: '2rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: '1rem', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: '#fff' }}>Need to file a complaint?</h3>
                <p style={{ opacity: 0.9, margin: 0, color: 'rgba(255,255,255,0.85)' }}>Our support team will review and respond within 24-48 hours.</p>
              </div>
              <button 
                onClick={() => setShowForm(true)}
                style={{
                  background: '#fff', color: '#4f46e5', border: 'none',
                  padding: '0.875rem 2rem', borderRadius: 10, fontWeight: 700,
                  cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                Submit Complaint
              </button>
            </div>
          )}

          {!user && (
            <div style={{ 
              background: '#111827', borderRadius: 12, padding: '1.5rem', 
              textAlign: 'center', marginBottom: '2rem', border: '1px dashed rgba(255,255,255,0.15)'
            }}>
              <i className="fa-solid fa-user-lock" style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem' }}></i>
              <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                <Link to="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>Login</Link> as a guest to submit complaints
              </p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {helpCards.filter(card => card.show).map((card, index) => (
              <div key={index} style={{
                background: '#111827', borderRadius: 16, padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)',
                transition: 'transform 0.2s, box-shadow 0.2s', cursor: card.link ? 'pointer' : 'default'
              }}
              onClick={() => card.link && navigate(card.link)}
              >
                <div style={{ 
                  width: 50, height: 50, borderRadius: 12, 
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1rem', fontSize: '1.25rem', color: '#818cf8'
                }}>
                  <i className={`fa-solid ${card.icon}`}></i>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#fff' }}>{card.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>{card.description}</p>
              </div>
            ))}
          </div>

          <div style={{ 
            background: '#111827', borderRadius: 16, padding: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)'
          }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1.5rem', color: '#fff', textAlign: 'center' }}>
              <i className="fa-regular fa-paper-plane" style={{ marginRight: '0.5rem', color: '#818cf8' }}></i>
              Get in Touch
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              {contactMethods.map((method, index) => (
                <div key={index} style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ 
                    width: 48, height: 48, borderRadius: '50%', 
                    background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 0.75rem', fontSize: '1.1rem', color: '#818cf8'
                  }}>
                    <i className={`fa-solid ${method.icon}`}></i>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', marginBottom: '0.25rem' }}>{method.title}</p>
                  {method.action ? (
                    <a href={method.action} style={{ color: '#818cf8', fontWeight: 500, textDecoration: 'none' }}>
                      {method.value}
                    </a>
                  ) : (
                    <p style={{ fontSize: '0.95rem', color: '#fff', margin: 0, fontWeight: 500 }}>{method.value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ 
            marginTop: '2rem', padding: '1.5rem', background: 'rgba(251, 191, 36, 0.1)', 
            borderRadius: 12, border: '1px solid rgba(251, 191, 36, 0.25)', textAlign: 'center'
          }}>
            <i className="fa-solid fa-lightbulb" style={{ color: '#fbbf24', marginRight: '0.5rem' }}></i>
            <span style={{ color: '#fde68a', fontSize: '0.95rem' }}>
              <strong>Tip:</strong> For fastest response, include your booking ID when contacting us about booking issues.
            </span>
          </div>
        </div>
      ) : (
        <div style={{ 
          background: '#111827', borderRadius: 16, padding: '2rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)',
          maxWidth: 600, margin: '0 auto', color: '#fff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', margin: 0 }}>
              <i className="fa-solid fa-file-circle-exclamation" style={{ marginRight: '0.5rem', color: '#818cf8' }}></i>
              Submit Complaint
            </h2>
            <button 
              onClick={() => setShowForm(false)}
              style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          
          {loading ? (
            <div className="loading-spinner" />
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block', color: '#333' }}>
                  Select Host <span style={{ color: '#666', fontWeight: 400 }}>(against whom complaint is)</span>
                </label>
                <input
                  type="text"
                  placeholder="Search by name, email or ID..."
                  value={hostSearch}
                  onChange={e => setHostSearch(e.target.value)}
                  style={{ 
                    padding: '0.75rem', borderRadius: '8px 8px 0 0', border: '1px solid #ddd',
                    borderBottom: 'none', width: '100%', marginBottom: '0.5rem'
                  }}
                />
                <select
                  className="form-control"
                  value={form.againstUser}
                  onChange={e => setForm({ ...form, againstUser: e.target.value })}
                  required
                  style={{ padding: '0.75rem', borderRadius: '0 0 8px 8px', border: '1px solid #ddd' }}
                >
                  <option value="">Select a host...</option>
                  {filteredHosts.map(u => (
                    <option key={u._id} value={u._id}>
                      ID: {u._id.slice(-6)} | {u.username} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
          
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block', color: '#333' }}>Subject</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  required
                  placeholder="Brief subject of your issue"
                  style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid #ddd' }}
                />
              </div>
          
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block', color: '#333' }}>Category</label>
                  <select
                    className="form-control"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid #ddd' }}
                  >
                    <option value="booking">Booking Issue</option>
                    <option value="payment">Payment Issue</option>
                    <option value="listing">Property Issue</option>
                    <option value="host">Host Issue</option>
                    <option value="guest">Guest Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>
            
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block', color: '#333' }}>Priority</label>
                  <select
                    className="form-control"
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid #ddd' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
          
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block', color: '#333' }}>Description</label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  required
                  placeholder="Describe your issue in detail..."
                  style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid #ddd', resize: 'vertical' }}
                />
              </div>
          
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setShowForm(false)}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: 8 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ 
                    padding: '0.75rem 2rem', borderRadius: 8, 
                    background: 'linear-gradient(135deg, #6D67C9 0%, #5a54b3 100%)',
                    border: 'none', fontWeight: 600
                  }}
                >
                  Submit Complaint
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}