import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface UserMarkerProps {
  position: [number, number];
  label?: string;
}

// Custom pulsing blue dot icon for "You are here"
const userIcon = L.divIcon({
  className: 'ichi-user-marker',
  html: `
    <div class="ichi-user-marker-outer">
      <div class="ichi-user-marker-inner"></div>
      <div class="ichi-user-marker-pulse"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -16],
});

export default function UserMarker({ position, label = 'You are here' }: UserMarkerProps) {
  return (
    <Marker position={position} icon={userIcon}>
      <Popup className="ichi-popup">
        <div className="text-center">
          <p className="font-bold text-brand-dark text-sm">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">Your location</p>
        </div>
      </Popup>
    </Marker>
  );
}
