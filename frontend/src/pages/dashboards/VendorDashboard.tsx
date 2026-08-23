import { useAuth } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import { useToastStore } from '../../store/toastStore';
import { LogOut, LayoutDashboard, Briefcase, IndianRupee, Bell, AlertTriangle, Navigation, MapPin } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface VendorPerformance { netEarnings: number; rating: number; completedJobs: number; acceptanceRate: number; completionRate: number; }

export default function VendorDashboard() {
  const { user, logout } = useAuth();
  const { vendors, bookings, updateBookingStatus } = useDataStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const [performance, setPerformance] = useState<VendorPerformance | null>(null);

  useEffect(() => {
    api<{ performance: VendorPerformance }>('/vendors/me/performance').then((response) => setPerformance(response.performance)).catch(() => setPerformance(null));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const myProfile = vendors.find(v => v.user_id === user?.id);
  const myBookings = bookings.filter(b => b.vendor_id === myProfile?.id);
  const pendingBookings = myBookings.filter(b => b.status === 'pending');
  const activeBookings = myBookings.filter(b =>
    ['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(b.status)
  );

  const handleAccept = (bookingId: string) => {
    updateBookingStatus(bookingId, 'accepted');
    addToast('Job accepted! Customer has been notified.', 'success');
  };

  const handleReject = (bookingId: string) => {
    updateBookingStatus(bookingId, 'cancelled');
    addToast('Job rejected.', 'info');
  };

  const statusColor: Record<string, string> = {
    accepted: 'badge-info',
    on_the_way: 'badge-accent',
    arrived: 'badge-success',
    in_progress: 'badge-accent',
    completed: 'badge-success',
    cancelled: 'badge-error',
  };

  const statusLabel: Record<string, string> = {
    accepted: 'Accepted',
    on_the_way: 'On The Way',
    arrived: 'Arrived',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

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
              <p className="text-gray-500 text-xs mt-0.5">Service Provider</p>
            </div>

            <nav className="space-y-1 mb-6">
              <a href="#" className="flex items-center gap-2.5 px-4 py-2.5 bg-brand-accentLight text-brand-accent font-semibold rounded-2xl text-sm transition-colors">
                <LayoutDashboard size={16} /> Dashboard
              </a>
              <a href="#" className="flex items-center gap-2.5 px-4 py-2.5 text-gray-500 hover:bg-gray-100 rounded-2xl text-sm transition-colors">
                <Briefcase size={16} /> Requests
              </a>
            </nav>

            <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-2xl text-sm transition-colors font-medium">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full md:flex-1 min-w-0 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-brand-dark">Vendor Dashboard</h1>
            {myProfile?.verification_status === 'pending' && (
              <span className="badge-warning py-2 px-4">
                <AlertTriangle size={13} className="mr-1.5" />
                Pending Verification
              </span>
            )}
            {myProfile?.verification_status === 'verified' && (
              <span className="badge-success py-2 px-4">
                Verified Account
              </span>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-500 text-sm font-medium">New Requests</h3>
                <div className="bg-brand-accentLight p-2 rounded-xl text-brand-accent">
                  <Bell size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-brand-dark">{pendingBookings.length}</div>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-500 text-sm font-medium">Active Jobs</h3>
                <div className="bg-semantic-infoLight p-2 rounded-xl text-semantic-info">
                  <Briefcase size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-brand-dark">{activeBookings.length}</div>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-500 text-sm font-medium">Earnings</h3>
                <div className="bg-semantic-successLight p-2 rounded-xl text-semantic-success">
                  <IndianRupee size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-brand-dark">₹{performance?.netEarnings.toLocaleString('en-IN') || '0'}</div>
            </div>
          </div>

          {/* Active Jobs */}
          {activeBookings.length > 0 && (
            <>
              <h2 className="text-lg font-bold text-brand-dark pt-2">Active Jobs</h2>
              <div className="space-y-4 stagger-children">
                {activeBookings.map(booking => (
                  <div key={booking.id} className="card p-5 border-l-4 border-l-semantic-info flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={statusColor[booking.status] || 'badge-dark'}>
                          {statusLabel[booking.status] || booking.status}
                        </span>
                        <span className="text-xs text-gray-400">{booking.date} at {booking.time}</span>
                      </div>
                      <h3 className="font-bold text-brand-dark">{booking.service}</h3>
                      <p className="text-gray-500 text-xs mt-0.5">
                        <MapPin size={11} className="inline mr-1" />
                        {booking.booking_address || booking.address}
                      </p>
                    </div>
                    <Link
                      to={`/vendor/bookings/${booking.id}/track`}
                      className="btn-primary btn-sm flex items-center gap-1.5 self-start md:self-center"
                    >
                      <Navigation size={13} /> Track / Manage
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pending Requests */}
          <h2 className="text-lg font-bold text-brand-dark pt-2">Recent Requests</h2>

          {pendingBookings.length > 0 ? (
            <div className="space-y-4 stagger-children">
              {pendingBookings.map(booking => (
                <div key={booking.id} className="card p-5 border-l-4 border-l-brand-accent flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge-warning">New Request</span>
                      <span className="text-xs text-gray-400">{booking.date} at {booking.time}</span>
                    </div>
                    <h3 className="font-bold text-brand-dark">{booking.service}</h3>
                    <p className="text-gray-500 text-xs mt-0.5">
                      <MapPin size={11} className="inline mr-1" />
                      {booking.booking_address || booking.address}
                    </p>
                  </div>
                  <div className="flex gap-2 self-start md:self-center">
                    <button
                      onClick={() => handleReject(booking.id)}
                      className="btn-secondary btn-sm"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAccept(booking.id)}
                      className="btn-primary btn-sm"
                    >
                      Accept Job
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <h3 className="text-base font-bold text-brand-dark mb-1.5">No pending requests</h3>
              <p className="text-gray-500 text-sm">You're all caught up!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
