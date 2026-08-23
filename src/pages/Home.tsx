import { MapPin, Search, ArrowRight, ShieldCheck, Zap, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import serviceWorkerImg from '../service_worker.jpg';

export default function Home() {
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/services');
  };

  return (
    <div className="flex flex-col w-full">
      {/* 1. HERO SECTION */}
      <section className="relative bg-brand-dark text-white min-h-[640px] flex items-center overflow-hidden">
        {/* Curved Background Glow Layer (starts top right, ends bottom left) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
          <svg className="absolute top-0 right-0 w-full h-full text-brand-accent/[0.04]" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="heroBgGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FF5A1F" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#E64F19" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#171717" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="solidAccentLine" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FF5A1F" />
                <stop offset="100%" stopColor="#E64F19" />
              </linearGradient>
            </defs>
            <path d="M 100 0 C 70 10, 30 50, 0 100 L 100 100 Z" fill="url(#heroBgGrad)" />
            <path d="M 100 0 C 70 10, 30 50, 0 100" fill="none" stroke="url(#solidAccentLine)" strokeWidth="0.5" opacity="0.25" />
          </svg>
        </div>

        {/* Hero Content Container */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 md:px-12 w-full pt-16 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Text & Search Form */}
            <div className="lg:col-span-7 space-y-8 max-w-2xl">
              {/* Tag */}
              <div className="badge-glass text-xs tracking-[0.12em] uppercase animate-fade-up">
                <span className="status-online mr-2"></span>
                Local Services, Right Near You
              </div>

              {/* Heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.08] tracking-tight animate-fade-up" style={{ animationDelay: '80ms' }}>
                Trusted Local<br />
                Services.{' '}
                <span className="text-gray-400">Just Around<br className="hidden md:block" /> the Corner.</span>
              </h1>

              <p className="text-base md:text-lg text-gray-400 leading-relaxed animate-fade-up" style={{ animationDelay: '160ms' }}>
                Find reliable electricians, plumbers, mechanics, cleaners, and other service professionals near you.
              </p>

              {/* Search Bar — Glass Pill */}
              <form
                onSubmit={handleSearch}
                className="glass rounded-3xl p-2 shadow-float animate-fade-up flex flex-col sm:flex-row gap-2"
                style={{ animationDelay: '240ms' }}
              >
                <div className="flex-1 flex items-center px-4 py-1 bg-white/60 rounded-2xl">
                  <MapPin className="text-brand-accent mr-2.5 shrink-0" size={18} />
                  <input
                    type="text"
                    placeholder="Your Location"
                    defaultValue="Current Location"
                    className="w-full bg-transparent py-2.5 text-brand-dark outline-none font-medium text-sm placeholder:text-gray-400"
                  />
                </div>
                <div className="flex-1 flex items-center px-4 py-1 bg-white/60 rounded-2xl">
                  <Search className="text-brand-accent mr-2.5 shrink-0" size={18} />
                  <input
                    type="text"
                    placeholder="What service do you need?"
                    className="w-full bg-transparent py-2.5 text-brand-dark outline-none font-medium text-sm placeholder:text-gray-400"
                  />
                </div>
                <button type="submit" className="btn-primary whitespace-nowrap px-6">
                  Find Nearby
                </button>
              </form>

              <div className="text-xs text-gray-500 flex items-center gap-2 animate-fade-up" style={{ animationDelay: '320ms' }}>
                <MapPin size={12} className="text-brand-accent" />
                <span>Searching within 1 KM radius by default</span>
              </div>
            </div>

            {/* Right Column: Premium Curved Image Showcase */}
            <div className="hidden lg:flex lg:col-span-5 relative h-[520px] items-end justify-center animate-scale-in" style={{ animationDelay: '120ms' }}>
              {/* Curve design backdrop shape */}
              <div className="absolute inset-0 overflow-hidden rounded-4xl bg-gradient-to-tr from-brand-accent/[0.04] to-brand-accent/[0.12] backdrop-blur-xs border border-white/[0.08] shadow-inner-soft">
                {/* SVG Curve divider inside container */}
                <svg className="absolute bottom-0 right-0 w-full h-full text-brand-accent/[0.08]" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M 100 0 C 80 20, 20 80, 0 100 L 100 100 Z" fill="currentColor" />
                </svg>
              </div>

              {/* Floating Service Indicator 1 */}
              <div className="absolute top-12 left-6 bg-white/95 backdrop-blur-sm p-3.5 rounded-2xl shadow-float flex items-center gap-3 animate-pulse-soft border border-brand-border z-20">
                <div className="bg-brand-accentLight p-2 rounded-xl text-brand-accent">
                  <Star size={16} fill="#FF5A1F" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Top Rated</div>
                  <div className="text-xs font-bold text-brand-dark">4.9/5 Average Rating</div>
                </div>
              </div>

              {/* Floating Service Indicator 2 */}
              <div className="absolute bottom-24 -right-2 bg-white/95 backdrop-blur-sm p-3.5 rounded-2xl shadow-float flex items-center gap-3 animate-pulse-soft border border-brand-border z-20" style={{ animationDelay: '1s' }}>
                <div className="bg-semantic-successLight p-2 rounded-xl text-semantic-success">
                  <MapPin size={16} />
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Availability</div>
                  <div className="text-xs font-bold text-brand-dark">Direct Local Dispatch</div>
                </div>
              </div>

              {/* Service Worker Image Asset */}
              <img
                src={serviceWorkerImg}
                alt="Trusted Service Professional"
                className="relative z-10 max-h-[92%] w-auto object-contain filter drop-shadow-float hover:scale-[1.015] transition-transform duration-500 ease-smooth"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST INDICATORS */}
      <section className="bg-white border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 stagger-children">
            {[
              { icon: ShieldCheck, title: 'Verified Providers', desc: 'Background checked' },
              { icon: MapPin, title: 'Local Professionals', desc: 'In your neighborhood' },
              { icon: Zap, title: 'Transparent Pricing', desc: 'No hidden fees' },
              { icon: Star, title: 'Customer Reviews', desc: 'Real ratings from locals' },
            ].map((feature, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 md:gap-4">
                <div className="bg-brand-accentLight p-3 rounded-2xl text-brand-accent shrink-0">
                  <feature.icon size={24} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="font-bold text-brand-dark text-sm">{feature.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 md:py-24 bg-brand-light relative overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-accent/[0.03] to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="section-label justify-center">Simple Process</span>
            <h2 className="section-title">How IchiHub Works</h2>
            <p className="section-desc text-center">Get your tasks done in three simple steps. We've made finding and booking local professionals effortless.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            {/* Connection Line (Desktop only) */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-brand-border/60 z-0">
              <div className="absolute inset-0 bg-brand-accent/30 origin-left animate-pulse-soft"></div>
            </div>

            {[
              { 
                step: '01',
                title: 'Search & Compare',
                desc: 'Enter your location and the service you need. Compare top-rated local professionals instantly.',
                icon: Search
              },
              {
                step: '02',
                title: 'Book Instantly',
                desc: 'Choose a provider that fits your schedule and budget. Book them with a single click.',
                icon: Zap
              },
              {
                step: '03',
                title: 'Track & Pay',
                desc: 'Track their arrival in real-time. Pay securely only after the job is completed to your satisfaction.',
                icon: MapPin
              }
            ].map((item, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-white shadow-float flex items-center justify-center mb-6 relative group-hover:-translate-y-2 transition-transform duration-300 ease-smooth border border-brand-border/50">
                  <div className="absolute -inset-1 bg-gradient-to-br from-brand-accent/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                  <item.icon size={32} className="text-brand-accent relative z-10" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-brand-dark text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-brand-dark mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SERVICE CATEGORIES */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-12">
            <span className="section-label">What do you need?</span>
            <h2 className="section-title">Services For Every Need</h2>
            <p className="section-desc">From quick repairs to complete home and vehicle services, find professionals near you.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
            {[
              { name: 'Electrician', img: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=2069&auto=format&fit=crop' },
              { name: 'Plumber', img: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=2070&auto=format&fit=crop' },
              { name: 'Car Mechanic', img: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1974&auto=format&fit=crop' },
              { name: 'Cleaning', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2070&auto=format&fit=crop' },
            ].map((cat, i) => (
              <Link
                to="/services"
                key={i}
                className="card-interactive group flex flex-col overflow-hidden"
              >
                <div className="h-48 overflow-hidden relative rounded-t-3xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <img
                    src={cat.img}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-smooth"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="badge-accent mb-3 self-start text-[11px]">
                    <Zap size={12} className="mr-1" />
                    Available
                  </div>
                  <h3 className="text-lg font-bold text-brand-dark mb-1.5">{cat.name}</h3>
                  <p className="text-gray-500 text-sm mb-5 flex-1 leading-relaxed">Expert {cat.name.toLowerCase()}s available in your area.</p>
                  <div className="text-brand-accent font-semibold inline-flex items-center text-sm group-hover:gap-2 gap-1 transition-all duration-200">
                    Find Providers <ArrowRight size={15} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. EMERGENCY CTA */}
      <section className="bg-brand-dark text-white py-20 md:py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-5 leading-tight">Need Help Right Now?</h2>
          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">Find available service providers near you and get connected quickly for urgent repairs.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/services" className="btn-primary btn-lg">
              Find Help Near Me
            </Link>
            <Link to="/vendor/register" className="btn-ghost-white btn-lg">
              Become a Provider
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
