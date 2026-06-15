import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, ShieldAlert, Users, FileText, Flag,
  TrendingUp, CheckCircle2, RefreshCw, Search, X,
  Bell, BellOff, Zap, BarChart3, ShoppingCart,
  Building2, Pill, ClipboardList, RotateCcw, ChevronDown,
  AlertTriangle, Eye, Clock, UserCircle, Package, ChevronRight
} from 'lucide-react';
import { authService } from '../services/auth';
import {
  fetchAllUsers, fetchAllFlags, fetchAllManifests,
  fetchAllMedicines, fetchAllDistributors, fetchAllReceipts, fetchAllOrders,
  resolveFlag, unresolveFlag, updateOrderStatus,
} from '../services/admin';
import type { 
  AdminUser, AdminCrowdFlag, AdminManifest, 
  AdminMedicine, AdminDistributor, AdminReceiptEvent, AdminOrder 
} from '../services/admin';
import FraudRadarMap from './FraudRadarMap';

// ─── Types ────────────────────────────────────────────────────────────────────
type ActiveTab = 'overview' | 'crisis' | 'flags' | 'users' | 'manifests' | 'medicines' | 'distributors' | 'receipts' | 'orders';
type CrisisSeverityFilter = 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'OPEN' | 'RESOLVED';

interface CrisisAlert {
  id: string; flagId: string; batchNumber: string;
  severity: 'CRITICAL' | 'HIGH'; issue: string;
  reporter: string; timestamp: string; dismissed: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const timeAgo = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return new Date(d).toLocaleDateString();
};

const sevMeta = (s: string) => ({
  CRITICAL: { cls: 'text-danger border-danger/40 bg-danger/10', dot: 'bg-danger' },
  HIGH:     { cls: 'text-orange-400 border-orange-400/40 bg-orange-500/10', dot: 'bg-orange-400' },
  MEDIUM:   { cls: 'text-warning border-warning/40 bg-yellow-500/10', dot: 'bg-warning' },
  LOW:      { cls: 'text-primary border-primary/40 bg-primary/10', dot: 'bg-primary' },
}[s] ?? { cls: 'text-white/40 border-white/10', dot: 'bg-white/20' });

const orderStatusCls: Record<string, string> = {
  PENDING:   'text-warning border-warning/30 bg-yellow-500/10',
  SHIPPED:   'text-primary border-primary/30 bg-primary/10',
  DELIVERED: 'text-success border-success/30 bg-success/10',
  REJECTED:  'text-danger border-danger/30 bg-danger/10',
};

const trustCol = (n: number) => n >= 80 ? '#00C853' : n >= 60 ? '#FFD600' : '#D50000';

// ─── Flag Detail Modal ───────────────────────────────────────────────────────
const FlagDetailModal: React.FC<{
  flag: import('../services/admin').AdminCrowdFlag | null;
  onClose: () => void;
  onResolve: (id: string, resolved: boolean) => void;
  resolving: string | null;
}> = ({ flag, onClose, onResolve, resolving }) => {
  if (!flag) return null;
  const m = sevMeta(flag.severity);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl bg-surface-dark rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b border-white/8 flex items-center justify-between`}
          style={{ borderLeftWidth: 4, borderLeftStyle: 'solid', borderLeftColor: flag.severity === 'CRITICAL' ? '#D50000' : flag.severity === 'HIGH' ? '#FB8C00' : flag.severity === 'MEDIUM' ? '#FFD600' : '#2979FF' }}>
          <div className="flex items-center gap-3">
            <Badge label={flag.severity} className={m.cls} />
            <span className="font-bold text-white">{flag.issue_type}</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Description */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-1.5">Description</p>
            <p className="text-white/80 text-sm leading-relaxed">{flag.description || <span className="text-white/30 italic">No description provided.</span>}</p>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/3 rounded-xl p-3 border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Flag ID</p>
              <p className="text-xs font-mono text-white/60 break-all">{flag.id}</p>
            </div>
            <div className="bg-white/3 rounded-xl p-3 border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Reporter Type</p>
              <p className="text-sm font-semibold text-white">{flag.reporter_type}</p>
            </div>
            <div className="bg-white/3 rounded-xl p-3 border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Reporter</p>
              <p className="text-sm font-semibold text-white">{flag.user_username}</p>
            </div>
            <div className="bg-white/3 rounded-xl p-3 border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Reported</p>
              <p className="text-sm text-white/70">{timeAgo(flag.created_at)}</p>
            </div>
            <div className="bg-white/3 rounded-xl p-3 border border-white/5 col-span-2">
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Lot / Batch</p>
              <p className="text-xs font-mono text-white/60 break-all">{flag.lot}</p>
              {flag.lot_batch_number && (
                <p className="text-sm font-bold text-white mt-0.5">Batch: {flag.lot_batch_number}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/50">
              Status:&nbsp;
              {flag.is_resolved
                ? <span className="text-success font-bold">Resolved ✓</span>
                : <span className="text-warning font-bold">Open — Needs Action</span>}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => onResolve(flag.id, flag.is_resolved)}
              disabled={resolving === flag.id}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                flag.is_resolved
                  ? 'bg-warning/10 border border-warning/30 text-warning hover:bg-warning/20'
                  : 'bg-success/10 border border-success/30 text-success hover:bg-success/20'
              } disabled:opacity-50`}
            >
              {resolving === flag.id
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : flag.is_resolved
                  ? <><RotateCcw className="w-4 h-4" /> Reopen Flag</>
                  : <><CheckCircle2 className="w-4 h-4" /> Mark Resolved</>}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Micro-components ─────────────────────────────────────────────────────────
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-surface-dark rounded-2xl border border-white/5 ${className}`}>{children}</div>
);

const Badge: React.FC<{ label: string; className?: string }> = ({ label, className = '' }) => (
  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${className}`}>{label}</span>
);

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-white/40">{children}</th>
);
const Td: React.FC<{ children: React.ReactNode; mono?: boolean }> = ({ children, mono }) => (
  <td className={`px-5 py-3 ${mono ? 'font-mono text-xs text-white/50' : ''}`}>{children}</td>
);

const EmptyRow: React.FC<{ cols: number; msg?: string }> = ({ cols, msg = 'No data' }) => (
  <tr><td colSpan={cols} className="px-5 py-16 text-center text-white/30">{msg}</td></tr>
);

const StatCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode; color: string; sub?: string }> = ({ label, value, icon, color, sub }) => (
  <Card className="p-5 h-32 flex flex-col justify-between relative overflow-hidden group hover:border-white/10 transition-all">
    <div className={`absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${color}`}>
      <div className="text-7xl">{icon}</div>
    </div>
    <div className={`flex items-center gap-2 ${color}`}>{icon}<p className="text-sm font-semibold text-white/60">{label}</p></div>
    <div>
      <p className="text-3xl font-extrabold text-white">{value}</p>
      {sub && <p className="text-xs text-white/40 mt-0.5">{sub}</p>}
    </div>
  </Card>
);

// ─── Crisis Alert Banner ──────────────────────────────────────────────────────
const CrisisBanner: React.FC<{
  alerts: CrisisAlert[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}> = ({ alerts, onDismiss, onDismissAll }) => {
  const vis = alerts.filter(a => !a.dismissed);
  if (!vis.length) return null;
  return (
    <div className="mx-8 mt-4 rounded-2xl border border-danger/40 bg-danger/10 overflow-hidden animate-slideUp">
      <div className="flex items-center justify-between px-5 py-3 bg-danger/20 border-b border-danger/30">
        <div className="flex items-center gap-2 text-danger font-bold text-sm">
          <ShieldAlert className="w-4 h-4 animate-pulse" />
          CRISIS ALERT — {vis.length} unresolved CRITICAL/HIGH flag{vis.length > 1 ? 's' : ''}
        </div>
        <button onClick={onDismissAll} className="text-xs text-danger/70 hover:text-danger font-bold flex items-center gap-1">
          <BellOff className="w-3.5 h-3.5" /> Dismiss All
        </button>
      </div>
      <div className="divide-y divide-danger/20 max-h-48 overflow-y-auto">
        {vis.map(a => (
          <div key={a.id} className="flex items-start gap-3 px-5 py-3 hover:bg-danger/5 transition-colors">
            <span className={`mt-1 size-2 rounded-full shrink-0 ${a.severity === 'CRITICAL' ? 'bg-danger' : 'bg-orange-400'} animate-pulse`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge label={a.severity} className={sevMeta(a.severity).cls} />
                <span className="text-sm font-bold text-white">Batch: <span className="font-mono">{a.batchNumber}</span></span>
                <span className="text-xs text-white/50">{a.issue}</span>
              </div>
              <p className="text-xs text-white/40 mt-0.5">By <span className="text-white/60">{a.reporter}</span> · {timeAgo(a.timestamp)}</p>
            </div>
            <button onClick={() => onDismiss(a.id)} className="text-white/30 hover:text-white/70"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [alertsMuted, setAlertsMuted] = useState(false);
  const [crisisAlerts, setCrisisAlerts] = useState<CrisisAlert[]>([]);
  const [severityFilter, setSeverityFilter] = useState<CrisisSeverityFilter>('ALL');
  const [selectedFlag, setSelectedFlag] = useState<AdminCrowdFlag | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Data state
  const [flags,       setFlags]       = useState<AdminCrowdFlag[]>([]);
  const [users,       setUsers]       = useState<AdminUser[]>([]);
  const [manifests,   setManifests]   = useState<AdminManifest[]>([]);
  const [medicines,   setMedicines]   = useState<AdminMedicine[]>([]);
  const [distributors, setDistributors] = useState<AdminDistributor[]>([]);
  const [receipts,     setReceipts]     = useState<AdminReceiptEvent[]>([]);
  const [orders,       setOrders]       = useState<AdminOrder[]>([]);

  // ── Data fetch ────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [f, u, m, med, dist, rec, ord] = await Promise.allSettled([
      fetchAllFlags(),
      fetchAllUsers(),
      fetchAllManifests(),
      fetchAllMedicines(),
      fetchAllDistributors(),
      fetchAllReceipts(),
      fetchAllOrders(),
    ]);

    const settled = <T,>(r: PromiseSettledResult<T[]>): T[] =>
      r.status === 'fulfilled' ? r.value : [];

    const flagData = settled<AdminCrowdFlag>(f);
    setFlags(flagData);
    setUsers(settled<AdminUser>(u));
    setManifests(settled<AdminManifest>(m));
    setMedicines(settled<AdminMedicine>(med));
    setDistributors(settled<AdminDistributor>(dist));
    setReceipts(settled<AdminReceiptEvent>(rec));
    setOrders(settled<AdminOrder>(ord));

    setCrisisAlerts(
      flagData
        .filter(fl => !fl.is_resolved && ['CRITICAL', 'HIGH'].includes(fl.severity))
        .map(fl => ({
          id: fl.id, flagId: fl.id,
          batchNumber: fl.lot_batch_number || fl.lot.slice(0, 8) + '…',
          severity: fl.severity as 'CRITICAL' | 'HIGH',
          issue: fl.issue_type,
          reporter: fl.user_username,
          timestamp: fl.created_at,
          dismissed: false,
        }))
    );
    setLoading(false);
   
  }, []);

  // ── Auth guard (runs once on mount) ───────────────────────────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem('user');
    if (!raw) { navigate('/login'); return; }
    const parsed: AdminUser = JSON.parse(raw);
    if (parsed.role !== 'Admin') { navigate('/login'); return; }
    setUser(parsed);
    void fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleResolveFlag = async (id: string, resolved: boolean) => {
    setResolvingId(id);
    try {
      if (resolved) {
        await unresolveFlag(id);
      } else {
        await resolveFlag(id);
      }
      setFlags(prev => prev.map(f => f.id === id ? { ...f, is_resolved: !resolved } : f));
      // Also update selectedFlag if it's open
      setSelectedFlag(prev => prev?.id === id ? { ...prev, is_resolved: !resolved } : prev);
      if (!resolved) setCrisisAlerts(prev => prev.map(a => a.flagId === id ? { ...a, dismissed: true } : a));
    } catch { /* silent */ } finally {
      setResolvingId(null);
    }
  };

  const handleOrderStatus = async (id: string, status: AdminOrder['status']) => {
    try {
      const updated = await updateOrderStatus(id, status);
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
    } catch { /* silent */ }
  };

  // Computed stats

  const criticalCount  = flags.filter(f => !f.is_resolved && f.severity === 'CRITICAL').length;
  const unresolvedCount= flags.filter(f => !f.is_resolved).length;
  const avgTrust = manifests.length
    ? (manifests.reduce((s, m) => s + Number(m.trust_score), 0) / manifests.length).toFixed(1)
    : '—';
  const activeAlerts = crisisAlerts.filter(a => !a.dismissed).length;

  // Computed crisis stats
  const crisisUnresolved = flags.filter(f => !f.is_resolved && ['CRITICAL','HIGH'].includes(f.severity)).length;

  // Nav config
  const NAV: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview',     label: 'Overview',        icon: <BarChart3 className="w-4 h-4" />,     badge: criticalCount || undefined },
    { id: 'crisis',       label: 'Crisis Alerts',   icon: <ShieldAlert className="w-4 h-4" />,   badge: crisisUnresolved || undefined },
    { id: 'flags',        label: 'Quality Flags',   icon: <Flag className="w-4 h-4" />,          badge: unresolvedCount || undefined },
    { id: 'users',        label: 'Users',          icon: <Users className="w-4 h-4" /> },
    { id: 'orders',       label: 'Supply Orders',  icon: <ShoppingCart className="w-4 h-4" />,   badge: orders.filter(o => o.status === 'PENDING').length || undefined },
    { id: 'manifests',    label: 'Lot Manifests',  icon: <FileText className="w-4 h-4" /> },
    { id: 'medicines',    label: 'Medicines',      icon: <Pill className="w-4 h-4" /> },
    { id: 'distributors', label: 'Distributors',   icon: <Building2 className="w-4 h-4" /> },
    { id: 'receipts',     label: 'Receipt Events', icon: <ClipboardList className="w-4 h-4" /> },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter = <T extends Record<string, any>>(arr: T[], keys: (keyof T)[]) =>
    !search ? arr : arr.filter(item =>
      keys.some(k => String(item[k] ?? '').toLowerCase().includes(search.toLowerCase()))
    );

  if (loading) return (
    <div className="bg-background-dark h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <p className="text-white/50">Loading Admin Console…</p>
      </div>
    </div>
  );

  return (
    <div className="bg-background-dark text-white font-display h-screen flex overflow-hidden">

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-surface-dark/80 border-r border-white/5 flex flex-col shrink-0 backdrop-blur-md">
        {/* Brand */}
        <div className="p-5 flex items-center gap-3 border-b border-white/5">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shadow-lg shadow-primary/30">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-base">RxVerify</h1>
            <p className="text-primary text-[10px] font-bold tracking-widest uppercase">Admin Console</p>
          </div>
        </div>

        {/* Crisis pill */}
        {activeAlerts > 0 && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-danger/10 border border-danger/30 flex items-center gap-2 text-xs">
            <span className="size-2 rounded-full bg-danger animate-pulse" />
            <span className="text-danger font-bold">{activeAlerts} crisis alert{activeAlerts > 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSearch(''); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-all ${
                activeTab === item.id
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && (
                <span className="bg-danger text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          <div className="my-2 border-t border-white/5" />
          <button
            onClick={() => setAlertsMuted(m => !m)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white w-full transition-all"
          >
            {alertsMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {alertsMuted ? 'Unmute Alerts' : 'Mute Alerts'}
          </button>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-9 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center font-bold text-sm">
              {user?.username?.charAt(0).toUpperCase() ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.username}</p>
              <p className="text-xs text-primary/80 font-semibold">Administrator</p>
            </div>
          </div>
          <button
            onClick={() => { authService.logout(); navigate('/login'); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 text-sm font-bold"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 shrink-0 bg-surface-dark/60 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-extrabold">{NAV.find(n => n.id === activeTab)?.label}</h2>
            {activeAlerts > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger/15 border border-danger/30 text-danger text-xs font-bold">
                <Zap className="w-3 h-3 animate-pulse" /> {activeAlerts} Crisis
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/25 focus:border-primary/50 focus:outline-none w-52"
              />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"><X className="w-3.5 h-3.5" /></button>}
            </div>
            <button onClick={fetchAll} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm font-medium">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </header>

        {/* Crisis banner */}
        {!alertsMuted && <CrisisBanner alerts={crisisAlerts} onDismiss={id => setCrisisAlerts(p => p.map(a => a.id === id ? { ...a, dismissed: true } : a))} onDismissAll={() => setCrisisAlerts(p => p.map(a => ({ ...a, dismissed: true })))} />}

        {/* Flag Detail Modal */}
        <FlagDetailModal
          flag={selectedFlag}
          onClose={() => setSelectedFlag(null)}
          onResolve={handleResolveFlag}
          resolving={resolvingId}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Feature: Live Epidemiological Outbreak Tracking Map */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Flag className="w-5 h-5 text-danger" />
                  <h3 className="text-lg font-bold text-white">Live Epidemiological Outbreak Tracking</h3>
                </div>
                <FraudRadarMap />
              </Card>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Users"       value={users.length}       icon={<Users className="w-6 h-6"/>}       color="text-primary"      sub={`${users.filter(u=>u.role==='Patient').length} patients`} />
                <StatCard label="Lot Manifests"     value={manifests.length}   icon={<FileText className="w-6 h-6"/>}    color="text-purple-400"   sub={`avg trust: ${avgTrust}%`} />
                <StatCard label="Unresolved Flags"  value={unresolvedCount}    icon={<Flag className="w-6 h-6"/>}        color={unresolvedCount>0?'text-warning':'text-success'} sub={`${criticalCount} critical`} />
                <StatCard label="Pending Orders"    value={orders.filter(o=>o.status==='PENDING').length} icon={<ShoppingCart className="w-6 h-6"/>} color="text-orange-400" sub="awaiting fulfilment" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Medicines"    value={medicines.length}    icon={<Pill className="w-6 h-6"/>}         color="text-success" />
                <StatCard label="Distributors" value={distributors.length} icon={<Building2 className="w-6 h-6"/>}   color="text-blue-300" />
                <StatCard label="Receipts"     value={receipts.length}     icon={<ClipboardList className="w-6 h-6"/>} color="text-teal-400" />
                <StatCard label="Critical Now" value={criticalCount}       icon={<ShieldAlert className="w-6 h-6"/>}   color="text-danger" sub="immediate action needed" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent flags */}
                <Card className="overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="font-bold flex items-center gap-2"><Flag className="w-4 h-4 text-warning"/>Recent Flags</h3>
                    <button onClick={() => setActiveTab('flags')} className="text-xs text-primary hover:underline">View all</button>
                  </div>
                  <div className="divide-y divide-white/5">
                    {flags.slice(0, 8).map(f => {
                      const m = sevMeta(f.severity);
                      return (
                        <div key={f.id} className="px-5 py-3 flex items-center gap-3 hover:bg-white/2">
                          <span className={`size-2 rounded-full shrink-0 ${m.dot}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{f.issue_type}</p>
                            <p className="text-[10px] text-white/40 font-mono">{f.lot_batch_number || f.lot.slice(0,12)+'…'} · {f.user_username}</p>
                          </div>
                          <Badge label={f.severity} className={m.cls} />
                          <button onClick={() => handleResolveFlag(f.id, f.is_resolved)} title={f.is_resolved ? 'Unresolve' : 'Resolve'} className={`shrink-0 ${f.is_resolved ? 'text-white/20 hover:text-warning' : 'text-success/60 hover:text-success'}`}>
                            {f.is_resolved ? <RotateCcw className="w-4 h-4"/> : <CheckCircle2 className="w-4 h-4"/>}
                          </button>
                        </div>
                      );
                    })}
                    {!flags.length && <p className="p-8 text-center text-white/30 text-sm">No flags yet</p>}
                  </div>
                </Card>

                {/* Trust health */}
                <Card className="overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-success"/>Lot Trust Health</h3>
                    <button onClick={() => setActiveTab('manifests')} className="text-xs text-primary hover:underline">View all</button>
                  </div>
                  <div className="divide-y divide-white/5">
                    {[...manifests].sort((a,b)=>Number(a.trust_score)-Number(b.trust_score)).slice(0,8).map(m=>{
                      const s = Number(m.trust_score);
                      const c = trustCol(s);
                      return (
                        <div key={m.id} className="px-5 py-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-mono truncate">{m.batch_number}</p>
                            <div className="mt-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{width:`${Math.max(4,s)}%`,backgroundColor:c}}/>
                            </div>
                          </div>
                          <span className="text-sm font-bold" style={{color:c}}>{s.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                    {!manifests.length && <p className="p-8 text-center text-white/30 text-sm">No manifests</p>}
                  </div>
                </Card>
              </div>

              {/* Role breakdown */}
              <Card className="p-5">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-primary"/>User Role Breakdown</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['Patient','Pharmacist','Distributor','Admin'] as const).map(role=>{
                    const pal: Record<string,string> = { Patient:'from-purple-500/20 to-purple-500/5 border-purple-500/20 text-purple-400', Pharmacist:'from-primary/20 to-primary/5 border-primary/20 text-primary', Distributor:'from-teal-500/20 to-teal-500/5 border-teal-500/20 text-teal-400', Admin:'from-danger/20 to-danger/5 border-danger/20 text-danger' };
                    return (
                      <div key={role} className={`p-4 rounded-xl border bg-gradient-to-b ${pal[role]}`}>
                        <p className="text-3xl font-extrabold text-white">{users.filter(u=>u.role===role).length}</p>
                        <p className="text-sm font-semibold mt-1">{role}s</p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* ── CRISIS ALERTS ──────────────────────────────────────────── */}
          {activeTab === 'crisis' && (() => {
            const sevOrder: Record<string,number> = { CRITICAL:0, HIGH:1, MEDIUM:2, LOW:3 };
            const filtered = flags
              .filter(f => {
                if (severityFilter === 'OPEN')     return !f.is_resolved;
                if (severityFilter === 'RESOLVED') return f.is_resolved;
                if (severityFilter !== 'ALL')      return f.severity === severityFilter;
                return true;
              })
              .filter(f =>
                !search ||
                [f.issue_type, f.user_username, f.severity, f.lot_batch_number, f.reporter_type, f.description]
                  .some(v => String(v ?? '').toLowerCase().includes(search.toLowerCase()))
              )
              .sort((a,b) => sevOrder[a.severity] - sevOrder[b.severity]);

            const countFor = (sev: string, onlyOpen = false) =>
              flags.filter(f => f.severity === sev && (!onlyOpen || !f.is_resolved)).length;

            const severityConfig: { key: CrisisSeverityFilter; label: string; cls: string }[] = [
              { key: 'ALL',      label: `All (${flags.length})`,                                             cls: '' },
              { key: 'CRITICAL', label: `Critical (${countFor('CRITICAL')})`,                               cls: 'text-danger border-danger/40 bg-danger/10' },
              { key: 'HIGH',     label: `High (${countFor('HIGH')})`,                                       cls: 'text-orange-400 border-orange-400/40 bg-orange-500/10' },
              { key: 'MEDIUM',   label: `Medium (${countFor('MEDIUM')})`,                                   cls: 'text-warning border-warning/40 bg-yellow-500/10' },
              { key: 'LOW',      label: `Low (${countFor('LOW')})`,                                         cls: 'text-primary border-primary/40 bg-primary/10' },
              { key: 'OPEN',     label: `Open (${flags.filter(f => !f.is_resolved).length})`,               cls: 'text-orange-300 border-orange-300/40 bg-orange-300/10' },
              { key: 'RESOLVED', label: `Resolved (${flags.filter(f => f.is_resolved).length})`,            cls: 'text-success border-success/40 bg-success/10' },
            ];

            return (
              <div className="space-y-5">
                {/* Summary stat row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['CRITICAL','HIGH','MEDIUM','LOW'] as const).map(s => {
                    const palettes: Record<string,{bg:string;border:string;text:string;dot:string}> = {
                      CRITICAL: { bg:'bg-danger/10',    border:'border-danger/30',    text:'text-danger',     dot:'bg-danger' },
                      HIGH:     { bg:'bg-orange-500/10',border:'border-orange-400/30', text:'text-orange-400', dot:'bg-orange-400' },
                      MEDIUM:   { bg:'bg-yellow-500/10',border:'border-warning/30',   text:'text-warning',    dot:'bg-warning' },
                      LOW:      { bg:'bg-primary/10',   border:'border-primary/30',   text:'text-primary',    dot:'bg-primary' },
                    };
                    const p = palettes[s];
                    const total = countFor(s);
                    const open  = countFor(s, true);
                    return (
                      <button
                        key={s}
                        onClick={() => setSeverityFilter(severityFilter === s ? 'ALL' : s)}
                        className={`p-4 rounded-2xl border ${p.bg} ${p.border} text-left transition-all hover:opacity-90 ${
                          severityFilter === s ? 'ring-2 ring-white/20' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`size-2 rounded-full ${p.dot} ${s === 'CRITICAL' ? 'animate-pulse' : ''}`} />
                          <span className={`text-xs font-bold uppercase tracking-wider ${p.text}`}>{s}</span>
                        </div>
                        <p className={`text-3xl font-extrabold text-white`}>{total}</p>
                        <p className="text-xs text-white/40 mt-0.5">{open} unresolved</p>
                      </button>
                    );
                  })}
                </div>

                {/* Filter pills */}
                <div className="flex gap-2 flex-wrap items-center">
                  {severityConfig.map(({ key, label, cls }) => (
                    <button
                      key={key}
                      onClick={() => setSeverityFilter(key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        severityFilter === key
                          ? 'bg-primary border-primary text-white'
                          : `border-white/10 text-white/50 hover:text-white ${cls}`
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <span className="ml-auto text-xs text-white/30">{filtered.length} flag{filtered.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Flag cards */}
                {filtered.length === 0 ? (
                  <Card className="p-16 text-center">
                    <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-white/20" />
                    <p className="text-white/40 font-semibold">No flags match the current filter</p>
                    <p className="text-white/25 text-sm mt-1">Try selecting a different severity or clearing your search</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filtered.map(f => {
                      const m = sevMeta(f.severity);
                      const borderCols: Record<string,string> = {
                        CRITICAL: '#D50000', HIGH: '#FB8C00', MEDIUM: '#FFD600', LOW: '#2979FF'
                      };
                      return (
                        <div
                          key={f.id}
                          className={`relative bg-surface-dark rounded-2xl border border-white/5 overflow-hidden transition-all hover:border-white/10`}
                          style={{ borderLeftWidth: 4, borderLeftColor: borderCols[f.severity] }}
                        >
                          <div className="p-5">
                            {/* Top row */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge label={f.severity} className={m.cls} />
                                {f.reporter_type && (
                                  <span className="px-2 py-0.5 rounded-full border text-[10px] font-bold border-white/10 text-white/40">
                                    {f.reporter_type}
                                  </span>
                                )}
                                {f.is_resolved && (
                                  <span className="px-2 py-0.5 rounded-full border text-[10px] font-bold text-success border-success/30 bg-success/10">
                                    RESOLVED
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-white/30 text-xs shrink-0">
                                <Clock className="w-3 h-3" />
                                {timeAgo(f.created_at)}
                              </div>
                            </div>

                            {/* Issue heading */}
                            <h3 className="text-base font-bold text-white mb-1">{f.issue_type}</h3>

                            {/* Description */}
                            {f.description && (
                              <p className="text-sm text-white/55 leading-relaxed line-clamp-2 mb-3">{f.description}</p>
                            )}

                            {/* Metadata chips */}
                            <div className="flex items-center gap-4 text-xs text-white/40 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                <span className="font-mono">{f.lot_batch_number || f.lot.slice(0,12)+'…'}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <UserCircle className="w-3 h-3" />
                                {f.user_username}
                              </span>
                              <span className="font-mono text-white/25">#{f.id.slice(0,8)}</span>
                            </div>

                            {/* Action row */}
                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                              <button
                                onClick={() => handleResolveFlag(f.id, f.is_resolved)}
                                disabled={resolvingId === f.id}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-50 ${
                                  f.is_resolved
                                    ? 'bg-warning/10 border-warning/30 text-warning hover:bg-warning/20'
                                    : 'bg-success/10 border-success/30 text-success hover:bg-success/20'
                                }`}
                              >
                                {resolvingId === f.id
                                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  : f.is_resolved
                                    ? <><RotateCcw className="w-3.5 h-3.5" />Reopen</>
                                    : <><CheckCircle2 className="w-3.5 h-3.5" />Mark Resolved</>}
                              </button>
                              <button
                                onClick={() => setSelectedFlag(f)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-all"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Details
                              </button>
                              <button
                                onClick={() => { setActiveTab('flags'); setSearch(f.severity.toLowerCase()); }}
                                className="ml-auto flex items-center gap-1 text-xs text-white/25 hover:text-white/60 transition-colors"
                              >
                                All {f.severity} flags <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── FLAGS ──────────────────────────────────────────────────── */}
          {activeTab === 'flags' && (() => {
            const rows = filter(flags, ['issue_type','user_username','severity','lot_batch_number']);
            return (
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap items-center">
                  {['ALL','CRITICAL','HIGH','MEDIUM','LOW','OPEN','RESOLVED'].map(s=>(
                    <button key={s} onClick={()=>setSearch(s==='ALL'?'':s.toLowerCase())}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                        (s==='ALL'&&!search)||search.toUpperCase()===s?'bg-primary border-primary text-white':'border-white/10 text-white/50 hover:text-white'}`}>
                      {s}
                    </button>
                  ))}
                  <span className="ml-auto text-xs text-white/30">{rows.length} result{rows.length!==1?'s':''}</span>
                </div>
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-white/5"><Th>Severity</Th><Th>Issue</Th><Th>Batch</Th><Th>Reporter</Th><Th>Time</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
                      <tbody className="divide-y divide-white/5">
                        {rows.map(f=>{
                          const m=sevMeta(f.severity);
                          return (
                            <tr key={f.id} className="hover:bg-white/2">
                              <Td><Badge label={f.severity} className={m.cls}/></Td>
                              <td className="px-5 py-3 font-medium">{f.issue_type}</td>
                              <Td mono>{f.lot_batch_number||f.lot.slice(0,16)+'…'}</Td>
                              <td className="px-5 py-3 text-white/70">{f.user_username}</td>
                              <td className="px-5 py-3 text-white/40 text-xs">{timeAgo(f.created_at)}</td>
                              <Td>{f.is_resolved?<Badge label="Resolved" className="text-success border-success/30 bg-success/10"/>:<Badge label="Open" className="text-warning border-warning/30 bg-yellow-500/10"/>}</Td>
                              <td className="px-5 py-3">
                                <button onClick={()=>handleResolveFlag(f.id,f.is_resolved)}
                                  className={`flex items-center gap-1 text-xs font-bold transition-colors ${f.is_resolved?'text-white/40 hover:text-warning':'text-success/70 hover:text-success'}`}>
                                  {f.is_resolved?<><RotateCcw className="w-3.5 h-3.5"/>Unresolve</>:<><CheckCircle2 className="w-3.5 h-3.5"/>Resolve</>}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {!rows.length&&<EmptyRow cols={7} msg="No flags match your search"/>}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            );
          })()}

          {/* ── USERS ──────────────────────────────────────────────────── */}
          {activeTab === 'users' && (() => {
            const rows = filter(users, ['username','email','role']);
            const roleColor: Record<string,string> = { Patient:'text-purple-400 border-purple-400/30 bg-purple-500/10', Pharmacist:'text-primary border-primary/30 bg-primary/10', Distributor:'text-teal-400 border-teal-400/30 bg-teal-500/10', Admin:'text-danger border-danger/30 bg-danger/10' };
            return (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/5"><Th>Username</Th><Th>Email</Th><Th>Role</Th><Th>Status</Th><Th>Joined</Th></tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {rows.map(u=>(
                        <tr key={u.id} className="hover:bg-white/2">
                          <td className="px-5 py-3 font-bold">{u.username}</td>
                          <td className="px-5 py-3 text-white/50">{u.email}</td>
                          <Td><Badge label={u.role} className={roleColor[u.role]||'text-white/40 border-white/10'}/></Td>
                          <Td>{u.is_active?<Badge label="Active" className="text-success border-success/30 bg-success/10"/>:<Badge label="Inactive" className="text-white/40 border-white/10"/>}</Td>
                          <td className="px-5 py-3 text-white/40 text-xs">{new Date(u.date_joined).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {!rows.length&&<EmptyRow cols={5} msg="No users match"/>}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })()}

          {/* ── SUPPLY ORDERS ──────────────────────────────────────────── */}
          {activeTab === 'orders' && (() => {
            const rows = filter(orders, ['pharmacist_name','distributor_name','status','id']);
            return (
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap items-center">
                  {['ALL','PENDING','SHIPPED','DELIVERED','REJECTED'].map(s=>(
                    <button key={s} onClick={()=>setSearch(s==='ALL'?'':s.toLowerCase())}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                        (s==='ALL'&&!search)||search.toUpperCase()===s?'bg-primary border-primary text-white':'border-white/10 text-white/50 hover:text-white'}`}>
                      {s}
                    </button>
                  ))}
                  <span className="ml-auto text-xs text-white/30">{rows.length} order{rows.length!==1?'s':''}</span>
                </div>
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-white/5"><Th>Order ID</Th><Th>Pharmacist</Th><Th>Distributor</Th><Th>Items</Th><Th>Linked Batch</Th><Th>Status</Th><Th>Update Status</Th><Th>Created</Th></tr></thead>
                      <tbody className="divide-y divide-white/5">
                        {rows.map(o=>(
                          <tr key={o.id} className="hover:bg-white/2">
                            <Td mono>{o.id.slice(0,8)}…</Td>
                            <td className="px-5 py-3 font-bold">{o.pharmacist_name}</td>
                            <td className="px-5 py-3 text-white/70">{o.distributor_name}</td>
                            <td className="px-5 py-3 text-white/60">{o.items?.length ?? 0} item{(o.items?.length??0)!==1?'s':''}</td>
                            <td className="px-5 py-3 text-white/50 text-xs font-mono">{o.manifest_batch || '—'}</td>
                            <Td><Badge label={o.status} className={orderStatusCls[o.status]||'text-white/40 border-white/10'}/></Td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-1">
                                <select
                                  defaultValue={o.status}
                                  onChange={e=>handleOrderStatus(o.id, e.target.value as AdminOrder['status'])}
                                  className="bg-white/5 border border-white/10 rounded-lg text-xs text-white/80 px-2 py-1 focus:outline-none focus:border-primary/50"
                                >
                                  {(['PENDING','SHIPPED','DELIVERED','REJECTED'] as const).map(s=>(
                                    <option key={s} value={s} className="bg-surface-dark">{s}</option>
                                  ))}
                                </select>
                                <ChevronDown className="w-3 h-3 text-white/30 -ml-5 pointer-events-none"/>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-white/40 text-xs">{timeAgo(o.created_at)}</td>
                          </tr>
                        ))}
                        {!rows.length&&<EmptyRow cols={8} msg="No orders match"/>}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            );
          })()}

          {/* ── MANIFESTS ──────────────────────────────────────────────── */}
          {activeTab === 'manifests' && (() => {
            const rows = filter(manifests, ['batch_number','id']);
            return (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/5"><Th>UUID</Th><Th>Batch #</Th><Th>Expiry</Th><Th>Trust Score</Th><Th>Signature</Th></tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {rows.map(m=>{
                        const s=Number(m.trust_score); const c=trustCol(s); const exp=new Date(m.expiry_date)<new Date();
                        return (
                          <tr key={m.id} className="hover:bg-white/2">
                            <Td mono>{m.id.slice(0,8)}…</Td>
                            <td className="px-5 py-3 font-bold">{m.batch_number}</td>
                            <td className="px-5 py-3">
                              <span className={exp?'text-danger':'text-white/60'}>{m.expiry_date}</span>
                              {exp&&<Badge label="Expired" className="ml-2 text-danger border-danger/30 bg-danger/10"/>}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${s}%`,backgroundColor:c}}/></div>
                                <span className="font-bold text-sm" style={{color:c}}>{s.toFixed(0)}%</span>
                              </div>
                            </td>
                            <Td>{m.digital_signature?<Badge label="Signed" className="text-success border-success/30 bg-success/10"/>:<Badge label="Unsigned" className="text-white/40 border-white/10"/>}</Td>
                          </tr>
                        );
                      })}
                      {!rows.length&&<EmptyRow cols={5}/>}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })()}

          {/* ── MEDICINES ──────────────────────────────────────────────── */}
          {activeTab === 'medicines' && (() => {
            const rows = filter(medicines, ['name','active_ingredient','dosage_form']);
            return (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/5"><Th>Name</Th><Th>Active Ingredient</Th><Th>Strength</Th><Th>Dosage Form</Th></tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {rows.map(m=>(
                        <tr key={m.id} className="hover:bg-white/2">
                          <td className="px-5 py-3 font-bold">{m.name}</td>
                          <td className="px-5 py-3 text-white/60">{m.active_ingredient}</td>
                          <td className="px-5 py-3 text-white/60">{m.strength}</td>
                          <Td><Badge label={m.dosage_form} className="text-primary border-primary/30 bg-primary/10"/></Td>
                        </tr>
                      ))}
                      {!rows.length&&<EmptyRow cols={4}/>}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })()}

          {/* ── DISTRIBUTORS ───────────────────────────────────────────── */}
          {activeTab === 'distributors' && (() => {
            const rows = filter(distributors, ['name','license_number']);
            return (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/5"><Th>Name</Th><Th>License #</Th><Th>Public Key (preview)</Th></tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {rows.map(d=>(
                        <tr key={d.id} className="hover:bg-white/2">
                          <td className="px-5 py-3 font-bold">{d.name||`Distributor #${d.id}`}</td>
                          <Td mono>{d.license_number||'—'}</Td>
                          <Td mono>{d.public_key.slice(0,24)}…</Td>
                        </tr>
                      ))}
                      {!rows.length&&<EmptyRow cols={3}/>}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })()}

          {/* ── RECEIPTS ───────────────────────────────────────────────── */}
          {activeTab === 'receipts' && (() => {
            const rows = filter(receipts, ['user_username','lot_batch_number']);
            return (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/5"><Th>Batch</Th><Th>Pharmacist</Th><Th>Location</Th><Th>Received</Th></tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {rows.map(r=>(
                        <tr key={r.id} className="hover:bg-white/2">
                          <Td mono>{r.lot_batch_number||String(r.lot||'—').slice(0,16)+'…'}</Td>
                          <td className="px-5 py-3 font-bold">{r.user_username||'—'}</td>
                          <td className="px-5 py-3 text-white/50 text-xs">{r.location_coord?`${r.location_coord.lat.toFixed(3)}, ${r.location_coord.lng.toFixed(3)}`:'—'}</td>
                          <td className="px-5 py-3 text-white/40 text-xs">{r.created_at ? timeAgo(r.created_at) : '—'}</td>
                        </tr>
                      ))}
                      {!rows.length&&<EmptyRow cols={4} msg="No receipt events found in the system."/>}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })()}

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
