import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';

const CATEGORIES = [
  { label: 'All Listings', icon: 'fa-border-all', value: '' },
  { label: 'Trending', icon: 'fa-fire', value: 'Trending' },
  { label: 'Iconic Cities', icon: 'fa-city', value: 'Iconic cities' },
  { label: 'Mountains', icon: 'fa-mountain', value: 'Mountains' },
  { label: 'Castles', icon: 'fa-fort-awesome', value: 'Castles' },
  { label: 'Amazing Pools', icon: 'fa-person-swimming', value: 'Amazing pools' },
  { label: 'Camping', icon: 'fa-campground', value: 'Camping' },
  { label: 'Farms', icon: 'fa-cow', value: 'Farms' },
  { label: 'Arctic', icon: 'fa-snowflake', value: 'Arctic' },
  { label: 'Domes', icon: 'fa-igloo', value: 'Domes' },
  { label: 'Boats', icon: 'fa-ship', value: 'Boats' },
];

const HERO_SLIDES = [
  {
    bg: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2000&q=80',
    badge: 'Plan. Book. Explore.',
    heading: 'Discover Your',
    headingBlue: 'Perfect Stay',
    subheading: 'Luxury. Comfort. Unforgettable Experiences.'
  },
  {
    bg: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2000&q=80',
    badge: 'Exclusive Destinations',
    heading: 'Experience The',
    headingBlue: 'Finest Retreats',
    subheading: 'Curated villas and beachside escapes worldwide.'
  },
  {
    bg: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=2000&q=80',
    badge: 'Island Paradises',
    heading: 'Escape To Dreamy',
    headingBlue: 'Overwater Villas',
    subheading: 'Turquoise lagoons, ocean breezes, and panoramic sunsets.'
  },
  {
    bg: 'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=2000&q=80',
    badge: 'Mountain Lodges',
    heading: 'Breathe Fresh In',
    headingBlue: 'Alpine Sanctuaries',
    subheading: 'Cozy fireplaces, panoramic peaks, and tranquil nature.'
  },
  {
    bg: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2000&q=80',
    badge: 'Bespoke Getaways',
    heading: 'Indulge In Grand',
    headingBlue: 'Coastal Escapes',
    subheading: 'Private waterfront terraces with five-star luxury amenities.'
  },
  {
    bg: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2000&q=80',
    badge: 'Golden Horizons',
    heading: 'Unwind At Serene',
    headingBlue: 'Secluded Havens',
    subheading: 'Tailored travel, unforgettable memories, and ultimate comfort.'
  }
];

export default function ListingIndex() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTax, setShowTax] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    const params = new URLSearchParams();
    const q = searchParams.get('q');
    const cat = searchParams.get('category');
    const min = searchParams.get('minPrice');
    const max = searchParams.get('maxPrice');

    if (q) params.set('q', q);
    if (cat) params.set('category', cat);
    if (min) params.set('minPrice', min);
    if (max) params.set('maxPrice', max);

    const endpoint = (q || cat || min || max)
      ? `/listings/search?${params.toString()}`
      : '/listings';

    const timer = setTimeout(() => {
      setLoading(true);
      setError('');
      API.get(endpoint)
        .then(res => {
          setListings(res.data.listings || []);
          const favSet = new Set(res.data.userFavorites || []);
          setFavorites(favSet);
        })
        .catch(err => {
          setError(err.response?.data?.error || 'Failed to load listings');
        })
        .finally(() => setLoading(false));
    }, 0);

    return () => clearTimeout(timer);
  }, [searchParams]);

  const handleCategoryClick = (catValue) => {
    const params = new URLSearchParams(searchParams);
    if (!catValue || searchParams.get('category') === catValue) {
      params.delete('category');
    } else {
      params.set('category', catValue);
    }
    setSearchParams(params);
  };

  const toggleFavorite = async (listingId) => {
    if (!user) return;
    try {
      await API.post(`/favorites/${listingId}/toggle`);
      setFavorites(prev => {
        const next = new Set(prev);
        if (next.has(listingId)) next.delete(listingId);
        else next.add(listingId);
        return next;
      });
    } catch {
      /* ignore */
    }
  };

  const formatPrice = (price) => {
    const val = showTax ? Math.round(price * 1.18) : price;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Auto-rotate hero carousel slides every 4.5 seconds
  useEffect(() => {
    if (isHeroPaused) return undefined;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isHeroPaused]);

  const activeCategory = searchParams.get('category') || '';
  const currentHero = HERO_SLIDES[activeSlide] || HERO_SLIDES[0];

  return (
    <div className="container" style={{ padding: '0 1.5rem 2rem' }}>
      {error && <FlashMessage message={error} type="error" />}

      {/* ========== HERO BANNER (COASTAL LUXURY) ========== */}
      <section 
        className="home-hero-card"
        style={{ backgroundImage: `url(${currentHero.bg})` }}
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
      >
        <div className="home-hero-overlay" />
        <div className="home-hero-content">
          <div className="hero-pill-badge">
            <i className="fa-solid fa-plane" style={{ transform: 'rotate(-30deg)' }}></i>
            <span>{currentHero.badge}</span>
          </div>

          <h1 className="hero-heading">
            {currentHero.heading}
            <span className="hero-blue-text">{currentHero.headingBlue}</span>
          </h1>

          <p className="hero-subheading">{currentHero.subheading}</p>

          <button 
            type="button"
            className="hero-cta-btn"
            onClick={() => document.getElementById('featured-listings')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Explore Now <i className="fa-solid fa-arrow-right"></i>
          </button>

          <div className="hero-slider-dots">
            {HERO_SLIDES.map((_, i) => (
              <span 
                key={i} 
                className={`hero-dot${i === activeSlide ? ' active' : ''}`}
                onClick={() => setActiveSlide(i)}
                aria-label={`Slide ${i + 1}`}
                role="button"
                tabIndex={0}
              />
            ))}
          </div>
        </div>

        {/* Floating Trusted Badge on the Right */}
        <div className="hero-trust-badge">
          <div className="badge-icon">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div className="badge-text">
            <h4>Trusted by 1M+ Travelers</h4>
            <div className="stars">
              ★★★★★ <span style={{ color: '#0f172a', fontWeight: 700, marginLeft: 4 }}>4.8/5</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FLOATING CATEGORY CAROUSEL PILL BAR ========== */}
      <nav className="home-category-bar" aria-label="Listing categories">
        {CATEGORIES.map((cat, idx) => {
          const isActive = (activeCategory === cat.value) || (!activeCategory && cat.value === '');
          return (
            <div key={cat.label} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                className={`category-pill-item${isActive ? ' active' : ''}`}
                onClick={() => handleCategoryClick(cat.value)}
              >
                <i className={`fa-solid ${cat.icon}`}></i>
                <span>{cat.label}</span>
              </button>
              {idx < CATEGORIES.length - 1 && <div className="category-pill-divider" />}
            </div>
          );
        })}
      </nav>

      {/* ========== FEATURED LISTINGS HEADER ========== */}
      <div id="featured-listings" className="section-header-row">
        <div className="section-header-left">
          <div className="section-blue-bar" />
          <div>
            <h2>Featured Listings</h2>
            <p>Handpicked stays for your next adventure</p>
          </div>
        </div>

        {/* 18% GST Toggle Pill */}
        <div 
          className="gst-toggle-card"
          onClick={() => setShowTax(!showTax)}
          role="button"
          tabIndex={0}
        >
          <span>Show prices with 18% GST</span>
          <div className={`gst-toggle-switch${showTax ? ' active' : ''}`}>
            <div className="switch-dot" />
          </div>
        </div>
      </div>

      {/* ========== LISTING GRID ========== */}
      {loading ? (
        <div className="loading-spinner" />
      ) : listings.length === 0 ? (
        <div className="text-center" style={{ padding: '4rem 0' }}>
          <h2>No listings found</h2>
          <p className="text-light mt-1">Try adjusting your search destination or filters.</p>
        </div>
      ) : (
        <div className="listing-grid">
          {listings.map((listing, index) => {
            const rating = listing.avgRating ? listing.avgRating.toFixed(1) : (4.7 + (index % 3) * 0.1).toFixed(1);
            const isFav = favorites.has(listing._id);

            return (
              <div key={listing._id} className="luxury-card">
                <div className="luxury-card-img-wrap">
                  {/* Top-left Rating Badge */}
                  <div className="card-rating-badge">
                    <i className="fa-solid fa-star"></i>
                    <span>{rating}</span>
                  </div>

                  {/* Top-right Favorite Heart */}
                  <button
                    className={`card-fav-btn${isFav ? ' active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFavorite(listing._id);
                    }}
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    aria-label="Toggle favorite"
                  >
                    ♥
                  </button>

                  <Link to={`/listings/${listing._id}`}>
                    <img
                      className="luxury-card-img"
                      src={listing.images?.[0]?.url || listing.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                      alt={listing.title}
                      loading="lazy"
                      decoding="async"
                    />
                  </Link>
                </div>

                <div className="luxury-card-body">
                  <Link to={`/listings/${listing._id}`}>
                    <h3 className="luxury-card-title" title={listing.title}>
                      {listing.title}
                    </h3>
                  </Link>

                  <div className="luxury-card-location">
                    <i className="fa-solid fa-location-dot"></i>
                    <span>{listing.location}, {listing.country}</span>
                  </div>

                  <div className="luxury-card-footer">
                    <div className="luxury-card-price">
                      {formatPrice(listing.price)} <span>/ night</span>
                    </div>

                    <Link to={`/listings/${listing._id}`} className="luxury-view-btn">
                      View Details <i className="fa-solid fa-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========== BOTTOM TRUST & FEATURES BANNER ========== */}
      <section className="home-trust-banner">
        <div className="trust-items-row">
          <div className="trust-item">
            <div className="trust-item-icon">
              <i className="fa-solid fa-headphones"></i>
            </div>
            <div className="trust-item-text">
              <h5>24/7 Support</h5>
              <p>We're here to help anytime</p>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-item-icon">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div className="trust-item-text">
              <h5>Secure Booking</h5>
              <p>Your data is always safe</p>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-item-icon">
              <i className="fa-solid fa-bolt"></i>
            </div>
            <div className="trust-item-text">
              <h5>Instant Confirmation</h5>
              <p>Book in just a few clicks</p>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-item-icon">
              <i className="fa-solid fa-heart"></i>
            </div>
            <div className="trust-item-text">
              <h5>Trusted by Millions</h5>
              <p>Travel with confidence</p>
            </div>
          </div>
        </div>

        {/* Flight Dotted Trail Graphic */}
        <div className="trust-plane-trail" aria-hidden="true">
          <svg viewBox="0 0 160 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M10 40 C 50 40, 70 15, 120 18" 
              stroke="#0066ff" 
              strokeWidth="2" 
              strokeDasharray="4 4" 
              strokeOpacity="0.4"
            />
          </svg>
          <i 
            className="fa-solid fa-plane" 
            style={{ 
              color: '#0066ff', 
              fontSize: '1.4rem', 
              transform: 'rotate(15deg)',
              marginLeft: '-10px'
            }}
          ></i>
        </div>
      </section>
    </div>
  );
}
