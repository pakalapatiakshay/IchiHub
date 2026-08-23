import { useAuth } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import { LogOut, Users, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface AdminMetrics {
  totalUsers: number; activeVendors: number; todaysBookings: number; completedToday: number; pendingBookings: number;
  cancelledToday: number; grossRevenue: number; platformEarnings: number; openComplaints: number; pendingVerifications: number; activeServices: number;
}

export default function AdminDashboard() {
  const { logout } = useAuth();
  const { vendors, updateVendorStatus } = useDataStore();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

  useEffect(() => {
    api<{ metrics: AdminMetrics }>('/admin/metrics').then((response) => setMetrics(response.metrics)).catch(() => setMetrics(null));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const pendingVendors = vendors.filter(v => v.verification_status === 'pending');
  const verifiedVendors = vendors.filter(v => v.verification_status === 'verified');

  return (
    <div className="min-h-screen bg-brand-light py-8 md:py-10">
      <div className="max-w-7xl mx-auto px-4 md:px-12 flex flex-col md:flex-row gap-6 md:gap-8">

        {/* Sidebar */}
        <div className="w-full md:w-[260px] flex-shrink-0">
          <div className="bg-brand-dark rounded-3xl shadow-glass p-5 text-white sticky top-24 border border-white/[0.06]">
            <div className="text-center mb-5 pb-5 border-b border-white/[0.08]">
              <h2 className="font-bold text-sm">Admin Panel</h2>
              <p className="text-gray-500 text-xs mt-0.5">Superuser</p>
            </div>

            <nav className="space-y-1 mb-6">
              <a href="#" className="flex items-center gap-2.5 px-4 py-2.5 bg-brand-accent/15 text-brand-accent font-semibold rounded-2xl text-sm transition-colors">
                <Users size={16} /> Manage Vendors
              </a>
            </nav>

            <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-red-400 hover:bg-white/[0.05] rounded-2xl text-sm transition-colors font-medium">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full md:flex-1 min-w-0 space-y-6">
          <h1 className="text-2xl font-display font-bold text-brand-dark">Platform Administration</h1>

          {metrics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                ['Total Users', metrics.totalUsers], ['Active Vendors', metrics.activeVendors], ['Today\'s Bookings', metrics.todaysBookings], ['Completed Today', metrics.completedToday],
                ['Open Complaints', metrics.openComplaints], ['Pending Verifications', metrics.pendingVerifications], ['Gross Revenue', `₹${metrics.grossRevenue.toLocaleString('en-IN')}`], ['Platform Earnings', `₹${metrics.platformEarnings.toLocaleString('en-IN')}`],
              ].map(([label, value]) => (
                <div key={String(label)} className="card p-4">
                  <p className="text-xs font-medium text-gray-500">{label}</p>
                  <p className="mt-1 text-xl font-bold text-brand-dark">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Pending Approvals */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-brand-dark mb-4">Pending Vendor Approvals</h2>

            {pendingVendors.length > 0 ? (
              <div className="space-y-3 stagger-children">
                {pendingVendors.map(vendor => (
                  <div key={vendor.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div>
                      <h3 className="font-bold text-brand-dark text-sm">{vendor.business_name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{vendor.category} • {vendor.city}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateVendorStatus(vendor.id, 'verified')}
                        className="btn-success btn-sm"
                      >
                        <CheckCircle size={14} className="mr-1" /> Approve
                      </button>
                      <button
                        onClick={() => updateVendorStatus(vendor.id, 'rejected')}
                        className="btn-danger btn-sm"
                      >
                        <XCircle size={14} className="mr-1" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No pending vendor approvals.</p>
            )}
          </div>

          {/* Verified Vendors */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-brand-dark mb-4">Verified Vendors ({verifiedVendors.length})</h2>
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left min-w-[480px]">
                <thead>
                  <tr className="border-b border-brand-border">
                    <th className="pb-3 pl-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Name</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="pb-3 pr-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {verifiedVendors.map(vendor => (
                    <tr key={vendor.id} className="border-b border-brand-border last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 pl-6 font-medium text-brand-dark text-sm">{vendor.business_name}</td>
                      <td className="py-3.5 text-gray-500 text-sm">{vendor.category}</td>
                      <td className="py-3.5 pr-6"><span className="badge-success">Verified</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
