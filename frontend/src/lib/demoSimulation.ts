/**
 * Demo simulation utilities for vendor movement.
 * Only used in development mode.
 */

export interface SimulationPoint {
  lat: number;
  lng: number;
}

/**
 * Interpolate points along a straight line between two positions.
 * Returns an array of intermediate points for smooth animation.
 */
export function interpolateRoute(
  from: SimulationPoint,
  to: SimulationPoint,
  steps: number = 20
): SimulationPoint[] {
  const points: SimulationPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push({
      lat: from.lat + (to.lat - from.lat) * t,
      lng: from.lng + (to.lng - from.lng) * t,
    });
  }
  return points;
}

/**
 * Calculate heading (bearing) between two points in degrees.
 */
export function calculateHeading(from: SimulationPoint, to: SimulationPoint): number {
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const heading = (Math.atan2(y, x) * 180) / Math.PI;
  return (heading + 360) % 360;
}

/**
 * Simulate vendor movement from `from` to `to`.
 * Calls `onUpdate` at each step with the current position.
 * Returns a cleanup function to stop the simulation.
 */
export function simulateVendorMovement(
  from: SimulationPoint,
  to: SimulationPoint,
  onUpdate: (point: SimulationPoint & { heading: number; speed: number; accuracy: number }) => void,
  options: {
    intervalMs?: number;
    steps?: number;
    jitter?: number; // random GPS jitter in degrees
  } = {}
): () => void {
  const { intervalMs = 2000, steps = 30, jitter = 0.00005 } = options;
  const route = interpolateRoute(from, to, steps);
  let currentStep = 0;
  let stopped = false;

  const interval = setInterval(() => {
    if (stopped || currentStep >= route.length) {
      clearInterval(interval);
      return;
    }

    const point = route[currentStep];
    const nextPoint = route[Math.min(currentStep + 1, route.length - 1)];
    const heading = calculateHeading(point, nextPoint);

    // Add slight GPS jitter for realism
    const jitteredLat = point.lat + (Math.random() - 0.5) * jitter;
    const jitteredLng = point.lng + (Math.random() - 0.5) * jitter;

    onUpdate({
      lat: jitteredLat,
      lng: jitteredLng,
      heading,
      speed: 6 + Math.random() * 4, // ~6-10 m/s (city driving)
      accuracy: 8 + Math.random() * 10, // 8-18m accuracy
    });

    currentStep++;
  }, intervalMs);

  return () => {
    stopped = true;
    clearInterval(interval);
  };
}
