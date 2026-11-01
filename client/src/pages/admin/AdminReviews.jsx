import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';
import AdminSidebar from './AdminSidebar';

let reviewsCache = null;

export default function AdminReviews() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState(reviewsCache || []);
  const [loading, setLoading] = useState(!reviewsCache);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  useEffect(() => {
    API.get('/admin/reviews')
      .then(res => {
        const data = res.data.reviews || [];
        reviewsCache = data;
        setReviews(data);
      })
      .catch(err => {
        if (!reviewsCache) {
          setError(err.response?.data?.error || 'Failed to load reviews');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      await API.delete(`/admin/reviews/${id}`);
      setReviews(prev => {
        const next = prev.filter(r => r._id !== id);
        reviewsCache = next;
        return next;
      });
      setSuccess('Review deleted successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete review');
    }
  };

  const filtered = reviews.filter(r => {
    const matchSearch = r.author?.username?.toLowerCase().includes(search.toLowerCase()) ||
      r.comment?.toLowerCase().includes(search.toLowerCase()) ||
      r.listing?.title?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (ratingFilter === 'all') return true;
    if (ratingFilter === '5') return r.rating === 5;
    if (ratingFilter === '4') return r.rating === 4;
    if (ratingFilter === '3') return r.rating === 3;
    if (ratingFilter === 'low') return r.rating <= 2;
    return true;
  });

  if (loading) {
    return (
      <div className="admin-layout admin-dark">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-page-header-dark">
            <div>
              <h1>
                <i className="fa-solid fa-star" style={{ color: '#fbbf24', marginRight: '0.6rem', fontSize: '1.4rem' }}></i>
                Manage Reviews
              </h1>
              <p>Audit traveler feedback, star ratings, and moderate reviews across all properties.</p>
            </div>
          </div>
          <div className="admin-loading-container">
            <div className="admin-spinner"></div>
            <div className="admin-loading-text">Loading reviews...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout admin-dark">
      <AdminSidebar />

      <div className="admin-content">
        {error && <FlashMessage message={error} type="error" />}
        {success && <FlashMessage message={success} type="success" />}

        {/* Page Header */}
        <div className="admin-page-header-dark">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.4rem' }}>
              <button
                type="button"
                className="admin-back-btn admin-back-btn-sm"
                onClick={() => {
                  if (window.history.state?.idx > 0) {
                    navigate(-1);
                  } else {
                    navigate('/admin');
                  }
                }}
                title="Go back"
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Back</span>
              </button>
              <h1 style={{ margin: 0 }}>
                <i className="fa-solid fa-star" style={{ color: '#fbbf24', marginRight: '0.6rem', fontSize: '1.4rem' }}></i>
                Manage Reviews
              </h1>
            </div>
            <p>Audit traveler feedback, star ratings, and moderate reviews across all properties.</p>
          </div>
          <div className="admin-header-actions-dark">
            <div style={{ position: 'relative' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}></i>
              <input
                type="text"
                className="admin-input-dark"
                placeholder="Search comment, author, listing..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '2.4rem', width: '280px' }}
              />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Reviews', count: reviews.length },
            { id: '5', label: '5 Stars ★', count: reviews.filter(r => r.rating === 5).length },
            { id: '4', label: '4 Stars ★', count: reviews.filter(r => r.rating === 4).length },
            { id: '3', label: '3 Stars ★', count: reviews.filter(r => r.rating === 3).length },
            { id: 'low', label: '≤ 2 Stars', count: reviews.filter(r => r.rating <= 2).length },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setRatingFilter(f.id)}
              className={`admin-btn ${ratingFilter === f.id ? 'admin-btn-primary' : 'admin-btn-outline'}`}
              style={{ fontSize: '0.78rem' }}
            >
              {f.label} <span style={{ opacity: 0.75, marginLeft: '0.3rem' }}>({f.count})</span>
            </button>
          ))}
        </div>

        {/* Reviews Table Card */}
        <div className="admin-card-dark">
          <div className="admin-card-dark-header">
            <h3>
              User Feedback & Ratings
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.5rem', fontWeight: 400 }}>
                ({filtered.length} {filtered.length === 1 ? 'review' : 'reviews'})
              </span>
            </h3>
          </div>

          <div className="admin-table-container">
            <table className="admin-table-dark">
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Listing</th>
                  <th>Rating</th>
                  <th style={{ minWidth: '250px' }}>Review Comment</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>
                      <i className="fa-solid fa-comment-slash" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }}></i>
                      No reviews found matching your search
                    </td>
                  </tr>
                ) : filtered.map(r => (
                  <tr key={r._id}>
                    <td>
                      <div className="admin-user-cell">
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#fbbf24', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                          {(r.author?.username || 'A')[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: '#fff' }}>
                          @{r.author?.username || 'Anonymous'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.85)' }} title={r.listing?.title}>
                        {r.listing?.title || 'Unknown Property'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <i
                            key={s}
                            className="fa-solid fa-star"
                            style={{
                              color: s <= (r.rating || 0) ? '#fbbf24' : 'rgba(255,255,255,0.15)',
                              fontSize: '0.75rem'
                            }}
                          />
                        ))}
                        <span style={{ marginLeft: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>
                          {r.rating}.0
                        </span>
                      </div>
                    </td>
                    <td>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
                        {r.comment}
                      </p>
                    </td>
                    <td>
                      <span className="admin-td-muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => handleDelete(r._id)}
                          title="Delete Review"
                        >
                          <i className="fa-solid fa-trash-can"></i> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
