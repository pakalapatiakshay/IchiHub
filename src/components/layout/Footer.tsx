import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-gray-400 pt-20 pb-8 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-block mb-5">
              <Logo isDarkBg={true} height={40} showTagline={true} />
            </Link>
            <p className="text-sm leading-relaxed max-w-xs text-gray-500">
              Local Services. Right Around the Corner. Find trusted professionals near you for all your home and vehicle needs.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-xs tracking-[0.15em] uppercase">Services</h4>
            <ul className="space-y-3">
              {['Electricians', 'Plumbers', 'Car Mechanics', 'Cleaning'].map((service) => (
                <li key={service}>
                  <Link to="/services" className="text-sm text-gray-500 hover:text-brand-accent transition-colors duration-200">
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Providers */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-xs tracking-[0.15em] uppercase">For Providers</h4>
            <ul className="space-y-3">
              <li><Link to="/vendor/register" className="text-sm text-gray-500 hover:text-brand-accent transition-colors duration-200">Join IchiHub</Link></li>
              <li><Link to="/vendor/login" className="text-sm text-gray-500 hover:text-brand-accent transition-colors duration-200">Provider Login</Link></li>
              <li><Link to="/about" className="text-sm text-gray-500 hover:text-brand-accent transition-colors duration-200">Benefits</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-xs tracking-[0.15em] uppercase">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-sm text-gray-500 hover:text-brand-accent transition-colors duration-200">About Us</Link></li>
              <li><Link to="/about" className="text-sm text-gray-500 hover:text-brand-accent transition-colors duration-200">Contact</Link></li>
              <li><Link to="/about" className="text-sm text-gray-500 hover:text-brand-accent transition-colors duration-200">Privacy Policy</Link></li>
              <li><Link to="/about" className="text-sm text-gray-500 hover:text-brand-accent transition-colors duration-200">Terms of Service</Link></li>
              <li><Link to="/admin/login" className="text-sm text-gray-500 hover:text-brand-accent transition-colors duration-200">Admin Login</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} IchiHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
