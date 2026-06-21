import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, TrendingUp, LayoutDashboard, Heart, ArrowRight, Clock } from 'lucide-react';
import { volunteerApi, type Volunteer, type DashboardMetrics } from '../services/apiService';

const STATUS_COLORS: Record<string, string> = {
  Approved: 'badge-approved',
  Rejected: 'badge-rejected',
  Pending:  'badge-pending',
};

const MetricCard: React.FC<{ icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }> = ({ icon: Icon, label, value, sub, color }) => (
  <div className="card p-6 flex items-center gap-5">
    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shrink-0 shadow-lg`}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-0.5">{label}</p>
      <p className="text-3xl font-extrabold font-serif text-forest leading-none">{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  </div>
);

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({ totalApplications: 0, activeVolunteers: 0 });
  const [recent, setRecent] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [m, all] = await Promise.all([volunteerApi.getMetrics(), volunteerApi.getAll()]);
        setMetrics(m);
        setRecent([...all].sort((a, b) => (b.id ?? 0) - (a.id ?? 0)).slice(0, 6));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pendingCount = recent.filter(v => v.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-paper flex font-sans relative overflow-hidden">
      {/* Background blobs for glassmorphism */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] organic-shape animate-organic opacity-15 pointer-events-none z-0" style={{ background: 'linear-gradient(135deg, #3F6F52, transparent)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] organic-shape animate-organic opacity-15 pointer-events-none z-0" style={{ background: 'linear-gradient(135deg, #D9A441, transparent)', filter: 'blur(60px)', animationDelay: '-5s' }} />

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="p-6 border-b border-sage-dark/30">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-moss to-forest flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-current" />
            </div>
            <div>
              <div className="font-serif font-bold text-forest text-sm leading-none">NayePankh</div>
              <div className="text-muted text-xs">Admin Portal</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/dashboard" className="nav-link-active">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <Link to="/management" className="nav-link">
            <Users className="w-4 h-4" /> Volunteers
          </Link>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sage-dark/30">
          <Link to="/" className="nav-link">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back to Site
          </Link>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto relative z-10">

        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-sage-dark/20 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-forest">Dashboard Overview</h1>
            <p className="text-xs text-muted">Welcome back! Here's what's happening today.</p>
          </div>
          <Link to="/management" className="btn-primary text-sm px-5 py-2.5">
            Manage Volunteers <ArrowRight className="w-4 h-4" />
          </Link>
        </header>

        <div className="p-8 space-y-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="skeleton h-28 rounded-3xl" />)}
            </div>
          ) : (
            <>
              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div style={{ animation: 'stagger-up 0.5s ease 0.1s both' }}>
                  <MetricCard icon={Users} label="Total Applications" value={metrics.totalApplications} sub="All-time registrations" color="bg-gradient-to-br from-blue-500 to-indigo-600" />
                </div>
                <div style={{ animation: 'stagger-up 0.5s ease 0.2s both' }}>
                  <MetricCard icon={UserCheck} label="Active Volunteers" value={metrics.activeVolunteers} sub="Status: Approved" color="bg-gradient-to-br from-moss to-forest" />
                </div>
                <div style={{ animation: 'stagger-up 0.5s ease 0.3s both' }}>
                  <MetricCard icon={TrendingUp} label="Pending Review" value={pendingCount} sub="Awaiting decision" color="bg-gradient-to-br from-amber-500 to-orange-500" />
                </div>
              </div>

              {/* Recent registrations */}
              <div className="card overflow-hidden">
                <div className="px-6 py-5 border-b border-sage-dark/20 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-forest text-lg">Recent Applications</h2>
                    <p className="text-xs text-muted mt-0.5">Latest volunteer submissions</p>
                  </div>
                  <Link to="/management" className="text-sm text-moss font-semibold hover:text-forest transition-colors flex items-center gap-1">
                    View all <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-sage text-muted text-xs uppercase tracking-wider border-b border-sage-dark/30">
                        <th className="px-6 py-3.5 font-semibold">Volunteer</th>
                        <th className="px-6 py-3.5 font-semibold">Skills</th>
                        <th className="px-6 py-3.5 font-semibold">Availability</th>
                        <th className="px-6 py-3.5 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sage-dark/20">
                      {recent.map(v => (
                        <tr key={v.id} className="hover:bg-sage/40 transition-colors duration-150">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-moss/20 to-forest/20 flex items-center justify-center text-forest font-bold text-sm shrink-0">
                                {v.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-forest">{v.name}</p>
                                <p className="text-xs text-muted">{v.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-ink">{v.skills}</td>
                          <td className="px-6 py-4 text-sm text-muted flex items-center gap-1.5 pt-5">
                            <Clock className="w-3.5 h-3.5" />{v.availability}
                          </td>
                          <td className="px-6 py-4">
                            <span className={STATUS_COLORS[v.status ?? 'Pending'] ?? 'badge-pending'}>
                              <span className={`w-2 h-2 rounded-full inline-block bg-current opacity-70 ${v.status === 'Pending' || !v.status ? 'animate-pulse-ring' : ''}`} />
                              {v.status || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {recent.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-16 text-center text-muted">
                            <Heart className="w-8 h-8 mx-auto mb-3 text-sage-dark" />
                            <p className="font-medium">No applications yet</p>
                            <p className="text-xs mt-1">Share the volunteer link to get started.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ animation: 'stagger-up 0.5s ease 0.5s both' }}>
                <Link to="/management" className="card organic-card p-6 group flex items-center justify-between hover:border-moss/40 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-moss to-forest flex items-center justify-center shadow-card">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-forest">Manage Volunteers</p>
                      <p className="text-xs text-muted">Approve, reject or remove</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted group-hover:text-forest group-hover:translate-x-1 transition-all" />
                </Link>
                <Link to="/register" className="card organic-card p-6 group flex items-center justify-between hover:border-gold/40 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-gold">
                      <Heart className="w-6 h-6 text-white fill-current" />
                    </div>
                    <div>
                      <p className="font-bold text-forest">Volunteer Registration</p>
                      <p className="text-xs text-muted">OTP-verified onboarding form</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted group-hover:text-forest group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
