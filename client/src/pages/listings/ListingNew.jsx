import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';

const CATEGORIES = [
  'Trending', 'Rooms', 'Iconic cities', 'Mountains', 'Castles',
  'Amazing pools', 'Camping', 'Farms', 'Arctic', 'Domes', 'Boats',
];

const AMENITIES = [
  'Wifi', 'Kitchen', 'AC', 'Heating', 'Washer', 'Dryer',
  'TV', 'Parking', 'Pool', 'Gym', 'Hot Tub', 'Pet Friendly',
  'Workspace', 'Coffee Maker', 'Iron', 'Hair Dryer', 'BBQ Grill', 'Beach Access',
  'Mountain View', 'Lake Access', 'Ski-in/Ski-out', 'EV Charger', 'Wheelchair Accessible'
];

export default function ListingNew() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    country: '',
    price: '',
    category: 'Trending',
    maxGuests: '10',
    bedrooms: '1',
    beds: '1',
    baths: '1',
    houseRules: '',
    checkInTime: '3:00 PM',
    checkOutTime: '11:00 AM',
  });
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = new FormData();
    Object.entries(form).forEach(([key, val]) => data.append(`listing[${key}]`, val));
    selectedAmenities.forEach(a => data.append(`listing[amenities]`, a));
    images.forEach(img => data.append('listing[images]', img));

    try {
      await API.post('/listings', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate('/listings');
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to create listing';
      if (errMsg.includes('Cannot read image')) {
        setError('Image format not supported. Please use JPG, PNG, or WebP format (under 1MB).');
      } else {
        setError(errMsg);
      }
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {error && <FlashMessage message={error} type="error" />}

        <div className="page-header">
          <h1>Create New Listing</h1>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                name="title"
                type="text"
                className="form-control"
                value={form.title}
                onChange={handleChange}
                placeholder="Cozy apartment in the city"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                className="form-control"
                rows={4}
                value={form.description}
                onChange={handleChange}
                placeholder="Describe your place..."
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  className="form-control"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Mumbai"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  className="form-control"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="India"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="price">Price/night (₹)</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  className="form-control"
                  value={form.price}
                  onChange={handleChange}
                  min={1}
                  placeholder="2500"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="maxGuests">Guests</label>
                <input
                  id="maxGuests"
                  name="maxGuests"
                  type="number"
                  className="form-control"
                  value={form.maxGuests}
                  onChange={handleChange}
                  min={1}
                  max={20}
                />
              </div>
              <div className="form-group">
                <label htmlFor="bedrooms">Bedrooms</label>
                <input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  className="form-control"
                  value={form.bedrooms}
                  onChange={handleChange}
                  min={0}
                />
              </div>
              <div className="form-group">
                <label htmlFor="beds">Beds</label>
                <input
                  id="beds"
                  name="beds"
                  type="number"
                  className="form-control"
                  value={form.beds}
                  onChange={handleChange}
                  min={0}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  className="form-control"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="checkInTime">Check-in Time</label>
                <input
                  id="checkInTime"
                  name="checkInTime"
                  type="text"
                  className="form-control"
                  value={form.checkInTime}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="checkOutTime">Check-out Time</label>
                <input
                  id="checkOutTime"
                  name="checkOutTime"
                  type="text"
                  className="form-control"
                  value={form.checkOutTime}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Amenities</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {AMENITIES.map(amenity => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    style={{
                      padding: '0.375rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      border: selectedAmenities.includes(amenity)
                        ? '2px solid var(--primary)'
                        : '1px solid var(--border)',
                      background: selectedAmenities.includes(amenity)
                        ? 'var(--primary)'
                        : 'transparent',
                      color: selectedAmenities.includes(amenity) ? '#fff' : 'var(--text)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="houseRules">House Rules</label>
              <textarea
                id="houseRules"
                name="houseRules"
                className="form-control"
                rows={3}
                value={form.houseRules}
                onChange={handleChange}
                placeholder="No smoking, no pets, quiet hours after 10 PM..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="images">Images</label>
              <input
                id="images"
                type="file"
                className="form-control"
                accept="image/*"
                multiple
                onChange={handleImages}
              />
              {previews.length > 0 && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                  {previews.map((src, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={src} alt={`Preview ${i + 1}`} style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                      <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Creating...' : 'Create Listing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}