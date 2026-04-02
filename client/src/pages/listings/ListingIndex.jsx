import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';

const CATEGORIES = [
  { label: 'Trending', icon: 'fa-fire', value: 'Trending' },
  { label: 'Rooms', icon: 'fa-bed', value: 'Rooms' },
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

export default function ListingIndex() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTax, setShowTax] = useState(false);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

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
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    setSearchParams(params);
  };

  const handleCategoryClick = (catValue) => {
    if (category === catValue) {
      setCategory('');
      const params = new URLSearchParams(searchParams);
      params.delete('category');
      setSearchParams(params);
    } else {
      setCategory(catValue);
      const params = new URLSearchParams(searchParams);
      params.set('category', catValue);
      setSearchParams(params);
    }
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

  const activeCategory = searchParams.get('category') || '';

  return (
    <div className="container" style={{ padding: '1.5rem 1.5rem' }}>
      {error && <FlashMessage message={error} type="error" />}

      <form className="navbar-search" onSubmit={handleSearch} style={{ maxWidth: 720, margin: '0 auto 1.5rem', background: '#fff', borderRadius: 'var(--radius-full)', overflow: 'hidden', border: '1px solid var(--border)', display: 'flex' }}>
        <input
          type="text"
          placeholder="Search destinations..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Min ₹"
          value={minPrice}
          onChange={e => setMinPrice(e.target.value)}
          style={{ width: 90, border: 'none', borderLeft: '1px solid var(--border)', padding: '0.5rem', fontSize: '0.85rem', outline: 'none' }}
        />
        <input
          type="number"
          placeholder="Max ₹"
          value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)}
          style={{ width: 90, border: 'none', borderLeft: '1px solid var(--border)', padding: '0.5rem', fontSize: '0.85rem', outline: 'none' }}
        />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {minPrice && maxPrice && (
        <div className="text-center mb-2 text-light" style={{ fontSize: '0.85rem' }}>
          Price range: ₹{Number(minPrice).toLocaleString('en-IN')} – ₹{Number(maxPrice).toLocaleString('en-IN')}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => handleCategoryClick(cat.value)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
              background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              color: activeCategory === cat.value ? 'var(--primary)' : 'var(--text-light)',
              borderBottom: activeCategory === cat.value ? '2px solid var(--primary)' : '2px solid transparent',
              paddingBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.2s',
              opacity: activeCategory === cat.value ? 1 : 0.7,
            }}
          >
            <i className={`fa-solid ${cat.icon}`} style={{ fontSize: '1.25rem' }}></i>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-2" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <p className="text-light" style={{ fontSize: '0.9rem' }}>
          {listings.length} listing{listings.length !== 1 ? 's' : ''} found
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
          <span>Show prices with 18% GST</span>
          <div
            onClick={() => setShowTax(!showTax)}
            style={{
              width: 42, height: 24, borderRadius: 12, position: 'relative',
              background: showTax ? 'var(--primary)' : 'var(--border-dark)', cursor: 'pointer', transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2,
              left: showTax ? 20 : 2, transition: 'left 0.2s', boxShadow: 'var(--shadow-sm)',
            }} />
          </div>
        </label>
      </div>

      {loading ? (
        <div className="loading-spinner" />
      ) : listings.length === 0 ? (
        <div className="text-center" style={{ padding: '4rem 0' }}>
          <h2>No listings found</h2>
          <p className="text-light mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="listing-grid">
          {listings.map(listing => (
            <div key={listing._id} className="card" style={{ position: 'relative' }}>
              <button
                className={`favorite-btn${favorites.has(listing._id) ? ' active' : ''}`}
                onClick={(e) => { e.preventDefault(); toggleFavorite(listing._id); }}
                title={favorites.has(listing._id) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <i className={favorites.has(listing._id) ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}></i>
              </button>
              <Link to={`/listings/${listing._id}`}>
                <img
                  className="card-img"
                  src={listing.images?.[0]?.url || listing.images?.[0] || '/placeholder.jpg'}
                  alt={listing.title}
                />
                <div className="card-body">
                  <div className="flex justify-between items-center">
                    <h3 className="card-title">{listing.title}</h3>
                    {listing.avgRating > 0 && (
                      <span className="star-rating" style={{ fontSize: '0.8rem' }}>
                        <i className="fa-solid fa-star star-filled"></i>
                        <span className="rating-value">{listing.avgRating.toFixed(1)}</span>
                      </span>
                    )}
                  </div>
                  <p className="card-text">{listing.location}, {listing.country}</p>
                  <p className="card-price mt-1">
                    {formatPrice(listing.price)} <span>/ night</span>
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
