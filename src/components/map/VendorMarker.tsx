import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Star, CheckCircle, MapPin } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { VendorProfile } from '../../store/dataStore';

interface VendorMarkerProps {
  vendor: VendorProfile;
  distanceKm: number;
  /** If true, shows larger tracking-style marker with avatar */
  isTracking?: boolean;
}

function createVendorIcon(verified: boolean, isTracking: boolean) {
  if (isTracking) {
    // Tracking marker — larger with vehicle icon
    return L.divIcon({
      className: 'ichi-vendor-tracking-marker',
      html: `
        <div class="ichi-vendor-tracking-dot">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L19 21l-7-4-7 4 7-19z"/>
          </svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -24],
    });
  }

  // Discovery marker
  const color = verified ? '#FF5A1F' : '#6B6B6B';
  const iconSvg = renderToStaticMarkup(
    <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.164 0 0 7.164 0 16c0 12 16 26 16 26s16-14 16-26C32 7.164 24.836 0 16 0z" fill={color} />
      <circle cx="16" cy="16" r="8" fill="white" />
      <circle cx="16" cy="16" r="4" fill={color} />
    </svg>
  );

  return L.divIcon({
    className: 'ichi-vendor-marker',
    html: iconSvg,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
}

export default function VendorMarker({ vendor, distanceKm, isTracking = false }: VendorMarkerProps) {
  const icon = createVendorIcon(vendor.verification_status === 'verified', isTracking);

  return (
    <Marker position={[vendor.lat, vendor.lng]} icon={icon}>
      <Popup className="ichi-popup" maxWidth={260} minWidth={220}>
        <div className="p-1">
          <div className="flex items-start gap-3 mb-2">
            <img
              src={vendor.image}
              alt={vendor.business_name}
              className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-bold text-brand-dark text-sm leading-tight truncate">{vendor.business_name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                {vendor.verification_status === 'verified' && (
                  <CheckCircle size={11} className="text-brand-accent flex-shrink-0" />
                )}
                <span className="text-[11px] text-gray-500">{vendor.category}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs mb-3">
            <div className="flex items-center gap-1 text-gray-500">
              <MapPin size={11} className="text-brand-accent" />
              <span>{distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`} away</span>
            </div>
            {vendor.rating > 0 && (
              <div className="flex items-center gap-0.5">
                <Star size={11} fill="#F59E0B" className="text-amber-500" />
                <span className="font-bold text-amber-700">{vendor.rating}</span>
              </div>
            )}
          </div>

          <div className="flex gap-1.5">
            <Link
              to={`/provider/${vendor.id}`}
              className="flex-1 text-center py-1.5 rounded-xl text-[11px] font-semibold border border-brand-border text-brand-dark hover:bg-gray-50 transition-colors"
            >
              View
            </Link>
            <Link
              to={`/book/${vendor.id}`}
              className="flex-1 text-center py-1.5 rounded-xl text-[11px] font-semibold bg-brand-accent text-white hover:bg-brand-accentHover transition-colors"
            >
              Book
            </Link>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

/**
 * Simple position marker for tracking views (no popup card needed).
 */
export function VendorPositionMarker({
  position,
}: {
  position: [number, number];
}) {
  const icon = L.divIcon({
    className: 'ichi-vendor-tracking-marker',
    html: `
      <div class="ichi-vendor-tracking-dot">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L19 21l-7-4-7 4 7-19z"/>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  return <Marker position={position} icon={icon} />;
}

/**
 * Service location marker (pin for where service should be performed).
 */
export function ServiceLocationMarker({
  position,
  label = 'Service Location',
}: {
  position: [number, number];
  label?: string;
}) {
  const icon = L.divIcon({
    className: 'ichi-service-marker',
    html: `
      <div class="ichi-service-marker-pin">
        <svg width="28" height="36" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.164 0 0 7.164 0 16c0 12 16 26 16 26s16-14 16-26C32 7.164 24.836 0 16 0z" fill="#10B981"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });

  return (
    <Marker position={position} icon={icon}>
      <Popup className="ichi-popup">
        <p className="font-bold text-sm text-brand-dark">{label}</p>
      </Popup>
    </Marker>
  );
}
