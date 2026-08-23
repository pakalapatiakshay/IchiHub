import { Star, MapPin, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { type VendorProfile } from '../../store/dataStore';

interface ProviderCardProps {
  provider: VendorProfile;
  distanceKm: number;
}

export default function ProviderCard({ provider, distanceKm }: ProviderCardProps) {
  return (
    <div className="card-hover overflow-hidden flex flex-col group h-full">
      {/* Top Image Section with Overlays */}
      <div className="h-48 w-full bg-gray-100 relative overflow-hidden flex-shrink-0 rounded-t-3xl">
        <img
          src={provider.image}
          alt={provider.business_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-smooth"
        />

        {/* Availability Badge Overlay (Top Left) */}
        <div className="absolute top-3 left-3 z-10">
          {provider.availability ? (
            <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-xs text-semantic-success px-2.5 py-1 rounded-pill text-[10px] font-bold shadow-soft">
              <span className="status-online w-2 h-2 rounded-full animate-pulse-soft"></span>
              Available Now
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-xs text-semantic-error px-2.5 py-1 rounded-pill text-[10px] font-bold shadow-soft">
              <span className="status-offline w-2 h-2 rounded-full"></span>
              Unavailable
            </span>
          )}
        </div>

        {/* Verified Badge Overlay (Top Right) */}
        {provider.verification_status === 'verified' && (
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-brand-dark px-2.5 py-1 rounded-pill text-[10px] font-bold flex items-center shadow-soft z-10">
            <CheckCircle size={12} className="text-brand-accent mr-1" />
            Verified
          </div>
        )}

        {/* Category Overlay (Bottom Left) */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="badge bg-brand-accent/90 backdrop-blur-xs text-white text-[10px] uppercase tracking-wider px-2.5 py-1 shadow-soft">
            {provider.category}
          </span>
        </div>
      </div>

      {/* Down Image: Details & Rating Content Section */}
      <div className="p-5 flex-1 flex flex-col justify-between bg-white">
        <div>
          {/* Business Name */}
          <h3 className="text-base font-bold text-brand-dark leading-tight mb-2 group-hover:text-brand-accent transition-colors duration-200">
            {provider.business_name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded-pill">
              <Star size={12} fill="#F59E0B" className="text-amber-500" />
              <span className="text-[11px] font-bold text-amber-700">
                {provider.rating > 0 ? provider.rating.toFixed(1) : 'New'}
              </span>
            </div>
            {provider.review_count > 0 && (
              <span className="text-[11px] text-gray-500">
                ({provider.review_count} reviews)
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">
            {provider.description}
          </p>
        </div>

        <div>
          {/* Distance & Price Meta */}
          <div className="flex justify-between items-center text-xs text-gray-500 mb-4 pt-3 border-t border-brand-border/60">
            <div className="flex items-center gap-1">
              <MapPin size={13} className="text-brand-accent" />
              <span>{distanceKm.toFixed(1)} km away</span>
            </div>
            <div>
              <span className="text-gray-400">Starts at </span>
              <span className="font-bold text-brand-dark">₹{provider.starting_price}</span>
            </div>
          </div>

          {/* Footer Action Buttons with Booking on Left Bottom */}
          <div className="flex items-center justify-between pt-3 border-t border-brand-border">
            <Link to={`/book/${provider.id}`} className="btn-primary btn-sm px-4">
              Book Now
            </Link>
            <Link to={`/provider/${provider.id}`} className="btn-secondary btn-sm px-4">
              View Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
