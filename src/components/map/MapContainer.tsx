import { MapContainer as LeafletMapContainer, TileLayer } from 'react-leaflet';
import type { ReactNode } from 'react';
import type { LatLngExpression } from 'leaflet';

interface IchiMapContainerProps {
  center: LatLngExpression;
  zoom?: number;
  className?: string;
  children?: ReactNode;
  scrollWheelZoom?: boolean;
}

export default function IchiMapContainer({
  center,
  zoom = 15,
  className = '',
  children,
  scrollWheelZoom = true,
}: IchiMapContainerProps) {
  return (
    <LeafletMapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={scrollWheelZoom}
      className={`ichi-map ${className}`}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {children}
    </LeafletMapContainer>
  );
}
