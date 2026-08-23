import { useEffect, useState } from 'react';
import { Polyline } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';

interface RoutePolylineProps {
  from: [number, number];
  to: [number, number];
  color?: string;
  weight?: number;
  onRouteInfo?: (info: { distanceKm: number; durationMin: number }) => void;
}

/**
 * Draws a route polyline between two points.
 * Attempts to fetch real route from OSRM; falls back to straight line.
 */
export default function RoutePolyline({
  from,
  to,
  color = '#FF5A1F',
  weight = 4,
  onRouteInfo,
}: RoutePolylineProps) {
  const [routePositions, setRoutePositions] = useState<LatLngExpression[]>([from, to]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchRoute() {
      try {
        // OSRM public demo API (for development only)
        const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Route API failed');

        const data = await response.json();

        if (cancelled) return;

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]] as LatLngExpression
          );
          setRoutePositions(coordinates);
          
          if (onRouteInfo) {
            onRouteInfo({
              distanceKm: route.distance / 1000,
              durationMin: Math.round(route.duration / 60),
            });
          }
          setFetched(true);
        }
      } catch {
        // Fallback to straight line
        if (!cancelled) {
          setRoutePositions([from, to]);
          // Calculate straight-line distance as fallback
          if (onRouteInfo) {
            const R = 6371;
            const dLat = ((to[0] - from[0]) * Math.PI) / 180;
            const dLon = ((to[1] - from[1]) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((from[0] * Math.PI) / 180) *
                Math.cos((to[0] * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distanceKm = R * c;
            onRouteInfo({
              distanceKm,
              durationMin: Math.round((distanceKm / 25) * 60), // ~25km/h city
            });
          }
        }
      }
    }

    fetchRoute();

    return () => {
      cancelled = true;
    };
  }, [from[0], from[1], to[0], to[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Shadow line */}
      <Polyline
        positions={routePositions}
        pathOptions={{
          color: '#000',
          weight: weight + 3,
          opacity: 0.1,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      {/* Main route line */}
      <Polyline
        positions={routePositions}
        pathOptions={{
          color,
          weight,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: fetched ? undefined : '10, 10',
        }}
      />
    </>
  );
}
