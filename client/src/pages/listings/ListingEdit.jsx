import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import FlashMessage from '../../components/FlashMessage';

const CATEGORIES = [
  'Trending', 'Rooms', 'Iconic cities', 'Mountains', 'Castles',
  'Amazing pools', 'Camping', 'Farms', 'Arctic', 'Domes', 'Boats',
];

export default function ListingEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    country: '',
    price: '',
    category: 'Trending',
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get(`/listings/${id}`)
      .then(res => {
        const l = res.data.listing || res.data;
        setForm({
          title: l.title || '',
          description: l.description || '',
          location: l.location || '',
          country: l.country || '',
          price: l.price || '',
          category: l.category || 'Trending',
        });
        setExistingImages(l.images || []);
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to load listing'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    setNewImages(prev => [...prev, ...files]);
    setNewPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const data = new FormData();
    Object.entries(form).forEach(([key, val]) => data.append(`listing[${key}]`, val));

    existingImages.forEach(img => {
      const url = img.url || img;
      data.append('existingImages', url);
    });

    newImages.forEach(img => data.append('listing[images]', img));

    try {
      await API.put(`/listings/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate(`/listings/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update listing');
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {error && <FlashMessage message={error} type="error" />}

        <div className="page-header">
          <h1>Edit Listing</h1>
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
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="price">Price per night (₹)</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  className="form-control"
                  value={form.price}
                  onChange={handleChange}
                  min={1}
                  required
                />
              </div>
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
            </div>

            {existingImages.length > 0 && (
              <div className="form-group">
                <label>Current Images</label>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {existingImages.map((img, i) => {
                    const src = img.url || img;
                    return (
                      <div key={i} style={{ position: 'relative' }}>
                        <img
                          src={src}
                          alt={`Current ${i + 1}`}
                          style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(i)}
                          style={{
                            position: 'absolute', top: -6, right: -6, width: 22, height: 22,
                            borderRadius: '50%', background: 'var(--danger)', color: '#fff',
                            border: 'none', cursor: 'pointer', fontSize: '0.75rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          &times;
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="new-images">Add More Images</label>
              <input
                id="new-images"
                type="file"
                className="form-control"
                accept="image/*"
                multiple
                onChange={handleNewImages}
              />
              {newPreviews.length > 0 && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                  {newPreviews.map((src, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img
                        src={src}
                        alt={`New preview ${i + 1}`}
                        style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(i)}
                        style={{
                          position: 'absolute', top: -6, right: -6, width: 22, height: 22,
                          borderRadius: '50%', background: 'var(--danger)', color: '#fff',
                          border: 'none', cursor: 'pointer', fontSize: '0.75rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={saving}>
              {saving ? 'Saving...' : 'Update Listing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
