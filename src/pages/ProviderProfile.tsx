import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDataStore, calculateDistance, formatDistance } from '../store/dataStore';
import { useLocationStore } from '../store/locationStore';
import { MapPin, Star, ShieldCheck, Clock, Phone, MessageSquare, ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';

const DEFAULT_LAT = 12.9716;
const DEFAULT_LNG = 77.5946;

export default function ProviderProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vendors } = useDataStore();
  const { customerLocation } = useLocationStore();

  const customerLat = customerLocation?.lat || DEFAULT_LAT;
  const customerLng = customerLocation?.lng || DEFAULT_LNG;

  const provider = useMemo(() => vendors.find(v => v.id === id), [vendors, id]);

  if (!provider) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-brand-light">
        <h2 className="text-2xl font-bold mb-4 text-brand-dark">Provider not found</h2>
        <button onClick={() => navigate('/providers')} className="btn-primary btn-sm">
          Go back to providers
        </button>
      </div>
    );
  }

  const distance = calculateDistance(customerLat, customerLng, provider.lat, provider.lng);

  return (
    <div className="bg-brand-light min-h-screen py-8 md:py-10">
      <div className="max-w-5xl mx-auto px-4 md:px-12">
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost text-gray-500 px-3 py-2 mb-5 text-sm"
        >
          <ArrowLeft size={16} className="mr-1.5" /> Back
        </button>

        <div className="card overflow-hidden">
          {/* Header Banner */}
          <div className="h-56 md:h-72 relative bg-gray-900 overflow-hidden">
            <img
              src={provider.image}
              alt={provider.business_name}
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-5 left-5 md:bottom-7 md:left-8 text-white z-10">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="badge-accent text-[11px] uppercase tracking-wider">
                  {provider.category}
                </span>
                {provider.verification_status === 'verified' && (
                  <span className="badge-glass text-[11px]">
                    <ShieldCheck size={12} className="mr-1" /> Verified
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight">{provider.business_name}</h1>
            </div>
          </div>

          <div className="p-6 md:p-10">
            <div className="flex flex-col md:flex-row gap-8 md:gap-12">
              {/* Left Column: Details */}
              <div className="md:w-2/3 space-y-8">
                <section>
                  <h3 className="text-lg font-bold text-brand-dark mb-4 pb-2 border-b border-brand-border">About the Provider</h3>
                  <p className="text-gray-600 leading-relaxed">{provider.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
                    <div className="card p-4 flex items-start gap-3">
                      <div className="bg-amber-50 p-2.5 rounded-xl text-amber-500 shrink-0">
                        <Star size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-brand-dark text-sm">{provider.rating > 0 ? `${provider.rating} Rating` : 'New Provider'}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{provider.review_count} Reviews</div>
                      </div>
                    </div>
                    <div className="card p-4 flex items-start gap-3">
                      <div className="bg-brand-accentLight p-2.5 rounded-xl text-brand-accent shrink-0">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-brand-dark text-sm">{formatDistance(distance)} away</div>
                        <div className="text-xs text-gray-500 mt-0.5">{provider.address}, {provider.city}</div>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-brand-dark mb-4 pb-2 border-b border-brand-border">Services Offered</h3>
                  <div className="card p-5 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-brand-dark text-sm">Standard {provider.category} Service</h4>
                      <p className="text-xs text-gray-500 mt-1">Inspection and basic fixes.</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-brand-accent text-lg">₹{provider.starting_price}</div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column: CTA & Availability */}
              <div className="md:w-1/3">
                <div className="card p-6 sticky top-24 bg-gray-50/80">
                  <div className="mb-5 pb-5 border-b border-brand-border">
                    <div className="text-xs text-gray-500 font-medium mb-1">Starting from</div>
                    <div className="text-3xl font-bold text-brand-dark">₹{provider.starting_price}</div>
                  </div>

                  <div className="flex items-center mb-6 text-sm">
                    <Clock className="mr-2.5 text-gray-400" size={18} />
                    <div className="font-medium">
                      {provider.availability ? (
                        <span className="text-semantic-success flex items-center gap-1.5">
                          <span className="status-online"></span>
                          Available Today
                        </span>
                      ) : (
                        <span className="text-semantic-error flex items-center gap-1.5">
                          <span className="status-offline"></span>
                          Currently Unavailable
                        </span>
                      )}
                    </div>
                  </div>

                  <Link to={`/book/${provider.id}`} className="btn-primary w-full text-center mb-3">
                    Book Service
                  </Link>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button className="btn-secondary btn-sm justify-center">
                      <Phone size={15} className="mr-1.5 text-gray-400" /> Call
                    </button>
                    <button className="btn-secondary btn-sm justify-center">
                      <MessageSquare size={15} className="mr-1.5 text-gray-400" /> Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
