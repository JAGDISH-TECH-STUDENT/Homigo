import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const THUNDERFOREST_API_KEY = import.meta.env.VITE_THUNDERFOREST_API_KEY;
const tileUrl = THUNDERFOREST_API_KEY
  ? `https://api.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=${THUNDERFOREST_API_KEY}`
  : null;

export default function ListingMap({ lat, lng, title, zoom = 13 }) {
  if (!lat || !lng) {
    return (
      <div style={{ height: 300, background: '#f0f0f0', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-light">Location not available</p>
      </div>
    );
  }

  if (!tileUrl) {
    return (
      <div style={{ height: 300, background: '#f0f0f0', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-light">Map is not configured. Set VITE_THUNDERFOREST_API_KEY.</p>
      </div>
    );
  }

  return (
    <MapContainer center={[lat, lng]} zoom={zoom} style={{ height: 300, borderRadius: 'var(--radius)', zIndex: 1 }}>
      <TileLayer
        url={tileUrl}
        attribution='&copy; <a href="https://www.thunderforest.com/">Thunderforest</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Marker position={[lat, lng]}>
        <Popup>{title}</Popup>
      </Marker>
    </MapContainer>
  );
}