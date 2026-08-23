import { useMap } from 'react-leaflet';
import { Plus, Minus, Locate } from 'lucide-react';
import type { LatLngExpression } from 'leaflet';

interface MapControlsProps {
  /** Position to center when "locate" is clicked */
  locatePosition?: LatLngExpression;
  className?: string;
}

export default function MapControls({ locatePosition, className = '' }: MapControlsProps) {
  const map = useMap();

  return (
    <div className={`absolute right-3 top-3 z-[1000] flex flex-col gap-1.5 ${className}`}>
      <button
        onClick={() => map.zoomIn()}
        className="ichi-map-control-btn"
        title="Zoom in"
      >
        <Plus size={16} />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="ichi-map-control-btn"
        title="Zoom out"
      >
        <Minus size={16} />
      </button>
      {locatePosition && (
        <button
          onClick={() => map.flyTo(locatePosition, 15, { duration: 0.5 })}
          className="ichi-map-control-btn"
          title="Re-center"
        >
          <Locate size={16} />
        </button>
      )}
    </div>
  );
}

/**
 * Re-center button for tracking views.
 * Flies to given position when clicked.
 */
export function RecenterButton({
  position,
  label = 'Re-center',
}: {
  position: LatLngExpression;
  label?: string;
}) {
  const map = useMap();
  return (
    <button
      onClick={() => map.flyTo(position, map.getZoom(), { duration: 0.5 })}
      className="absolute bottom-4 right-3 z-[1000] bg-white shadow-card hover:shadow-card-hover px-3 py-2 rounded-xl text-xs font-semibold text-brand-dark flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
    >
      <Locate size={13} className="text-brand-accent" />
      {label}
    </button>
  );
}
