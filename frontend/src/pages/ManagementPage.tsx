import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, Search, Check, X, Trash2, ArrowRight, Heart, ChevronDown, Filter } from 'lucide-react';
import { volunteerApi, type Volunteer } from '../services/apiService';

const STATUS_COLORS: Record<string, string> = {
  Approved: 'badge-approved',
  Rejected: 'badge-rejected',
  Pending:  'badge-pending',
};

type FilterStatus = 'All' | 'Pending' | 'Approved' | 'Rejected';

export default function ManagementPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [filtered, setFiltered] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    volunteerApi.getAll()
      .then(setVolunteers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let r = volunteers;
    if (statusFilter !== 'All') r = r.filter(v => v.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(v => v.name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q) || v.skills.toLowerCase().includes(q));
    }
    setFiltered(r);
  }, [volunteers, search, statusFilter]);

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await volunteerApi.updateStatus(id, status);
      setVolunteers(prev => prev.map(v => v.id === id ? { ...v, status } : v));
    } catch { alert('Failed to update status.'); }
    finally { setUpdatingId(null); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Remove ${name} from the volunteer list?`)) return;
    setDeletingId(id);
    try {
      await volunteerApi.remove(id);
      setVolunteers(prev => prev.filter(v => v.id !== id));
    } catch { alert('Failed to delete.'); }
    finally { setDeletingId(null); }
  };

  const counts: Record<string, number> = {
    All: volunteers.length,
    Pending: volunteers.filter(v => v.status === 'Pending').length,
    Approved: volunteers.filter(v => v.status === 'Approved').length,
    Rejected: volunteers.filter(v => v.status === 'Rejected').length,
  };

  return (
    <div className="min-h-screen bg-paper flex font-sans relative overflow-hidden">
      {/* Background blobs for glassmorphism */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] organic-shape animate-organic opacity-15 pointer-events-none z-0" style={{ background: 'linear-gradient(135deg, #3F6F52, transparent)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] organic-shape animate-organic opacity-15 pointer-events-none z-0" style={{ background: 'linear-gradient(135deg, #D9A441, transparent)', filter: 'blur(60px)', animationDelay: '-5s' }} />

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="sidebar">
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
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/dashboard" className="nav-link">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <Link to="/management" className="nav-link-active">
            <Users className="w-4 h-4" /> Volunteers
            <span className="ml-auto text-xs font-bold bg-moss/10 text-moss rounded-full px-2 py-0.5">{volunteers.length}</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-sage-dark/30">
          <Link to="/" className="nav-link">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back to Site
          </Link>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto relative z-10">

        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-sage-dark/20 px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-forest">Volunteer Management</h1>
              <p className="text-xs text-muted">Review and manage all registered volunteer applications.</p>
            </div>
            {/* Search + filter */}
            <div className="flex gap-3 items-center flex-wrap">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search name, email, skills..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input pl-10 py-2.5 w-56 text-sm"
                />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as FilterStatus)}
                  className="input py-2.5 pr-8 text-sm appearance-none cursor-pointer"
                >
                  {(['All', 'Pending', 'Approved', 'Rejected'] as FilterStatus[]).map(s => (
                    <option key={s} value={s}>{s} ({counts[s]})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Status tab pills */}
          <div className="flex gap-2 mt-4">
            {(['All', 'Pending', 'Approved', 'Rejected'] as FilterStatus[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  statusFilter === s
                    ? 'bg-forest text-white shadow-card'
                    : 'bg-sage text-muted hover:bg-sage-dark hover:text-forest'
                }`}
              >
                {s} <span className="ml-1 opacity-70">({counts[s]})</span>
              </button>
            ))}
          </div>
        </header>

        <div className="p-8">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
            </div>
          ) : (
            <div className="card organic-card overflow-hidden" style={{ animation: 'stagger-up 0.5s ease both' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-sage border-b border-sage-dark/30 text-xs uppercase tracking-wider text-muted">
                      <th className="px-6 py-4 font-semibold">Volunteer</th>
                      <th className="px-6 py-4 font-semibold">Skills</th>
                      <th className="px-6 py-4 font-semibold">Availability</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-dark/20">
                    {filtered.map(vol => (
                      <tr key={vol.id} className={`hover:bg-sage/30 transition-colors duration-150 ${deletingId === vol.id ? 'opacity-40' : ''}`} style={{ animation: `stagger-up 0.4s ease ${0.1 + (filtered.indexOf(vol) * 0.05)}s both` }}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-moss/20 to-forest/20 flex items-center justify-center text-forest font-bold text-sm shrink-0 border border-sage-dark/30">
                              {vol.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-forest text-sm">{vol.name}</p>
                              <p className="text-xs text-muted">{vol.email}</p>
                              <p className="text-xs text-muted/70 mt-0.5">{vol.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-ink font-medium">{vol.skills}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted">{vol.availability}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={STATUS_COLORS[vol.status ?? 'Pending'] ?? 'badge-pending'}>
                            <span className={`w-2 h-2 rounded-full inline-block bg-current opacity-70 ${vol.status === 'Pending' || !vol.status ? 'animate-pulse-ring' : ''}`} />
                            {vol.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 justify-end">
                            {vol.status !== 'Approved' && (
                              <button
                                onClick={() => updateStatus(vol.id!, 'Approved')}
                                disabled={updatingId === vol.id}
                                title="Approve"
                                className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 flex items-center justify-center transition-all duration-150 disabled:opacity-40"
                              >
                                {updatingId === vol.id ? <div className="w-3 h-3 border border-emerald-600 border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                              </button>
                            )}
                            {vol.status !== 'Rejected' && (
                              <button
                                onClick={() => updateStatus(vol.id!, 'Rejected')}
                                disabled={updatingId === vol.id}
                                title="Reject"
                                className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 hover:bg-orange-100 hover:text-orange-600 flex items-center justify-center transition-all duration-150 disabled:opacity-40"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(vol.id!, vol.name)}
                              disabled={deletingId === vol.id}
                              title="Delete"
                              className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all duration-150 disabled:opacity-40"
                            >
                              {deletingId === vol.id ? <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center">
                          <Filter className="w-8 h-8 mx-auto mb-3 text-sage-dark" />
                          <p className="font-semibold text-forest">No volunteers found</p>
                          <p className="text-xs text-muted mt-1">Try adjusting your search or status filter.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-sage-dark/20 bg-sage flex items-center justify-between">
                <p className="text-xs text-muted">
                  Showing <span className="font-semibold text-forest">{filtered.length}</span> of <span className="font-semibold text-forest">{volunteers.length}</span> volunteers
                </p>
                <Link to="/dashboard" className="text-xs text-moss font-semibold hover:text-forest transition-colors">← Dashboard</Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
