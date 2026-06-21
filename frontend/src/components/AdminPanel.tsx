import React, { useState, useEffect, useCallback } from 'react';
import { volunteerApi, type Volunteer } from '../services/apiService';

/* ── Status Badge ─────────────────────────────── */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg: Record<string, { bg: string; text: string; dot: string }> = {
    Pending:  { bg: 'rgba(234,179,8,0.12)',  text: '#facc15', dot: '#eab308' },
    Approved: { bg: 'rgba(34,197,94,0.12)',  text: '#4ade80', dot: '#22c55e' },
    Rejected: { bg: 'rgba(239,68,68,0.12)',  text: '#f87171', dot: '#ef4444' },
  };
  const s = cfg[status] ?? cfg['Pending'];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
          style={{ background: s.bg, color: s.text, border: `1px solid ${s.dot}40` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {status}
    </span>
  );
};

/* ── Action Button ────────────────────────────── */
interface ActionBtnProps {
  label: string;
  color: string;
  glow: string;
  onClick: () => void;
  disabled?: boolean;
}
const ActionBtn: React.FC<ActionBtnProps> = ({ label, color, glow, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white transition-all duration-200 disabled:opacity-30"
    style={{ background: color, boxShadow: `0 0 8px ${glow}` }}
  >
    {label}
  </button>
);

/* ── AdminPanel ───────────────────────────────── */
interface AdminPanelProps { refreshTrigger: number }

const AdminPanel: React.FC<AdminPanelProps> = ({ refreshTrigger }) => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [busyId, setBusyId]         = useState<number | null>(null);

  const fetchVolunteers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await volunteerApi.getAll();
      setVolunteers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /* Fetch on mount and whenever the form triggers a refresh */
  useEffect(() => { fetchVolunteers(); }, [fetchVolunteers, refreshTrigger]);

  const handleStatus = async (id: number, status: string) => {
    setBusyId(id);
    try {
      const updated = await volunteerApi.updateStatus(id, status);
      setVolunteers(prev => prev.map(v => v.id === id ? updated : v));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Remove this volunteer?')) return;
    setBusyId(id);
    try {
      await volunteerApi.remove(id);
      setVolunteers(prev => prev.filter(v => v.id !== id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  /* ── Stats bar ── */
  const stats = {
    total:    volunteers.length,
    pending:  volunteers.filter(v => v.status === 'Pending').length,
    approved: volunteers.filter(v => v.status === 'Approved').length,
    rejected: volunteers.filter(v => v.status === 'Rejected').length,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-5 pb-3"
           style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Admin Dashboard</h2>
            <p className="text-[11px] text-white/40 mt-0.5">Manage volunteer applications</p>
          </div>
          <button onClick={fetchVolunteers} disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 transition-all hover:text-white disabled:opacity-40"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {([
            { label: 'Total',    value: stats.total,    color: '#a78bfa' },
            { label: 'Pending',  value: stats.pending,  color: '#facc15' },
            { label: 'Approved', value: stats.approved, color: '#4ade80' },
            { label: 'Rejected', value: stats.rejected, color: '#f87171' },
          ] as const).map(s => (
            <div key={s.label} className="rounded-xl p-2.5 text-center"
                 style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-white/40 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-5 mt-3 px-4 py-2.5 rounded-xl text-xs text-red-300 flex items-center gap-2"
             style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <span>⚠️</span>{error}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-5 py-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {loading && volunteers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-violet-400 animate-spin" />
            <span className="text-sm">Loading volunteers…</span>
          </div>
        ) : volunteers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
            <div className="text-4xl">📋</div>
            <p className="text-sm text-center">No volunteers yet.<br/>They'll appear here once registered.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {volunteers.map((v, idx) => (
              <div key={v.id}
                   className="group relative flex flex-col gap-2.5 p-4 rounded-2xl transition-all duration-200 hover:scale-[1.005]"
                   style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                {/* Row number */}
                <div className="absolute top-3.5 right-3.5 text-[10px] text-white/20 font-mono">#{idx + 1}</div>

                {/* Top row: name + badge */}
                <div className="flex items-start justify-between gap-2 pr-6">
                  <div>
                    <p className="text-sm font-semibold text-white">{v.name}</p>
                    <p className="text-xs text-white/40 mt-0.5">{v.email}</p>
                  </div>
                  <StatusBadge status={v.status ?? 'Pending'} />
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5">
                  {v.skills.split(',').map(skill => skill.trim()).filter(Boolean).map(skill => (
                    <span key={skill} className="px-2 py-0.5 rounded-md text-[11px] text-white/60"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <ActionBtn label="✓ Approve" color="rgba(22,163,74,0.85)" glow="rgba(34,197,94,0.3)"
                             onClick={() => handleStatus(v.id!, 'Approved')}
                             disabled={busyId === v.id || v.status === 'Approved'} />
                  <ActionBtn label="✗ Reject"  color="rgba(185,28,28,0.85)"  glow="rgba(239,68,68,0.3)"
                             onClick={() => handleStatus(v.id!, 'Rejected')}
                             disabled={busyId === v.id || v.status === 'Rejected'} />
                  <ActionBtn label="🗑 Delete"  color="rgba(100,100,120,0.7)" glow="rgba(150,150,180,0.2)"
                             onClick={() => handleDelete(v.id!)}
                             disabled={busyId === v.id} />
                  {busyId === v.id && (
                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin ml-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-5 py-2.5 text-[11px] text-white/25 text-center"
           style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        Data served from Spring Boot · H2 in-memory DB · Port 8080
      </div>
    </div>
  );
};

export default AdminPanel;
