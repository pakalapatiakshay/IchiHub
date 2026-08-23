import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight, User, LogOut } from 'lucide-react';
import { useAuth } from '../../store/authStore';
import Logo from './Logo';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  // Track scroll for glass effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Services', to: '/services' },
    { label: 'About', to: '/about' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const dashboardPath = user ? `/${user.role}/dashboard` : '';

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ease-smooth px-4 md:px-8 ${
          scrolled
            ? 'glass-dark shadow-glass py-3'
            : 'bg-brand-dark py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <Logo isDarkBg={true} height={40} />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 bg-white/[0.06] rounded-pill px-1.5 py-1.5">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-pill text-sm font-medium transition-all duration-200 ${
                  isActive(link.to)
                    ? 'bg-brand-accent text-white shadow-soft'
                    : 'text-gray-300 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Area */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to={dashboardPath}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-pill hover:bg-white/[0.08] transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-brand-accent/25 rounded-full flex items-center justify-center text-brand-accent text-xs font-bold ring-2 ring-brand-accent/20">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white text-sm font-medium">{user.name}</span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="text-gray-400 hover:text-red-400 transition-colors duration-200 p-2 rounded-xl hover:bg-white/[0.06]"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link to="/customer/login" className="text-gray-300 hover:text-white text-sm font-medium px-4 py-2 rounded-pill hover:bg-white/[0.08] transition-all duration-200">
                  Login
                </Link>
                <Link
                  to="/vendor/register"
                  className="btn-primary btn-sm"
                >
                  Join as Provider
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2.5 hover:bg-white/[0.08] rounded-xl transition-colors duration-200 text-white"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay + Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute top-0 right-0 h-full w-[82%] max-w-[360px] bg-brand-dark/95 backdrop-blur-glass-lg text-white flex flex-col animate-slide-in-right border-l border-white/[0.06]">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <Link to="/" className="flex items-center" onClick={() => setMobileOpen(false)}>
                <Logo isDarkBg={true} height={36} />
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 hover:bg-white/[0.08] rounded-xl transition-colors duration-200"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            {/* User Info */}
            {user && (
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-accent/25 rounded-full flex items-center justify-center text-brand-accent font-bold ring-2 ring-brand-accent/20">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{user.name}</div>
                    <div className="text-xs text-gray-400 capitalize">{user.role}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Nav Links */}
            <nav className="flex-1 overflow-y-auto py-3">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-5 py-3.5 mx-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
                    isActive(link.to)
                      ? 'text-brand-accent bg-brand-accent/[0.08]'
                      : 'text-gray-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{link.label}</span>
                  <ChevronRight size={15} className="text-gray-600" />
                </Link>
              ))}

              {user && (
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between px-5 py-3.5 mx-2 rounded-2xl text-sm font-medium text-gray-300 hover:bg-white/[0.04] transition-all duration-200 mt-1 border-t border-white/[0.06] pt-4"
                >
                  <span className="flex items-center gap-2.5">
                    <User size={16} /> Dashboard
                  </span>
                  <ChevronRight size={15} className="text-gray-600" />
                </Link>
              )}
            </nav>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-white/[0.06]">
              {user ? (
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 py-3 text-red-400 border border-red-400/20 rounded-pill font-semibold text-sm hover:bg-red-400/[0.08] transition-all duration-200"
                >
                  <LogOut size={16} /> Logout
                </button>
              ) : (
                <div className="space-y-2.5">
                  <Link
                    to="/customer/login"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center py-3 border border-white/15 rounded-pill font-semibold text-sm hover:bg-white/[0.06] transition-all duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/vendor/register"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary w-full text-center"
                  >
                    Join as Provider
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
