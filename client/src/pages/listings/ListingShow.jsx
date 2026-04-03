import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';
import ListingMap from '../../components/ListingMap';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const PUBLISHABLE_KEY = 'pk_test_51TIASeBN1PIqJJhZDeJRORSIX14Gwhm9sfH4wul6leHGp8YZBFUB0Pn2vvqtSjszaBtNhqQYhyitbc85NyImqr1u00n5AxMvbq';
const stripePromise = loadStripe(PUBLISHABLE_KEY);

function BookingForm({ listing, user, navigate }) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const nights = checkIn && checkOut
    ? Math.max(0, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)))
    : 0;
  const subtotal = nights * (listing?.price || 0);
  const serviceFee = Math.round(subtotal * 0.12);
  const totalPrice = subtotal + serviceFee;

  const createPaymentIntent = async () => {
    if (nights <= 0) return;
    try {
      const res = await API.post('/payment/create-payment-intent', { amount: totalPrice });
      setClientSecret(res.data.clientSecret);
    } catch (err) {
      console.error('Payment intent error:', err);
    }
  };

  useEffect(() => {
    if (nights > 0 && totalPrice > 0) {
      createPaymentIntent();
    }
  }, [nights, totalPrice]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (nights <= 0) { setError('Check-out must be after check-in'); return; }
    
    setBookingLoading(true);
    setError('');

    if (!stripe || !elements || !clientSecret) {
      try {
        await API.post(`/listings/${listing._id}/bookings`, { booking: { checkIn, checkOut, guests } });
        setSuccess('Booking confirmed!');
        setCheckIn(''); setCheckOut(''); setGuests(1);
      } catch (err) {
        setError(err.response?.data?.error || 'Booking failed');
      } finally {
        setBookingLoading(false);
      }
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message);
      setBookingLoading(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        await API.post(`/listings/${listing._id}/bookings`, { booking: { checkIn, checkOut, guests } });
        setSuccess('Booking confirmed with payment!');
        setCheckIn(''); setCheckOut(''); setGuests(1);
      } catch (err) {
        setError(err.response?.data?.error || 'Booking failed');
      }
    }
    setBookingLoading(false);
  };

  return (
    <div className="card" style={{ position: 'sticky', top: 80, padding: '1.5rem' }}>
      {error && <FlashMessage message={error} type="error" />}
      {success && <FlashMessage message={success} type="success" />}
      
      <p className="card-price" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
        ₹{listing.price?.toLocaleString('en-IN')} <span>/ night</span>
      </p>

      <form onSubmit={handleBooking}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '1rem' }}>
          <div style={{ borderRight: '1px solid var(--border)', padding: '0.625rem 0.75rem' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Check-in</label>
            <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={new Date().toISOString().split('T')[0]} style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', marginTop: 2 }} required />
          </div>
          <div style={{ padding: '0.625rem 0.75rem' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Check-out</label>
            <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || new Date().toISOString().split('T')[0]} style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', marginTop: 2 }} required />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label>Guests</label>
          <input type="number" className="form-control" min={1} max={listing?.maxGuests || 20} value={guests} onChange={e => setGuests(Number(e.target.value))} required />
        </div>

        {clientSecret && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
          <PaymentElement />
        </div>
        )}

        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={bookingLoading}>
          {bookingLoading ? 'Processing...' : 'Book Now'}
        </button>
      </form>

      {nights > 0 && (
        <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
          <div className="flex justify-between" style={{ padding: '0.35rem 0' }}>
            <span className="text-light">₹{listing.price?.toLocaleString('en-IN')} x {nights} night{nights !== 1 ? 's' : ''}</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between" style={{ padding: '0.35rem 0' }}>
            <span className="text-light">Service fee (12%)</span>
            <span>₹{serviceFee.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between" style={{ padding: '0.75rem 0 0', borderTop: '1px solid var(--border)', fontWeight: 700, marginTop: '0.5rem' }}>
            <span>Total</span>
            <span>₹{totalPrice.toLocaleString('en-IN')}</span>
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
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [deletingListing, setDeletingListing] = useState(false);

  useEffect(() => {
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

  const avgRating = listing?.reviews?.length
    ? (listing.reviews.reduce((sum, r) => sum + r.rating, 0) / listing.reviews.length).toFixed(1)
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

  return (
    <div className="detail-page">
      {error && <FlashMessage message={error} type="error" />}
      {success && <FlashMessage message={success} type="success" />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="detail-title" style={{ margin: 0 }}>{listing.title}</h1>
        {user && !isOwner && (
          <button
            className="favorite-btn"
            onClick={async () => {
              try {
                await API.post(`/favorites/${id}/toggle`);
                setListing(prev => ({ ...prev, isFavorited: !listing.isFavorited }));
              } catch {}
            }}
            style={{ position: 'static', width: 40, height: 40, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}
          >
            <i className={listing.isFavorited ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} style={{ color: listing.isFavorited ? '#ff385c' : '#666' }}></i>
          </button>
        )}
      </div>
      <p className="detail-location">
        {listing.location}, {listing.country}
        {avgRating && (
          <span className="star-rating" style={{ marginLeft: '1rem' }}>
            <i className="fa-solid fa-star star-filled"></i>
            <span className="rating-value">{avgRating}</span>
            <span className="text-light" style={{ fontSize: '0.85rem' }}>({listing.reviews.length} review{listing.reviews.length !== 1 ? 's' : ''})</span>
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
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <img className="detail-image" src={images[currentImage]?.url || images[currentImage]} alt={listing.title} style={{ marginBottom: 0 }} />
          {images.length > 1 && (
            <>
              <button onClick={() => setCurrentImage(i => (i - 1 + images.length) % images.length)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}><i className="fa-solid fa-chevron-left"></i></button>
              <button onClick={() => setCurrentImage(i => (i + 1) % images.length)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}><i className="fa-solid fa-chevron-right"></i></button>
              <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                {images.map((_, i) => (<span key={i} onClick={() => setCurrentImage(i)} style={{ width: 8, height: 8, borderRadius: '50%', cursor: 'pointer', background: i === currentImage ? '#fff' : 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.3)' }} />))}
              </div>
            </>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
        <div>
          <div className="detail-section">
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Hosted by {host.username || 'Unknown'}</span>
              {listing.category && <span className="badge badge-active">{listing.category}</span>}
            </div>
            <div className="flex gap-3 text-light" style={{ fontSize: '0.9rem' }}>
              <span><i className="fa-solid fa-user"></i> {listing.maxGuests || 10} guests</span>
              <span><i className="fa-solid fa-bed"></i> {listing.bedrooms || 1} bedroom{listing.bedrooms !== 1 ? 's' : ''}</span>
              <span><i className="fa-solid fa-bath"></i> {listing.baths || 1} bath{listing.baths !== 1 ? 's' : ''}</span>
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

            {(!listing.reviews || listing.reviews.length === 0) && <p className="text-light">No reviews yet.</p>}

            {(listing.reviews || []).map(review => {
              const reviewId = review._id || review.id;
              const isReviewAuthor = user && (user._id === (review.author?._id || review.author));
              return (
                <div key={reviewId} style={{ padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '0.35rem' }}>
                    <div className="flex items-center gap-1">
                      <strong style={{ fontSize: '0.9rem' }}>{review.author?.username || 'User'}</strong>
                      <span style={{ fontSize: '0.9rem', display: 'flex', gap: '1px' }}>
                  {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ color: s <= review.rating ? '#ff385c' : '#ddd' }}>{s <= review.rating ? '★' : '☆'}</span>)}
                </span>
                    </div>
                    <span className="text-light" style={{ fontSize: '0.8rem' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem' }}>{review.comment}</p>
                  {isReviewAuthor && <button className="btn btn-danger btn-sm mt-1" onClick={() => handleDeleteReview(reviewId)} style={{ fontSize: '0.75rem' }}>Delete</button>}
                </div>
              );
            })}

            {user ? (
              <form onSubmit={handleReview} style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.75rem' }}>Leave a Review</h3>
                <div className="form-group">
                  <label>Rating</label>
                  <div style={{ fontSize: '1.5rem', cursor: 'pointer', display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <span 
                      key={s} 
                      onClick={() => setReviewRating(s)}
                      style={{ 
                        color: s <= reviewRating ? '#ff385c' : '#ddd',
                        fontSize: '1.5rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {s <= reviewRating ? '★' : '☆'}
                    </span>
                  ))}
                </div>
                </div>
                <div className="form-group">
                  <label htmlFor="review-comment">Comment</label>
                  <textarea id="review-comment" className="form-control" rows={3} value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Share your experience..." required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={reviewLoading}>{reviewLoading ? 'Submitting...' : 'Submit Review'}</button>
              </form>
            ) : <p className="text-light mt-2"><Link to="/login" style={{ color: 'var(--primary)' }}>Log in</Link> to leave a review.</p>}
          </div>
        </div>

        {user && user.role !== 'host' && (
          <Elements stripe={stripePromise}>
            <BookingForm listing={listing} user={user} navigate={navigate} />
          </Elements>
        )}
        {(!user || user.role === 'host') && (
          <div className="card" style={{ position: 'sticky', top: 80, padding: '1.5rem' }}>
            <p className="text-light text-center">Login as a guest to book this place</p>
          </div>
        )}
      </div>
    </div>
  );
}