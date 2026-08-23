import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { useDataStore, formatDistance } from '../../store/dataStore';
import { useToastStore } from '../../store/toastStore';
import TrackingMap from '../../components/map/TrackingMap';
import {
  ArrowLeft, Navigation, MapPin, Clock, CheckCircle,
  AlertCircle, Play, Flag, Wrench, CircleCheckBig, Phone, MessageSquare,
} from 'lucide-react';
import { simulateVendorMovement } from '../../lib/demoSimulation';

export default function VendorTracking() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings, vendors, updateBookingStatus, updateBookingVendorLocation } = useDataStore();
  const { addToast } = useToastStore();

  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(true);
  const stopSimRef = useRef<(() => void) | null>(null);

  const booking = bookings.find(b => b.id === bookingId);
  const myProfile = booking ? vendors.find(v => v.id === booking.vendor_id) : null;

  // Auth check
  if (!user || user.role !== 'vendor') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-brand-light">
        <div className="card p-10 text-center max-w-md mx-4">
          <h2 className="text-xl font-bold text-brand-dark mb-3">Access Denied</h2>
          <p className="text-gray-500 text-sm mb-6">Please login as a vendor to manage this booking.</p>
          <button onClick={() => navigate('/vendor/login')} className="btn-primary">Login</button>
        </div>
      </div>
    );
  }

  if (!booking || !myProfile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-brand-light">
        <div className="card p-10 text-center max-w-md mx-4">
          <h2 className="text-xl font-bold text-brand-dark mb-3">Booking Not Found</h2>
          <button onClick={() => navigate('/vendor/dashboard')} className="btn-primary">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  // Security: only the assigned vendor can manage this booking
  if (myProfile.user_id !== user.id) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-brand-light">
        <div className="card p-10 text-center max-w-md mx-4">
          <AlertCircle size={40} className="text-semantic-error mx-auto mb-4" />
          <h2 className="text-xl font-bold text-brand-dark mb-3">Unauthorized</h2>
          <p className="text-gray-500 text-sm">You are not the assigned vendor for this booking.</p>
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
      : [myProfile.lat, myProfile.lng];

  // Start travel — begin demo simulation
  const handleStartTravel = () => {
    updateBookingStatus(booking.id, 'on_the_way');
    addToast('Travel started! The customer can now track your location.', 'success');

    // In dev mode, simulate movement
    if (import.meta.env.DEV) {
      const vendorStart = { lat: myProfile.lat, lng: myProfile.lng };
      const dest = { lat: serviceLocation[0], lng: serviceLocation[1] };
      const stopSim = simulateVendorMovement(vendorStart, dest, (point) => {
        updateBookingVendorLocation(
          booking.id,
          point.lat,
          point.lng,
          point.heading,
          point.speed,
          point.accuracy
        );
      }, { intervalMs: 3000, steps: 25 });
      stopSimRef.current = stopSim;
    }
  };

  const handleArrived = () => {
    if (stopSimRef.current) {
      stopSimRef.current();
      stopSimRef.current = null;
    }
    updateBookingStatus(booking.id, 'arrived');
    // Set vendor location to service location
    updateBookingVendorLocation(booking.id, serviceLocation[0], serviceLocation[1]);
    addToast('You have arrived! The customer has been notified.', 'success');
  };

  const handleStartService = () => {
    updateBookingStatus(booking.id, 'in_progress');
    addToast('Service started!', 'success');
  };

  const handleCompleteService = () => {
    if (stopSimRef.current) {
      stopSimRef.current();
      stopSimRef.current = null;
    }
    updateBookingStatus(booking.id, 'completed');
    addToast('Service completed! Great job.', 'success');
  };

  // Open Google Maps navigation
  const handleOpenNavigation = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${serviceLocation[0]},${serviceLocation[1]}`;
    window.open(url, '_blank');
  };

  const handleRouteInfo = useCallback(
    (info: { distanceKm: number; durationMin: number }) => {
      setRouteInfo(info);
    },
    []
  );

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      if (stopSimRef.current) {
        stopSimRef.current();
      }
    };
  }, []);


  // Status action buttons
  const renderActionButton = () => {
    switch (booking.status) {
      case 'accepted':
        return (
          <button onClick={handleStartTravel} className="btn-primary w-full btn-lg">
            <Play size={16} className="mr-2" /> Start Travel
          </button>
        );
      case 'on_the_way':
        return (
          <button onClick={handleArrived} className="btn-success w-full btn-lg">
            <Flag size={16} className="mr-2" /> I've Arrived
          </button>
        );
      case 'arrived':
        return (
          <button onClick={handleStartService} className="btn-primary w-full btn-lg">
            <Wrench size={16} className="mr-2" /> Start Service
          </button>
        );
      case 'in_progress':
        return (
          <button onClick={handleCompleteService} className="btn-success w-full btn-lg">
            <CircleCheckBig size={16} className="mr-2" /> Complete Service
          </button>
        );
      case 'completed':
        return (
          <div className="bg-emerald-50 p-4 rounded-2xl text-center">
            <CheckCircle size={28} className="text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-brand-dark text-sm">Service Completed</h3>
            <p className="text-xs text-gray-500 mt-1">Great work!</p>
          </div>
        );
      default:
        return null;
    }
  };

  const statusLabel: Record<string, string> = {
    accepted: 'Accepted — Ready to travel',
    on_the_way: 'On The Way',
    arrived: 'Arrived at Location',
    in_progress: 'Service In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col">
      {/* Header — desktop */}
      <div className="hidden md:block bg-white border-b border-brand-border px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/vendor/dashboard')} className="btn-ghost text-gray-500 text-sm px-3 py-2">
            <ArrowLeft size={16} className="mr-1.5" /> Back to Dashboard
          </button>
          <div className="text-sm font-semibold text-brand-dark">
            Job #{booking.id.slice(0, 6).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* Map */}
        <div className="flex-1 relative h-[50vh] md:h-auto">
          <button
            onClick={() => navigate('/vendor/dashboard')}
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

        {/* Side Panel / Bottom Sheet */}
        <div
          className={`
            md:w-[380px] md:relative md:h-auto
            fixed bottom-0 left-0 right-0 z-[1001]
            md:z-auto md:bottom-auto md:left-auto md:right-auto
            bg-white md:border-l border-t md:border-t-0 border-brand-border
            md:overflow-y-auto
            transition-transform duration-300 ease-smooth
            ${bottomSheetExpanded ? 'max-h-[55vh] md:max-h-none' : 'max-h-[140px]'}
            rounded-t-3xl md:rounded-none shadow-glass md:shadow-none
          `}
        >
          {/* Drag handle */}
          <div
            className="md:hidden flex justify-center py-2 cursor-pointer"
            onClick={() => setBottomSheetExpanded(!bottomSheetExpanded)}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(55vh - 20px)' }}>
            {/* Status */}
            <div className="mb-5">
              <div className="text-xs text-gray-500 font-medium mb-1">Status</div>
              <div className="text-lg font-bold text-brand-dark">
                {statusLabel[booking.status] || booking.status}
              </div>
            </div>

            {/* Route info */}
            {booking.status === 'on_the_way' && routeInfo && (
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="card p-3 text-center">
                  <div className="text-lg font-bold text-brand-dark">{routeInfo.durationMin} min</div>
                  <div className="text-[11px] text-gray-500">to destination</div>
                </div>
                <div className="card p-3 text-center">
                  <div className="text-lg font-bold text-brand-dark">{formatDistance(routeInfo.distanceKm)}</div>
                  <div className="text-[11px] text-gray-500">remaining</div>
                </div>
              </div>
            )}

            {/* Customer location */}
            <div className="mb-5 space-y-2">
              <div className="flex items-start gap-2.5 text-gray-600">
                <MapPin size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[11px] text-gray-400 font-medium">Service Location</div>
                  <span className="text-xs">{booking.booking_address || booking.address}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-gray-600">
                <Clock size={14} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs">{booking.date} at {booking.time}</span>
              </div>
            </div>

            {/* Navigation button */}
            {['accepted', 'on_the_way'].includes(booking.status) && (
              <button
                onClick={handleOpenNavigation}
                className="btn-secondary w-full mb-4 justify-center"
              >
                <Navigation size={15} className="mr-2 text-brand-accent" />
                Open Navigation
              </button>
            )}

            {/* Contact buttons */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button className="btn-secondary btn-sm justify-center">
                <Phone size={14} className="mr-1.5 text-gray-400" /> Call
              </button>
              <button className="btn-secondary btn-sm justify-center">
                <MessageSquare size={14} className="mr-1.5 text-gray-400" /> Message
              </button>
            </div>

            {/* Main action button */}
            <div className="pt-3 border-t border-brand-border">
              {renderActionButton()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
