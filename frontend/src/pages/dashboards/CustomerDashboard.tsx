import { useAuth } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import { LogOut, Calendar, MapPin, Navigation } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const { bookings } = useDataStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const myBookings = bookings.filter(b => b.customer_id === user?.id);

  const statusColor: Record<string, string> = {
    pending: 'badge-warning',
    accepted: 'badge-info',
    on_the_way: 'badge-accent',
    arrived: 'badge-success',
    in_progress: 'badge-accent',
    completed: 'badge-success',
    cancelled: 'badge-error',
  };

  const statusLabel: Record<string, string> = {
    pending: 'pending',
    accepted: 'accepted',
    on_the_way: 'on the way',
    arrived: 'arrived',
    in_progress: 'in progress',
    completed: 'completed',
    cancelled: 'cancelled',
  };

  // Statuses that allow tracking
  const trackableStatuses = ['accepted', 'on_the_way', 'arrived', 'in_progress'];

  return (
    <div className="min-h-screen bg-brand-light py-8 md:py-10">
      <div className="max-w-7xl mx-auto px-4 md:px-12 flex flex-col md:flex-row gap-6 md:gap-8">

        {/* Sidebar */}
        <div className="w-full md:w-[260px] flex-shrink-0">
          <div className="card p-5 sticky top-24">
            <div className="text-center mb-5 pb-5 border-b border-brand-border">
              <div className="w-16 h-16 bg-brand-accentLight rounded-2xl flex items-center justify-center mx-auto mb-3 text-brand-accent text-xl font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <h2 className="font-bold text-brand-dark">{user?.name}</h2>
              <p className="text-gray-500 text-xs mt-0.5">Customer</p>
            </div>

            <nav className="space-y-1 mb-6">
              <a href="#" className="flex items-center gap-2.5 px-4 py-2.5 bg-brand-accentLight text-brand-accent font-semibold rounded-2xl text-sm transition-colors">
                <Calendar size={16} /> My Bookings
              </a>
              <a href="#" className="flex items-center gap-2.5 px-4 py-2.5 text-gray-500 hover:bg-gray-100 rounded-2xl text-sm transition-colors">
                <MapPin size={16} /> Saved Providers
              </a>
            </nav>

            <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-2xl text-sm transition-colors font-medium">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full md:flex-1 min-w-0 space-y-5">
          <h1 className="text-2xl font-display font-bold text-brand-dark">My Bookings</h1>

          {myBookings.length > 0 ? (
            <div className="space-y-4 stagger-children">
              {myBookings.map(booking => (
                <div key={booking.id} className="card-hover p-5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={statusColor[booking.status] || 'badge-dark'}>
                        {statusLabel[booking.status] || booking.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400">{booking.date} at {booking.time}</span>
                    </div>
                    <h3 className="font-bold text-brand-dark">{booking.service}</h3>
                    <p className="text-gray-500 text-xs mt-0.5">
                      <MapPin size={11} className="inline mr-1" />
                      {booking.booking_address || booking.address}
                    </p>
                  </div>
                  <div className="flex gap-2 self-start md:self-center">
                    {trackableStatuses.includes(booking.status) && (
                      <Link
                        to={`/customer/bookings/${booking.id}/track`}
                        className="btn-primary btn-sm flex items-center gap-1.5"
                      >
                        <Navigation size={13} /> Track
                      </Link>
                    )}
                    <button className="btn-secondary btn-sm">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-12 md:p-16 text-center flex flex-col items-center">
              <div className="bg-gray-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
                <Calendar size={24} />
              </div>
              <h3 className="text-lg font-bold text-brand-dark mb-2">No bookings yet</h3>
              <p className="text-gray-500 text-sm mb-6">You haven't requested any services yet.</p>
              <button onClick={() => navigate('/services')} className="btn-primary btn-sm">
                Find a Provider
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
