import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, Role } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import Logo from '../../components/layout/Logo';

interface AuthPageProps {
  role: Role;
  type: 'login' | 'register';
}

export default function AuthPage({ role, type }: AuthPageProps) {
  const navigate = useNavigate();
  const { authenticate } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authenticate({ ...formData, role, mode: type });
      void useDataStore.getState().loadMarketplace();
      void useDataStore.getState().loadBookings();
      useDataStore.getState().startRealtime();

      if (role === 'customer') navigate('/customer/dashboard');
      else if (role === 'vendor') navigate('/vendor/dashboard');
      else navigate('/admin/dashboard');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const title = type === 'login' ? `Login as ${role}` : `Register as ${role}`;
  const oppType = type === 'login' ? 'register' : 'login';
  const oppText = type === 'login' ? "Don't have an account?" : "Already have an account?";

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center mb-8">
          <Logo isDarkBg={false} height={40} />
        </Link>
        <h2 className="text-2xl font-display font-bold text-brand-dark capitalize">
          {title}
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          {type === 'login' ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {type === 'register' && (
              <div>
                <label className="input-label">Full Name / Business Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="input-field"
                  placeholder="Enter your name"
                />
              </div>
            )}

            <div>
              <label className="input-label">Email address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="input-label">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-red-500" role="alert">{error}</p>}

            <div className="pt-1">
              <button type="submit" disabled={submitting} className="btn-primary w-full btn-lg disabled:opacity-60">
                {submitting ? 'Please wait…' : type === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </form>

          {role !== 'admin' && (
            <div className="mt-7">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-brand-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-brand-card text-gray-400 font-medium">{oppText}</span>
                </div>
              </div>
              <div className="mt-5 text-center">
                <Link
                  to={`/${role}/${oppType}`}
                  className="text-sm font-semibold text-brand-accent hover:text-brand-accentHover transition-colors duration-200"
                >
                  {type === 'login' ? 'Register here' : 'Login here'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
