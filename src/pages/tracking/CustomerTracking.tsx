import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { useDataStore, formatDistance } from '../../store/dataStore';

import TrackingMap from '../../components/map/TrackingMap';
import {
  ArrowLeft, Phone, MessageSquare, Star, CheckCircle,
  Clock, MapPin, AlertCircle,
} from 'lucide-react';
import { simulateVendorMovement } from '../../lib/demoSimulation';

export default function CustomerTracking() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings, vendors, updateBookingVendorLocation } = useDataStore();

  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const stopSimRef = useRef<(() => void) | null>(null);

  const booking = bookings.find(b => b.id === bookingId);
  const vendor = booking ? vendors.find(v => v.id === booking.vendor_id) : null;

  // Auth check
  if (!user || user.role !== 'customer') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-brand-light">
        <div className="card p-10 text-center max-w-md mx-4">
          <h2 className="text-xl font-bold text-brand-dark mb-3">Access Denied</h2>
          <p className="text-gray-500 text-sm mb-6">Please login as a customer to track this booking.</p>
          <button onClick={() => navigate('/customer/login')} className="btn-primary">Login</button>
        </div>
      </div>
    );
  }

  if (!booking || !vendor) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-brand-light">
        <div className="card p-10 text-center max-w-md mx-4">
          <h2 className="text-xl font-bold text-brand-dark mb-3">Booking Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">This booking does not exist or you don't have access.</p>
          <button onClick={() => navigate('/customer/dashboard')} className="btn-primary">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  // Security: only the customer assigned to this booking can see it
  if (booking.customer_id !== user.id) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-brand-light">
        <div className="card p-10 text-center max-w-md mx-4">
          <AlertCircle size={40} className="text-semantic-error mx-auto mb-4" />
          <h2 className="text-xl font-bold text-brand-dark mb-3">Unauthorized</h2>
          <p className="text-gray-500 text-sm">You are not authorized to track this booking.</p>
        </div>
      </div>
    );
  }

  const serviceLocation: [number, number] = [
    booking.booking_lat || 12.9716,
    booking.booking_lng || 77.5946,
  ];

  const vendorLocation: [number, number] | null =
    booking.vendor_live_lat && booking.vendor_live_lng
      ? [booking.vendor_live_lat, booking.vendor_live_lng]
      : null;

  // Demo simulation — auto-start when status is on_the_way and in dev mode
  useEffect(() => {
    if (
      import.meta.env.DEV &&
      booking.status === 'on_the_way' &&
      !stopSimRef.current
    ) {
      const vendorStart: [number, number] = [vendor.lat, vendor.lng];
      const stopSim = simulateVendorMovement(
        { lat: vendorStart[0], lng: vendorStart[1] },
        { lat: serviceLocation[0], lng: serviceLocation[1] },
        (point) => {
          updateBookingVendorLocation(
            booking.id,
            point.lat,
            point.lng,
            point.heading,
            point.speed,
            point.accuracy
          );
          setLastUpdate(Date.now());
        },
        { intervalMs: 3000, steps: 25 }
      );
      stopSimRef.current = stopSim;
    }

    return () => {
      if (stopSimRef.current) {
        stopSimRef.current();
        stopSimRef.current = null;
      }
    };
  }, [booking.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop tracking when completed or cancelled
  useEffect(() => {
    if (['completed', 'cancelled'].includes(booking.status) && stopSimRef.current) {
      stopSimRef.current();
      stopSimRef.current = null;
    }
  }, [booking.status]);

  const handleRouteInfo = useCallback(
    (info: { distanceKm: number; durationMin: number }) => {
      setRouteInfo(info);
    },
    []
  );

  const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Pending', color: 'text-amber-600', bgColor: 'bg-amber-50' },
    accepted: { label: 'Accepted', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    on_the_way: { label: 'On The Way', color: 'text-brand-accent', bgColor: 'bg-brand-accentLight' },
    arrived: { label: 'Arrived', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    in_progress: { label: 'In Progress', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    completed: { label: 'Completed', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    cancelled: { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-50' },
  };

  const currentStatus = statusConfig[booking.status] || statusConfig.pending;

  // Time since last location update
  const timeSinceUpdate = lastUpdate ? Math.round((Date.now() - lastUpdate) / 1000) : null;

  return (
    <div className="min-h-screen bg-brand-light flex flex-col">
      {/* Header — desktop only */}
      <div className="hidden md:block bg-white border-b border-brand-border px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/customer/dashboard')} className="btn-ghost text-gray-500 text-sm px-3 py-2">
            <ArrowLeft size={16} className="mr-1.5" /> Back to Dashboard
          </button>
          <div className="text-sm font-semibold text-brand-dark">
            Booking #{booking.id.slice(0, 6).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* Map */}
        <div className="flex-1 relative h-[55vh] md:h-auto">
          {/* Mobile back button */}
          <button
            onClick={() => navigate('/customer/dashboard')}
            className="md:hidden absolute top-3 left-3 z-[1000] bg-white shadow-card p-2 rounded-xl"
          >
            <ArrowLeft size={18} />
          </button>

          <TrackingMap
            serviceLocation={serviceLocation}
            vendorLocation={vendorLocation}
            status={booking.status}
            onRouteInfo={handleRouteInfo}
            className="w-full h-full"
          />
        </div>

        {/* Info Panel — Side panel on desktop, bottom sheet on mobile */}
        <div
          className={`
            md:w-[380px] md:relative md:h-auto
            fixed bottom-0 left-0 right-0 z-[1001]
            md:z-auto md:bottom-auto md:left-auto md:right-auto
            bg-white md:border-l border-t md:border-t-0 border-brand-border
            md:overflow-y-auto
            transition-transform duration-300 ease-smooth
            ${bottomSheetExpanded ? 'max-h-[50vh] md:max-h-none' : 'max-h-[120px]'}
            rounded-t-3xl md:rounded-none shadow-glass md:shadow-none
          `}
        >
          {/* Drag handle — mobile */}
          <div
            className="md:hidden flex justify-center py-2 cursor-pointer"
            onClick={() => setBottomSheetExpanded(!bottomSheetExpanded)}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(50vh - 20px)' }}>
            {/* Provider Info */}
            <div className="flex items-start gap-3 mb-5">
              <img
                src={vendor.image}
                alt={vendor.business_name}
                className="w-12 h-12 rounded-2xl object-cover shadow-soft flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-brand-dark text-sm truncate">{vendor.business_name}</h3>
                  {vendor.verification_status === 'verified' && (
                    <CheckCircle size={13} className="text-brand-accent flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500">{vendor.category}</p>
              </div>
              <div className={`${currentStatus.bgColor} ${currentStatus.color} px-3 py-1 rounded-pill text-[11px] font-bold whitespace-nowrap`}>
                {currentStatus.label}
              </div>
            </div>

            {/* ETA & Distance — show when on_the_way */}
            {booking.status === 'on_the_way' && routeInfo && (
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="card p-3 text-center">
                  <div className="text-lg font-bold text-brand-dark">{routeInfo.durationMin} min</div>
                  <div className="text-[11px] text-gray-500 font-medium">ETA</div>
                </div>
                <div className="card p-3 text-center">
                  <div className="text-lg font-bold text-brand-dark">{formatDistance(routeInfo.distanceKm)}</div>
                  <div className="text-[11px] text-gray-500 font-medium">Distance</div>
                </div>
              </div>
            )}

            {/* Last location update */}
            {booking.status === 'on_the_way' && timeSinceUpdate !== null && (
              <div className="text-[11px] text-gray-400 mb-4 flex items-center gap-1">
                <Clock size={10} />
                {timeSinceUpdate < 10
                  ? 'Location updated just now'
                  : timeSinceUpdate < 60
                  ? `Location updated ${timeSinceUpdate}s ago`
                  : 'Provider location may be stale'}
              </div>
            )}

            {/* Booking details */}
            <div className="space-y-3 mb-5 text-sm">
              <div className="flex items-start gap-2.5 text-gray-600">
                <MapPin size={14} className="text-brand-accent mt-0.5 flex-shrink-0" />
                <span className="text-xs">{booking.booking_address || booking.address}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-600">
                <Clock size={14} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs">{booking.date} at {booking.time}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button className="btn-secondary btn-sm justify-center">
                <Phone size={14} className="mr-1.5 text-gray-400" /> Call
              </button>
              <button className="btn-secondary btn-sm justify-center">
                <MessageSquare size={14} className="mr-1.5 text-gray-400" /> Message
              </button>
            </div>

            {/* View booking details */}
            <Link
              to="/customer/dashboard"
              className="block text-center text-xs text-brand-accent font-semibold hover:text-brand-accentHover transition-colors"
            >
              View Booking Details
            </Link>

            {/* Completion state */}
            {booking.status === 'completed' && (
              <div className="mt-6 pt-5 border-t border-brand-border text-center">
                <div className="bg-emerald-50 p-4 rounded-2xl mb-4">
                  <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
                  <h3 className="font-bold text-brand-dark mb-1">Service Completed!</h3>
                  <p className="text-xs text-gray-500">Thank you for using IchiHub</p>
                </div>
                <button className="btn-primary btn-sm w-full">
                  <Star size={14} className="mr-1.5" /> Leave a Review
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
