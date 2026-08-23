import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Users, Zap, ArrowRight, Heart, Target, Globe } from 'lucide-react';

export default function About() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero */}
      <section className="bg-brand-dark text-white py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6 md:px-12 text-center">
          <span className="section-label text-center">About Us</span>
          <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-5">
            Connecting Communities<br />
            <span className="text-gray-400">One Service at a Time</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            IchiHub is a hyper-local services marketplace that helps you find trusted, verified professionals in your neighborhood.
          </p>
        </div>
      </section>

      {/* Mission + Values */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
            {[
              { icon: Target, title: 'Our Mission', desc: 'To empower local service professionals with technology and connect them to customers who need them — right around the corner.' },
              { icon: Heart, title: 'Our Values', desc: 'Trust, transparency, and community. Every provider on IchiHub is vetted, rated by real locals, and committed to quality service.' },
              { icon: Globe, title: 'Our Vision', desc: 'A world where finding a reliable local professional is as simple as a single tap — in every city, town, and neighborhood.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="bg-brand-accentLight w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 text-brand-accent">
                  <item.icon size={28} />
                </div>
                <h3 className="text-xl font-display font-bold text-brand-dark mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-24 bg-brand-light">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="text-center mb-14">
            <span className="section-label">Simple & Fast</span>
            <h2 className="section-title">How IchiHub Works</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
            {[
              { step: '01', title: 'Share Your Location', desc: 'Allow location access or enter your address to find nearby providers.', icon: MapPin },
              { step: '02', title: 'Browse & Compare', desc: 'View verified providers, ratings, prices, and availability in your area.', icon: Users },
              { step: '03', title: 'Book Instantly', desc: 'Select a time slot, describe your needs, and confirm the booking.', icon: Zap },
              { step: '04', title: 'Get Quality Service', desc: 'The provider arrives at your doorstep. Rate and review after completion.', icon: ShieldCheck },
            ].map((item, i) => (
              <div
                key={i}
                className="card-hover relative p-7 group"
              >
                <div className="text-brand-accent/10 font-display font-extrabold text-4xl absolute top-5 right-5">{item.step}</div>
                <div className="bg-brand-accentLight w-11 h-11 rounded-xl flex items-center justify-center mb-4 text-brand-accent">
                  <item.icon size={20} />
                </div>
                <h3 className="text-base font-bold text-brand-dark mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 md:py-20 bg-brand-dark text-white">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center stagger-children">
            {[
              { value: '500+', label: 'Service Providers' },
              { value: '10K+', label: 'Happy Customers' },
              { value: '25+', label: 'Service Categories' },
              { value: '4.8★', label: 'Average Rating' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-display font-bold text-brand-accent mb-1.5">{stat.value}</div>
                <div className="text-gray-500 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-brand-dark mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-gray-500 mb-10">Join thousands of customers finding trusted local professionals through IchiHub.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/providers" className="btn-primary btn-lg">
              Find a Provider <ArrowRight size={18} className="ml-1.5" />
            </Link>
            <Link to="/vendor/register" className="btn-secondary btn-lg">
              Join as Provider
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
