import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';

import { VendorPositionMarker, ServiceLocationMarker } from './VendorMarker';
import RoutePolyline from './RoutePolyline';
import MapControls, { RecenterButton } from './MapControls';
import type { BookingStatus } from '../../store/dataStore';

interface TrackingMapProps {
  /** Customer / service location */
  serviceLocation: [number, number];
  /** Vendor live location */
  vendorLocation?: [number, number] | null;
  /** Current booking status */
  status: BookingStatus;
  /** Callback with route info */
  onRouteInfo?: (info: { distanceKm: number; durationMin: number }) => void;
  className?: string;
}

/** Auto-fit map bounds when positions change */
function FitBounds({
  positions,
}: {
  positions: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (positions.length >= 2) {
      const bounds = positions.map(p => [p[0], p[1]] as [number, number]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    } else if (positions.length === 1) {
      map.setView(positions[0], 15);
    }
  }, [positions.map(p => `${p[0]},${p[1]}`).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

export default function TrackingMap({
  serviceLocation,
  vendorLocation,
  status,
  onRouteInfo,
  className = '',
}: TrackingMapProps) {
  const showVendorMarker = vendorLocation && ['on_the_way', 'arrived', 'in_progress'].includes(status);
  const showRoute = vendorLocation && status === 'on_the_way';

  const allPositions: [number, number][] = [serviceLocation];
  if (vendorLocation && showVendorMarker) {
    allPositions.push(vendorLocation);
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}>
      <MapContainer
        center={serviceLocation}
        zoom={15}
        scrollWheelZoom={true}
        className="w-full h-full ichi-map"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Auto-fit bounds */}
        <FitBounds positions={allPositions} />

        {/* Controls */}
        <MapControls locatePosition={serviceLocation} />

        {/* Service location */}
        <ServiceLocationMarker position={serviceLocation} label="Service Location" />

        {/* Vendor marker */}
        {showVendorMarker && vendorLocation && (
          <VendorPositionMarker position={vendorLocation} />
        )}

        {/* Route */}
        {showRoute && vendorLocation && (
          <RoutePolyline
            from={vendorLocation}
            to={serviceLocation}
            onRouteInfo={onRouteInfo}
          />
        )}

        {/* Re-center button */}
        <RecenterButton position={serviceLocation} />
      </MapContainer>

      {/* Status overlay */}
      <TrackingStatusOverlay status={status} />
    </div>
  );
}

function TrackingStatusOverlay({ status }: { status: BookingStatus }) {
  const config: Record<string, { text: string; color: string; pulse?: boolean }> = {
    pending: { text: 'Waiting for provider confirmation...', color: 'bg-amber-500' },
    accepted: { text: 'Provider accepted your request', color: 'bg-blue-500' },
    on_the_way: { text: 'Your provider is on the way', color: 'bg-brand-accent', pulse: true },
    arrived: { text: 'Your provider has arrived', color: 'bg-emerald-500' },
    in_progress: { text: 'Service in progress', color: 'bg-blue-500', pulse: true },
    completed: { text: 'Service completed', color: 'bg-emerald-500' },
    cancelled: { text: 'Booking cancelled', color: 'bg-red-500' },
  };

  const current = config[status];
  if (!current) return null;

  return (
    <div className="absolute top-3 left-3 z-[1000]">
      <div className="bg-white/95 backdrop-blur-sm shadow-card rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-semibold">
        <span className={`w-2 h-2 rounded-full ${current.color} ${current.pulse ? 'animate-pulse-soft' : ''}`} />
        <span className="text-brand-dark">{current.text}</span>
      </div>
    </div>
  );
}
