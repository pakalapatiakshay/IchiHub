import { create } from 'zustand';

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

export interface VendorLiveLocation extends GeoPosition {
  heading?: number;
  speed?: number;
  bookingId: string;
}

interface LocationState {
  // Customer location
  customerLocation: GeoPosition | null;
  customerLocationSource: 'browser' | 'manual' | null;
  locationPermission: 'granted' | 'denied' | 'prompt' | null;
  locationLoading: boolean;
  locationError: string | null;

  // Vendor live locations (keyed by bookingId)
  vendorLiveLocations: Record<string, VendorLiveLocation>;

  // Vendor self-tracking
  vendorWatchId: number | null;
  vendorTrackingBookingId: string | null;

  // Demo mode
  demoMode: boolean;

  // Actions
  requestBrowserLocation: () => Promise<GeoPosition | null>;
  setManualLocation: (lat: number, lng: number) => void;
  clearCustomerLocation: () => void;

  // Vendor tracking actions
  updateVendorLiveLocation: (location: VendorLiveLocation) => void;
  removeVendorLiveLocation: (bookingId: string) => void;

  // Vendor self-tracking (for vendor's own device)
  startVendorSelfTracking: (bookingId: string, onUpdate: (pos: GeoPosition) => void) => void;
  stopVendorSelfTracking: () => void;

  // Demo
  setDemoMode: (enabled: boolean) => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  customerLocation: null,
  customerLocationSource: null,
  locationPermission: null,
  locationLoading: false,
  locationError: null,
  vendorLiveLocations: {},
  vendorWatchId: null,
  vendorTrackingBookingId: null,
  demoMode: import.meta.env.DEV, // Auto-enable in dev

  requestBrowserLocation: async () => {
    if (!navigator.geolocation) {
      set({ locationError: 'Geolocation is not supported by your browser', locationPermission: 'denied' });
      return null;
    }

    set({ locationLoading: true, locationError: null });

    return new Promise<GeoPosition | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: GeoPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          set({
            customerLocation: pos,
            customerLocationSource: 'browser',
            locationPermission: 'granted',
            locationLoading: false,
            locationError: null,
          });
          resolve(pos);
        },
        (error) => {
          let errorMsg = 'Unable to retrieve your location';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'Location permission denied. Please allow location access or enter your address manually.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg = 'Location unavailable. Please try again or enter your address manually.';
          } else if (error.code === error.TIMEOUT) {
            errorMsg = 'Location request timed out. Please try again.';
          }
          set({
            locationPermission: error.code === error.PERMISSION_DENIED ? 'denied' : 'prompt',
            locationLoading: false,
            locationError: errorMsg,
          });
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  },

  setManualLocation: (lat, lng) => {
    set({
      customerLocation: { lat, lng, timestamp: Date.now() },
      customerLocationSource: 'manual',
      locationError: null,
      locationLoading: false,
    });
  },

  clearCustomerLocation: () => {
    set({
      customerLocation: null,
      customerLocationSource: null,
      locationError: null,
    });
  },

  updateVendorLiveLocation: (location) => {
    set((state) => ({
      vendorLiveLocations: {
        ...state.vendorLiveLocations,
        [location.bookingId]: location,
      },
    }));
  },

  removeVendorLiveLocation: (bookingId) => {
    set((state) => {
      const { [bookingId]: _, ...rest } = state.vendorLiveLocations;
      return { vendorLiveLocations: rest };
    });
  },

  startVendorSelfTracking: (bookingId, onUpdate) => {
    // Stop any existing tracking
    const currentWatchId = get().vendorWatchId;
    if (currentWatchId !== null) {
      navigator.geolocation.clearWatch(currentWatchId);
    }

    if (!navigator.geolocation) {
      return;
    }

    let lastUpdateTime = 0;
    const THROTTLE_MS = 5000; // 5 seconds

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastUpdateTime < THROTTLE_MS) return;
        lastUpdateTime = now;

        const pos: GeoPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        onUpdate(pos);
      },
      (error) => {
        console.warn('Vendor tracking error:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 3000,
      }
    );

    set({ vendorWatchId: watchId, vendorTrackingBookingId: bookingId });
  },

  stopVendorSelfTracking: () => {
    const watchId = get().vendorWatchId;
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
    set({ vendorWatchId: null, vendorTrackingBookingId: null });
  },

  setDemoMode: (enabled) => set({ demoMode: enabled }),
}));
