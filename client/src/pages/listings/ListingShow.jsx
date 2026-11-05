import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';
import ListingMap from '../../components/ListingMap';

function BookingForm({ listing, user, navigate }) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('checkout');
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [qrBookingId, setQrBookingId] = useState('');
  
  const totalPrice = listing?.price || 0;

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (!checkIn || !checkOut) { setError('Please select check-in and check-out dates'); return; }
    if (new Date(checkOut) <= new Date(checkIn)) { setError('Check-out date must be after check-in date'); return; }
    
    setBookingLoading(true);
    setError('');
    
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    try {
      const bookingRes = await API.post(`/listings/${listing._id}/bookings`, { booking: { checkIn, checkOut, guests } });
      const booking = bookingRes.data.booking;
      const orderRes = await API.post('/payment/create-order', { bookingId: booking._id });

      const { orderId, keyId } = orderRes.data;

      const options = {
        key: keyId,
        amount: orderRes.data.amount,
        order_id: orderId,
        name: "Homigo Booking",
        description: `${nights} night(s) - ${listing.title}`,
        handler: async function(response) {
          try {
            await API.post('/payment/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            
            setSuccess('Booking confirmed! Payment successful.');
          
          } catch {
            setError('Payment verified but booking failed. Contact support.');
          }
        },
        prefill: {
          name: user.name || user.username || "",
          email: user.email || ""
        },
        theme: {
          color: "#0066ff"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      
      rzp.on('payment.failed', function() {
        setError('Payment failed. Please try again.');
      });
    } catch {
      setError('Payment failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    if (!qrBookingId) return undefined;
    let cancelled = false;
    const checkPayment = async () => {
      try {
        const response = await API.get(`/payment/qr-status/${qrBookingId}`);
        if (!cancelled && response.data.paid) {
          setQrBookingId('');
          setQrImageUrl('');
          setSuccess('Booking confirmed! QR payment successful.');
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || 'Unable to check QR payment');
      }
    };
    const interval = setInterval(checkPayment, 3000);
    checkPayment();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [qrBookingId]);

  const handleQrBooking = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (!checkIn || !checkOut) { setError('Please select check-in and check-out dates'); return; }
    if (new Date(checkOut) <= new Date(checkIn)) { setError('Check-out date must be after check-in date'); return; }
    setBookingLoading(true);
    setError('');
    try {
      const bookingRes = await API.post(`/listings/${listing._id}/bookings`, { booking: { checkIn, checkOut, guests } });
      const qrRes = await API.post('/payment/create-qr', { bookingId: bookingRes.data.booking._id });
      setQrBookingId(bookingRes.data.booking._id);
      setQrImageUrl(qrRes.data.imageUrl);
      setSuccess('Scan the QR code with any UPI app. This page will update after payment.');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to create QR payment');
    } finally {
      setBookingLoading(false);
    }
  };

  const nights = checkIn && checkOut ? Math.max(0, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))) : 0;
  const subtotal = nights * totalPrice;
  const serviceFee = Math.round(subtotal * 0.12);
  const grandTotal = subtotal + serviceFee;

  return (
    <div className="card" style={{ position: 'sticky', top: 90, padding: '1.75rem', borderRadius: '24px', boxShadow: '0 12px 35px rgba(0, 80, 200, 0.08)', border: '1px solid rgba(0, 102, 255, 0.1)' }}>
      {error && <FlashMessage message={error} type="error" />}
      {success && <FlashMessage message={success} type="success" />}
      
      <p className="card-price" style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0f172a' }}>
        ₹{totalPrice?.toLocaleString('en-IN')} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>/ night</span>
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button type="button" className={paymentMethod === 'checkout' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setPaymentMethod('checkout')} style={{ flex: 1, borderRadius: 'var(--radius-full)', fontSize: '0.82rem' }}>
          Card / UPI
        </button>
        <button type="button" className={paymentMethod === 'qr' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setPaymentMethod('qr')} style={{ flex: 1, borderRadius: 'var(--radius-full)', fontSize: '0.82rem' }}>
          Pay with QR
        </button>
      </div>

      <form onSubmit={paymentMethod === 'qr' ? handleQrBooking : handleBooking}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', marginBottom: '1.25rem', background: '#f8fafc' }}>
          <div style={{ borderRight: '1px solid #e2e8f0', padding: '0.625rem 0.85rem' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', color: '#64748b' }}>Check-in</label>
            <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={new Date().toISOString().split('T')[0]} style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', marginTop: 3, background: 'transparent', color: '#0f172a' }} required />
          </div>
          <div style={{ padding: '0.625rem 0.85rem' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', color: '#64748b' }}>Check-out</label>
            <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || new Date().toISOString().split('T')[0]} style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', marginTop: 3, background: 'transparent', color: '#0f172a' }} required />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Guests</label>
          <input type="number" className="form-control" min={1} max={listing?.maxGuests || 20} value={guests} onChange={e => setGuests(Number(e.target.value))} required style={{ borderRadius: '12px' }} />
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', borderRadius: 'var(--radius-full)', fontWeight: 700 }} disabled={bookingLoading || Boolean(qrBookingId)}>
          {bookingLoading ? 'Processing...' : paymentMethod === 'qr' ? 'Generate Payment QR' : 'Book Now'}
        </button>
      </form>

      {qrImageUrl && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p style={{ fontWeight: 600 }}>Scan with your UPI app</p>
          <img src={qrImageUrl} alt="Razorpay payment QR code" style={{ width: 220, height: 220, objectFit: 'contain' }} />
          <p className="text-light" style={{ fontSize: '0.85rem' }}>Waiting for payment confirmation...</p>
        </div>
      )}

      {nights > 0 && (
        <div style={{ marginTop: '1.25rem', fontSize: '0.9rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
          <div className="flex justify-between" style={{ padding: '0.35rem 0' }}>
            <span className="text-light">₹{totalPrice?.toLocaleString('en-IN')} x {nights} night{nights !== 1 ? 's' : ''}</span>
            <span style={{ fontWeight: 600 }}>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between" style={{ padding: '0.35rem 0' }}>
            <span className="text-light">Service fee (12%)</span>
            <span style={{ fontWeight: 600 }}>₹{serviceFee.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between" style={{ padding: '0.75rem 0 0', borderTop: '1px solid #e2e8f0', fontWeight: 800, marginTop: '0.5rem', fontSize: '1.05rem', color: '#0f172a' }}>
            <span>Total</span>
            <span style={{ color: '#0066ff' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ListingShow() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [currentImage, setCurrentImage] = useState(0);
  const [isGalleryPaused, setIsGalleryPaused] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [deletingListing, setDeletingListing] = useState(false);

  useEffect(() => {
    const images = listing?.images || [];
    if (!isGalleryPaused && images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImage(i => (i + 1) % images.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isGalleryPaused, listing?.images]);

  useEffect(() => {
    if (!id) {
      setError('Listing ID is missing');
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    API.get(`/listings/${id}`)
      .then(res => setListing(res.data.listing || res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load listing'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setReviewLoading(true);
    setError('');
    try {
      const res = await API.post(`/listings/${id}/reviews`, { review: { rating: reviewRating, comment: reviewComment } });
      const newReview = res.data.review || res.data;
      setListing(prev => ({ ...prev, reviews: [...(prev.reviews || []), newReview] }));
      setReviewComment('');
      setReviewRating(5);
      setSuccess('Review added!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add review');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await API.delete(`/listings/${id}/reviews/${reviewId}`);
      setListing(prev => ({ ...prev, reviews: (prev.reviews || []).filter(r => (r._id || r.id) !== reviewId) }));
      setSuccess('Review deleted');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete review');
    }
  };

  const handleDeleteListing = async () => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    setDeletingListing(true);
    try {
      await API.delete(`/listings/${id}`);
      navigate('/listings');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete listing');
      setDeletingListing(false);
    }
  };

  const reviews = listing?.reviews || [];
  const reviewCount = Array.isArray(reviews) ? reviews.length : 0;
  const avgRating = reviewCount > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount).toFixed(1)
    : null;

  const isOwner = user && listing && (user._id === listing.owner?._id || user._id === listing.owner);

  if (loading) return <div className="loading-spinner" />;
  if (!listing) return (
    <div className="container text-center" style={{ padding: '4rem 0' }}>
      {error ? <FlashMessage message={error} type="error" /> : <h2>Listing not found</h2>}
    </div>
  );

  const images = listing.images || [];
  const host = listing.owner || {};
  const activeImageIndex = images.length > 0 ? (currentImage % images.length) : 0;

  return (
    <div className="detail-page">
      {error && <FlashMessage message={error} type="error" />}
      {success && <FlashMessage message={success} type="success" />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="detail-title" style={{ margin: '0 0 0.5rem 0' }}>{listing.title}</h1>
      </div>
      <p className="detail-location" style={{ marginBottom: '0.75rem' }}>
        <i className="fa-solid fa-location-dot" style={{ color: '#0066ff', marginRight: '0.4rem' }}></i>
        {listing.location}, {listing.country}
        {avgRating && (
          <span className="star-rating" style={{ marginLeft: '1.25rem' }}>
            <i className="fa-solid fa-star star-filled"></i>
            <span className="rating-value">{avgRating}</span>
            <span className="text-light" style={{ fontSize: '0.85rem' }}>({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
          </span>
        )}
      </p>

      {isOwner && (
        <div className="flex gap-1 mb-2">
          <Link to={`/listings/${id}/edit`} className="btn btn-secondary btn-sm">Edit Listing</Link>
          <button className="btn btn-danger btn-sm" onClick={handleDeleteListing} disabled={deletingListing}>
            {deletingListing ? 'Deleting...' : 'Delete Listing'}
          </button>
        </div>
      )}

      {images.length > 0 && (
        <div 
          style={{ 
            position: 'relative', 
            marginBottom: '1.5rem', 
            borderRadius: 24, 
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 80, 200, 0.08)'
          }}
          onMouseEnter={() => setIsGalleryPaused(true)}
          onMouseLeave={() => setIsGalleryPaused(false)}
        >
          <img 
            className="detail-image" 
            src={images[activeImageIndex]?.url || (typeof images[activeImageIndex] === 'string' ? images[activeImageIndex] : '') || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'} 
            alt={listing.title} 
            fetchPriority={activeImageIndex === 0 ? 'high' : 'auto'}
            decoding="async"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80';
            }}
            style={{ marginBottom: 0, transition: 'opacity 0.4s ease' }} 
          />
          {images.length > 1 && (
            <div 
              className="hero-slider-dots"
              style={{ 
                position: 'absolute', 
                bottom: 20, 
                left: '50%', 
                transform: 'translateX(-50%)', 
                zIndex: 10,
                marginTop: 0
              }}
            >
              {images.map((_, i) => (
                <span 
                  key={i} 
                  className={`hero-dot${i === activeImageIndex ? ' active' : ''}`}
                  onClick={() => setCurrentImage(i)} 
                  title={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="listing-detail-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
        <div>
          <div className="detail-section">
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Hosted by {host.username || 'Unknown'}</span>
              {listing.category && <span className="badge badge-active">{listing.category}</span>}
            </div>
            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem 2rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="fa-solid fa-user"></i> {listing.maxGuests || 10} guests</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="fa-solid fa-bed"></i> {listing.bedrooms || 1} bedroom{listing.bedrooms !== 1 ? 's' : ''}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="fa-solid fa-bath"></i> {listing.baths || 1} bath{listing.baths !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>About this place</h3>
            <p className="text-light">{listing.description}</p>
          </div>

          {(listing.amenities?.length > 0) && (
            <div className="detail-section">
              <h3>What this place offers</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {listing.amenities.map((amenity, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                    <i className="fa-solid fa-check" style={{ color: 'var(--success)' }}></i> {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {listing.houseRules && (
            <div className="detail-section">
              <h3>House Rules</h3>
              <p className="text-light">{listing.houseRules}</p>
            </div>
          )}

          <div className="detail-section">
            <div className="flex gap-2 mb-1">
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Check-in: {listing.checkInTime || '12:00 PM'}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Check-out: {listing.checkOutTime || '10:00 AM'}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>Location</h3>
            <p className="text-light mb-2">{listing.location}, {listing.country}</p>
            {listing.geometry?.coordinates?.[0] && listing.geometry?.coordinates?.[1] ? (
              <ListingMap 
                lat={listing.geometry.coordinates[1]} 
                lng={listing.geometry.coordinates[0]} 
                title={listing.title} 
              />
            ) : (
              <div style={{ height: 200, background: 'var(--bg)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="text-light">Map not available</p>
              </div>
            )}
          </div>

            <div className="detail-section" style={{ borderBottom: 'none' }}>
            <h3>Reviews{avgRating && <span className="star-rating" style={{ marginLeft: '0.5rem' }}><i className="fa-solid fa-star star-filled"></i><span className="rating-value">{avgRating}</span></span>}</h3>

            {reviewCount === 0 && <p className="text-light">No reviews yet.</p>}

            {reviews.map(review => {
              const reviewId = review._id || review.id;
              const isReviewAuthor = user && (user._id === (review.author?._id || review.author));
              return (
                <div key={reviewId} style={{ padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '0.35rem' }}>
                    <div className="flex items-center gap-1">
                      <strong style={{ fontSize: '0.9rem' }}>{review.author?.username || 'User'}</strong>
                      <span style={{ fontSize: '0.9rem', display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <span key={s} style={{ color: s <= review.rating ? '#fbbf24' : '#cbd5e1' }}>
                            {s <= review.rating ? '★' : '☆'}
                          </span>
                        ))}
                      </span>
                    </div>
                    <span className="text-light" style={{ fontSize: '0.8rem' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem' }}>{review.comment}</p>
                  {isReviewAuthor && <button className="btn btn-danger btn-sm mt-1" onClick={() => handleDeleteReview(reviewId)} style={{ fontSize: '0.75rem' }}>Delete</button>}
                </div>
              );
            })}

            {user && user.role === 'guest' ? (
              <form onSubmit={handleReview} style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.75rem', color: '#0f172a' }}>Leave a Review</h3>
                <div className="form-group">
                  <label style={{ color: '#334155', fontWeight: 600 }}>Rating</label>
                  <div style={{ fontSize: '1.5rem', cursor: 'pointer', display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <span 
                      key={s} 
                      onClick={() => setReviewRating(s)}
                      style={{ 
                        color: s <= reviewRating ? '#fbbf24' : '#cbd5e1',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      {s <= reviewRating ? '★' : '☆'}
                    </span>
                  ))}
                </div>
                </div>
                <div className="form-group">
                  <label htmlFor="review-comment" style={{ color: '#334155', fontWeight: 600 }}>Comment</label>
                  <textarea id="review-comment" className="form-control" rows={3} value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Share your experience..." required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={reviewLoading} style={{ borderRadius: 50, padding: '0.6rem 1.4rem', fontWeight: 600 }}>{reviewLoading ? 'Submitting...' : 'Submit Review'}</button>
              </form>
            ) : user && user.role === 'host' ? (
              <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: '#eff6ff', borderRadius: 14, border: '1px solid rgba(0, 102, 255, 0.12)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="fa-solid fa-circle-info" style={{ color: '#0066ff', fontSize: '1.1rem' }}></i>
                <p style={{ margin: 0, color: '#0f172a', fontSize: '0.9rem', fontWeight: 500 }}>
                  Only logged-in guests can leave reviews on listings.
                </p>
              </div>
            ) : <p className="text-light mt-2" style={{ color: '#64748b' }}><Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Log in</Link> as a guest to leave a review.</p>}
          </div>
        </div>

        {user && user.role === 'guest' && (
          <BookingForm listing={listing} user={user} navigate={navigate} />
        )}
        {user && user.role === 'host' && (
          <div className="card" style={{ position: 'sticky', top: 80, padding: '1.75rem 1.5rem', borderRadius: 20, border: '1px solid rgba(0, 102, 255, 0.08)', boxShadow: '0 8px 25px rgba(0, 80, 200, 0.05)', background: '#ffffff' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <i className="fa-solid fa-shield-halved" style={{ fontSize: '1.4rem', color: '#0066ff' }}></i>
              </div>
              <h4 style={{ color: '#0f172a', fontWeight: 700, margin: '0 0 0.4rem 0', fontSize: '1.05rem' }}>Host Account</h4>
              <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                Bookings are restricted for host accounts. Only guests can make reservations.
              </p>
            </div>
          </div>
        )}
        {!user && (
          <div className="card" style={{ position: 'sticky', top: 80, padding: '1.75rem 1.5rem', borderRadius: 20, border: '1px solid rgba(0, 102, 255, 0.08)', boxShadow: '0 8px 25px rgba(0, 80, 200, 0.05)', background: '#ffffff' }}>
            <p className="text-light text-center" style={{ margin: 0, color: '#64748b', fontSize: '0.92rem' }}>
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Login</Link> as a guest to book this place
            </p>
          </div>
        )}
      </div>
    </div>
  );
}