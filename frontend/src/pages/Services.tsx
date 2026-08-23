import { useState, useMemo, useCallback } from 'react';
import { useDataStore, calculateDistance } from '../store/dataStore';
import { useLocationStore } from '../store/locationStore';
import ProviderCard from '../components/provider/ProviderCard';
import IchiMapContainer from '../components/map/MapContainer';
import UserMarker from '../components/map/UserMarker';
import VendorMarker from '../components/map/VendorMarker';
import MapControls from '../components/map/MapControls';
import { MapPin, SlidersHorizontal, Navigation, Loader2, AlertCircle, Map as MapIcon, List, Star } from 'lucide-react';

// Bangalore center for demo purposes
const DEFAULT_LAT = 12.9716;
const DEFAULT_LNG = 77.5946;

export default function Services() {
  const { vendors } = useDataStore();
  const { customerLocation, requestBrowserLocation, setManualLocation, locationLoading, locationError } = useLocationStore();
  const [radius, setRadius] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [minRating, setMinRating] = useState<number>(0);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  const customerLat = customerLocation?.lat || DEFAULT_LAT;
  const customerLng = customerLocation?.lng || DEFAULT_LNG;

  const categories = ['All', ...Array.from(new Set(vendors.map(v => v.category)))];

  const nearbyProviders = useMemo(() => {
    return vendors
      .map(v => ({ ...v, distance: calculateDistance(customerLat, customerLng, v.lat, v.lng) }))
      .filter(v => v.distance <= radius)
      .filter(v => selectedCategory === 'All' || v.category === selectedCategory)
      .filter(v => v.rating >= minRating)
      .sort((a, b) => a.distance - b.distance);
  }, [vendors, radius, selectedCategory, customerLat, customerLng, minRating]);

  const handleUseCurrentLocation = useCallback(async () => {
    await requestBrowserLocation();
  }, [requestBrowserLocation]);

  const handleUseDemoLocation = useCallback(() => {
    setManualLocation(DEFAULT_LAT, DEFAULT_LNG);
  }, [setManualLocation]);

  return (
    <div className="bg-brand-light min-h-screen">
      {/* Location bar */}
      <div className="bg-white border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 md:px-12 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={15} className="text-brand-accent" />
              <span className="text-gray-600 font-medium">
                {customerLocation ? (
                  <>Near <strong className="text-brand-dark">{customerLocation.lat.toFixed(4)}, {customerLocation.lng.toFixed(4)}</strong></>
                ) : (
                  <>Using <strong className="text-brand-dark">Default Location (Bangalore)</strong></>
                )}
              </span>
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={handleUseCurrentLocation}
                disabled={locationLoading}
                className="btn-sm px-3 py-1.5 rounded-xl text-xs font-semibold text-brand-accent bg-brand-accentLight hover:bg-brand-accent hover:text-white transition-all flex items-center gap-1.5"
              >
                {locationLoading ? (
                  <><Loader2 size={12} className="animate-spin" /> Getting...</>
                ) : (
                  <><Navigation size={12} /> Use My Location</>
                )}
              </button>
              {!customerLocation && (
                <button
                  onClick={handleUseDemoLocation}
                  className="btn-sm px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  Use Demo Location
                </button>
              )}
            </div>
          </div>
          {locationError && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-semantic-error">
              <AlertCircle size={12} />
              {locationError}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-12 py-6 md:py-8">
        {/* Mobile view toggle */}
        <div className="lg:hidden flex gap-2 mb-4">
          <button
            onClick={() => setMobileView('list')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${mobileView === 'list'
                ? 'bg-brand-accent text-white shadow-soft'
                : 'bg-white text-gray-600 border border-brand-border'
              }`}
          >
            <List size={14} /> List View
          </button>
          <button
            onClick={() => setMobileView('map')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${mobileView === 'map'
                ? 'bg-brand-accent text-white shadow-soft'
                : 'bg-white text-gray-600 border border-brand-border'
              }`}
          >
            <MapIcon size={14} /> Map View
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          {/* Filters Sidebar */}
          <div className="w-full lg:w-[280px] flex-shrink-0">
            <div className="card p-5 sticky top-24">
              <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-brand-border text-brand-dark">
                <div className="bg-brand-accentLight p-2 rounded-xl text-brand-accent">
                  <SlidersHorizontal size={16} />
                </div>
                <h2 className="font-bold text-sm">Filters</h2>
              </div>

              {/* Radius Filter */}
              <div className="mb-8">
                <label className="flex justify-between items-center text-sm font-semibold text-gray-700 mb-4">
                  <span>Search Radius</span>
                  <span className="badge-accent">{radius} KM</span>
                </label>
                <input
                  type="range"
                  min="1" max="15" step="1"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-gray-400 mt-2 font-medium">
                  <span>1 KM</span>
                  <span>15 KM</span>
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-8 border-t border-brand-border pt-6">
                <svg className="w-0 h-0 absolute" aria-hidden="true" focusable="false">
                  <defs>
                    <linearGradient id="halfStarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="50%" stopColor="#F59E0B" />
                      <stop offset="50%" stopColor="#D1D5DB" />
                    </linearGradient>
                    <linearGradient id="halfStarGradActive" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="50%" stopColor="#F59E0B" />
                      <stop offset="50%" stopColor="rgba(255, 255, 255, 0.3)" />
                    </linearGradient>
                  </defs>
                </svg>
                <label className="block text-sm font-semibold text-gray-700 mb-3.5">Minimum Rating</label>
                <div className="space-y-2">
                  {[0, 4.5, 4.0, 3.5, 3.0].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(rating)}
                      className={`flex items-center justify-between w-full px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${minRating === rating
                          ? 'bg-brand-accent text-white shadow-soft hover:bg-brand-accentHover'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-brand-border'
                        }`}
                    >
                      <div className="flex items-center">
                        {rating === 0 ? (
                          <span className={minRating === rating ? 'text-white' : 'text-gray-700'}>Any Rating</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((starVal) => {
                                const isFilled = starVal <= Math.floor(rating);
                                const isHalf = !isFilled && starVal === Math.ceil(rating) && rating % 1 !== 0;
                                return (
                                  <Star
                                    key={starVal}
                                    size={13}
                                    className={`mr-0.5 ${isFilled || isHalf
                                        ? 'text-amber-500'
                                        : minRating === rating
                                          ? 'text-white/40'
                                          : 'text-gray-300'
                                      }`}
                                    fill={
                                      isFilled
                                        ? '#F59E0B'
                                        : isHalf
                                          ? (minRating === rating ? 'url(#halfStarGradActive)' : 'url(#halfStarGrad)')
                                          : 'none'
                                    }
                                  />
                                );
                              })}
                            </div>
                            <span className={minRating === rating ? 'text-white' : 'text-gray-700'}>
                              {rating.toFixed(1)} & Up
                            </span>
                          </div>
                        )}
                      </div>
                      {minRating === rating && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-scale-in"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter — Pill Chips */}
              <div className="border-t border-brand-border pt-6 mb-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-2 rounded-pill text-xs font-semibold transition-all duration-200 ${selectedCategory === cat
                          ? 'bg-brand-accent text-white shadow-soft'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results + Map */}
          <div className="w-full lg:flex-1 min-w-0">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-brand-dark">Trusted Providers Near You</h1>
              <div className="badge bg-white shadow-soft text-gray-600 font-medium py-2 px-4">
                <MapPin size={14} className="text-brand-accent mr-1.5" />
                Near <strong className="text-brand-dark ml-1">{customerLocation ? 'Your Location' : 'Bangalore'}</strong>
              </div>
            </div>

            {/* Desktop: Stacked; Mobile: Toggled */}
            <div className="flex flex-col gap-6">
              {/* Map */}
              <div className={`w-full ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
                <div className="card overflow-hidden">
                  <div className="h-[320px] md:h-[450px]">
                    <IchiMapContainer
                      center={[customerLat, customerLng]}
                      zoom={radius <= 2 ? 15 : radius <= 5 ? 14 : 13}
                      className="w-full h-full"
                    >
                      <MapControls locatePosition={[customerLat, customerLng]} />

                      {/* Customer marker */}
                      <UserMarker position={[customerLat, customerLng]} />

                      {/* Vendor markers */}
                      {nearbyProviders.map(provider => (
                        <VendorMarker
                          key={provider.id}
                          vendor={provider}
                          distanceKm={provider.distance}
                        />
                      ))}
                    </IchiMapContainer>
                  </div>
                </div>
              </div>

              {/* Provider List */}
              <div className={`w-full ${mobileView === 'map' ? 'hidden lg:block' : 'block'}`}>
                {nearbyProviders.length > 0 ? (
                  <div className="space-y-5">
                    <p className="text-gray-500 text-sm font-medium">
                      Found {nearbyProviders.length} provider{nearbyProviders.length !== 1 && 's'} within {radius} KM
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger-children">
                      {nearbyProviders.map(provider => (
                        <ProviderCard key={provider.id} provider={provider} distanceKm={provider.distance} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="card p-12 md:p-16 text-center flex flex-col items-center">
                    <div className="bg-gray-100 p-5 rounded-3xl mb-5 text-gray-400">
                      <MapPin size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-brand-dark mb-2">No providers found nearby</h3>
                    <p className="text-gray-500 mb-8 max-w-md text-sm leading-relaxed">
                      We couldn't find any trusted professionals in the selected category within your current {radius} KM radius.
                    </p>
                    <div className="flex gap-3">
                      <button onClick={() => setRadius(3)} className="btn-secondary btn-sm">
                        Expand to 3 KM
                      </button>
                      <button onClick={() => setRadius(5)} className="btn-primary btn-sm">
                        Expand to 5 KM
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
