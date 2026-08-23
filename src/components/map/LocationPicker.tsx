import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, Navigation, X } from 'lucide-react';
import { useLocationStore } from '../../store/locationStore';

interface LocationPickerProps {
  initialPosition?: [number, number];
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  className?: string;
}

// Draggable pin icon
const pinIcon = L.divIcon({
  className: 'ichi-picker-pin',
  html: `
    <svg width="36" height="48" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.164 0 0 7.164 0 16c0 12 16 26 16 26s16-14 16-26C32 7.164 24.836 0 16 0z" fill="#FF5A1F"/>
      <circle cx="16" cy="16" r="8" fill="white"/>
      <circle cx="16" cy="16" r="4" fill="#FF5A1F"/>
    </svg>
  `,
  iconSize: [36, 48],
  iconAnchor: [18, 48],
});

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Default Bangalore center
const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];

export default function LocationPicker({
  initialPosition,
  onLocationSelect,
  className = '',
}: LocationPickerProps) {
  const { requestBrowserLocation, locationLoading } = useLocationStore();
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(
    initialPosition || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [address, setAddress] = useState('');
  const [mapCenter] = useState<[number, number]>(
    initialPosition || DEFAULT_CENTER
  );

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setSelectedPos([lat, lng]);
      // Reverse geocode
      reverseGeocode(lat, lng);
    },
    []
  );

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      if (data.display_name) {
        setAddress(data.display_name);
      }
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setSelectedPos([lat, lng]);
        setAddress(data[0].display_name || searchQuery);
      }
    } catch {
      // Silently fail
    } finally {
      setSearching(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    const pos = await requestBrowserLocation();
    if (pos) {
      setSelectedPos([pos.lat, pos.lng]);
      reverseGeocode(pos.lat, pos.lng);
    }
  };

  const handleConfirm = () => {
    if (selectedPos) {
      onLocationSelect(selectedPos[0], selectedPos[1], address || `${selectedPos[0].toFixed(5)}, ${selectedPos[1].toFixed(5)}`);
    }
  };

  return (
    <div className={`rounded-2xl overflow-hidden border border-brand-border bg-white ${className}`}>
      {/* Search + Actions Bar */}
      <div className="p-3 border-b border-brand-border space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-brand-border text-sm bg-gray-50 focus:outline-none focus:border-brand-accent/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="btn-primary btn-sm px-3"
          >
            {searching ? '...' : 'Search'}
          </button>
        </div>
        <button
          onClick={handleUseCurrentLocation}
          disabled={locationLoading}
          className="flex items-center gap-1.5 text-xs text-brand-accent font-semibold hover:text-brand-accentHover transition-colors"
        >
          <Navigation size={12} />
          {locationLoading ? 'Getting location...' : 'Use my current location'}
        </button>
      </div>

      {/* Map */}
      <div className="h-[250px] relative">
        <MapContainer
          center={selectedPos || mapCenter}
          zoom={15}
          scrollWheelZoom={true}
          className="w-full h-full ichi-map"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onMapClick={handleMapClick} />
          {selectedPos && (
            <Marker position={selectedPos} icon={pinIcon} />
          )}
        </MapContainer>
        {!selectedPos && (
          <div className="absolute inset-0 bg-black/5 flex items-center justify-center pointer-events-none z-[400]">
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-soft text-sm text-gray-500 font-medium">
              <MapPin size={14} className="inline mr-1.5 text-brand-accent" />
              Click on the map to select location
            </div>
          </div>
        )}
      </div>

      {/* Selected Address + Confirm */}
      {selectedPos && (
        <div className="p-3 border-t border-brand-border bg-gray-50/50">
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">
            <MapPin size={11} className="inline mr-1 text-brand-accent" />
            {address || 'Selected location'}
          </p>
          <button onClick={handleConfirm} className="btn-primary btn-sm w-full">
            Confirm Location
          </button>
        </div>
      )}
    </div>
  );
}
