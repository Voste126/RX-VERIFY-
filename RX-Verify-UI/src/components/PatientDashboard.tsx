import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, ShieldCheck, QrCode, Flag, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import Icon from './Icon';
import { authService } from '../services/auth';
import { api } from '../services/api';
import { fetchMyFlags, createFlag, type CrowdFlag, type FlagSeverity } from '../services/flags';
import { useQRScanner } from '../hooks/useQRScanner';

// ─── Types ────────────────────────────────────────────────────────────────────
// CrowdFlag is imported from services/flags.ts (matches backend CrowdFlagSerializer)

const ISSUE_TYPES = [
  'Counterfeit Suspected',
  'Quality Issue',
  'Packaging Damage',
  'Adverse Reaction',
  'General Concern',
];

interface QRVerificationResult {
  lot_id?: string;
  batch_number: string;
  medicine_name?: string;
  medicine?: { name: string; active_ingredient: string; strength: string; dosage_form: string };
  distributor?: string;
  expiry_date: string;
  trust_score: number | string;
  trust_status?: 'SAFE' | 'CAUTION' | 'WARNING';
  is_authentic?: boolean;
  status?: string;
  verification_message?: string;
  flags_count?: number;
}

interface DashboardStats {
  totalFlags: number;
  resolvedFlags: number;
  pendingFlags: number;
  verificationsToday: number;
}

type ActiveTab = 'dashboard' | 'verify' | 'report' | 'myflags';

const RISK_OPTIONS: { value: FlagSeverity; label: string; icon: string; color: string; desc: string }[] = [
  { value: 'LOW',      label: 'Low Risk',    icon: 'info',     color: 'border-blue-400/50 bg-blue-500/10 text-blue-400',       desc: 'Cosmetic damage or label discoloration.' },
  { value: 'MEDIUM',   label: 'Medium Risk', icon: 'warning',  color: 'border-yellow-400/50 bg-yellow-500/10 text-yellow-400', desc: 'Packaging compromise or missing seals.' },
  { value: 'HIGH',     label: 'High Risk',   icon: 'gpp_bad',  color: 'border-orange-400/50 bg-orange-500/10 text-orange-400', desc: 'Suspected forgery or adverse reaction.' },
  { value: 'CRITICAL', label: 'Critical',    icon: 'dangerous', color: 'border-red-500/50 bg-red-500/10 text-red-400',         desc: 'Confirmed counterfeit or lethal threat.' },
];

const OBS_TAGS = ['Broken Seal', 'Suspected Forgery', 'Label Typo', 'Wrong Color/Shape', 'Missing Batch #', 'Adverse Reaction'];

// ─── Helper: Status badge ─────────────────────────────────────────────────────
const TrustBadge: React.FC<{ status?: string; score?: number | string }> = ({ status, score }) => {
  const s = String(status ?? '').toUpperCase();
  const cfg =
    s === 'SAFE'    ? 'bg-[#00C853]/20 text-[#00C853] border-[#00C853]/30' :
    s === 'CAUTION' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
    s === 'VERIFIED'? 'bg-[#00C853]/20 text-[#00C853] border-[#00C853]/30' :
                     'bg-red-500/20 text-red-400 border-red-500/30';
  const label = s || 'UNKNOWN';
  return (
    <span className={`px-3 py-1 rounded-full border font-bold text-xs ${cfg}`}>
      {label}{score !== undefined ? ` · ${score}%` : ''}
    </span>
  );
};

const flagColor = (type: string) => {
  switch (type) {
    case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'HIGH':     return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'MEDIUM':   return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    default:         return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
};

// ─── Main Component ────────────────────────────────────────────────────────────
const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Stats
  const [stats, setStats] = useState<DashboardStats>({
    totalFlags: 0, resolvedFlags: 0, pendingFlags: 0, verificationsToday: 0,
  });

  // ── Verify state ──────────────────────────────────────────────────────────
  const [manifestId, setManifestId] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<QRVerificationResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // useQRScanner called at top level (Rules of Hooks).
  // onDetectedRef lets the stable onDetected callback call handleVerify
  // even though handleVerify is defined further down.
  const onDetectedRef = React.useRef<(data: string) => void>(() => {});
  const { videoRef, cameraActive, cameraError, startCamera, stopCamera } = useQRScanner({
    onDetected: (data: string) => onDetectedRef.current(data),
  });

  // ── Report state ──────────────────────────────────────────────────────────
  const [selectedRisk, setSelectedRisk] = useState<FlagSeverity | null>(null);
  const [selectedIssueType, setSelectedIssueType] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [description, setDescription] = useState('');
  const [reportManifestId, setReportManifestId] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // ── My Flags state ────────────────────────────────────────────────────────
  const [myFlags, setMyFlags] = useState<CrowdFlag[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(false);

  const location = useLocation();

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/login'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'Patient') { navigate('/'); return; }
    setUser(parsed);
    loadFlags();
  }, [location.key]);

  useEffect(() => {
    if (activeTab !== 'verify') stopCamera();
  }, [activeTab]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const loadFlags = async () => {
    setFlagsLoading(true);
    try {
      const data = await fetchMyFlags();
      setMyFlags(data);
      setStats({
        totalFlags: data.length,
        resolvedFlags: data.filter(f => f.is_resolved).length,
        pendingFlags: data.filter(f => !f.is_resolved).length,
        verificationsToday: 0,
      });
    } catch { setMyFlags([]); }
    finally { setFlagsLoading(false); setLoading(false); }
  };

  const handleVerify = async (id?: string) => {
    const target = id ?? manifestId;
    if (!target.trim()) return;
    setVerifyLoading(true);
    setVerifyError(null);
    setVerifyResult(null);
    try {
      const res = await api.get(`/manifests/${target.trim()}/verify-qr/`);
      setVerifyResult(res.data);
      stopCamera();
    } catch (err: any) {
      setVerifyError(err.response?.data?.detail ?? 'Manifest not found. Check the Batch ID and try again.');
    } finally { setVerifyLoading(false); }
  };

  // Wire the latest handleVerify into the stable ref after it's defined
  onDetectedRef.current = (data: string) => {
    setManifestId(data);
    handleVerify(data);
  };


  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRisk || !reportManifestId.trim()) return;
    setReportLoading(true);
    setReportError(null);
    try {
      const tags = [...selectedTags];
      if (customTag.trim()) tags.push(customTag.trim());
      const issue = selectedIssueType || 'General Concern';
      const fullDesc = tags.length > 0 ? `[${tags.join(', ')}] ${description}` : description;
      await createFlag({
        lot: reportManifestId.trim(),
        severity: selectedRisk,
        reporter_type: 'Patient',
        issue_type: issue,
        description: fullDesc,
      });
      setReportSuccess(true);
      setSelectedRisk(null);
      setSelectedIssueType('');
      setSelectedTags([]);
      setCustomTag('');
      setDescription('');
      setReportManifestId('');
      await loadFlags();
    } catch (err: any) {
      const errData = err.response?.data;
      const detail = typeof errData === 'string'
        ? errData
        : errData?.detail ?? errData?.lot?.[0] ?? 'Failed to submit report. Please try again.';
      setReportError(detail);
    } finally { setReportLoading(false); }
  };

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-[#0a0e1a] h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon name="hourglass_empty" className="text-6xl text-[#0055FF] animate-spin" />
          <p className="mt-4 text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#0a0e1a] text-white font-display h-screen flex overflow-hidden">

      {/* ══════════════════════════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════════════════════════ */}
      <aside className="w-64 bg-[#151923] border-r border-gray-700 flex flex-col h-full shrink-0 z-20">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="size-10 bg-[#0055FF]/20 rounded-xl flex items-center justify-center border border-[#0055FF]/30">
            <Icon name="health_and_safety" className="text-[#0055FF] text-2xl" />
          </div>
          <div>
            <h1 className="text-white text-lg font-bold leading-tight tracking-tight">RxVerify Lite</h1>
            <p className="text-gray-400 text-xs font-medium">Patient Portal</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-4 py-2 flex flex-col gap-1 overflow-y-auto">
          {([
            { id: 'dashboard', label: 'Dashboard',       icon: 'dashboard'       },
            { id: 'verify',    label: 'Verify Medicine', icon: 'qr_code_scanner' },
            { id: 'report',    label: 'Report Suspect',  icon: 'report_problem'  },
            { id: 'myflags',   label: 'My Reports',      icon: 'fact_check'      },
          ] as { id: ActiveTab; label: string; icon: string }[]).map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                activeTab === item.id
                  ? 'bg-[#0055FF]/20 text-[#0055FF] border border-[#0055FF]/30'
                  : 'text-gray-400 hover:bg-[#0a0e1a]/50 hover:text-white'
              }`}
            >
              <Icon name={item.icon} />
              <span className="text-sm font-medium">{item.label}</span>
              {item.id === 'myflags' && stats.pendingFlags > 0 && (
                <span className="ml-auto bg-[#FF6B00] text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {stats.pendingFlags}
                </span>
              )}
            </button>
          ))}

          {/* Quick actions divider */}
          <div className="mt-6 mb-2 px-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quick Actions</p>
          </div>
          <button
            onClick={() => setActiveTab('verify')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-[#0a0e1a]/50 text-left transition-colors"
          >
            <div className="size-8 rounded-lg bg-[#0055FF]/20 text-[#0055FF] flex items-center justify-center border border-[#0055FF]/30">
              <Icon name="qr_code_scanner" className="text-lg" />
            </div>
            <span className="text-sm font-medium">Scan QR Code</span>
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-[#0a0e1a]/50 text-left transition-colors"
          >
            <div className="size-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <Icon name="report_problem" className="text-lg" />
            </div>
            <span className="text-sm font-medium">Report Issue</span>
          </button>
        </nav>

        {/* User profile + logout */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#0a0e1a]/50 cursor-pointer transition-colors mb-2">
            <div className="size-10 rounded-full bg-gradient-to-br from-purple-500 to-[#0055FF] flex items-center justify-center text-white font-bold text-sm">
              {user?.username?.charAt(0).toUpperCase() ?? 'P'}
            </div>
            <div className="flex flex-col overflow-hidden flex-1">
              <p className="text-sm font-bold text-white truncate">{user?.username ?? 'Patient'}</p>
              <p className="text-xs text-gray-400 truncate">Patient</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors text-sm font-bold"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* Top header */}
        <header className="h-16 shrink-0 bg-[#151923]/80 backdrop-blur-md border-b border-gray-700 flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">
              {activeTab === 'dashboard' && 'Patient Overview'}
              {activeTab === 'verify'    && 'Verify Medicine'}
              {activeTab === 'report'    && 'Report Suspect Product'}
              {activeTab === 'myflags'   && 'My Reports'}
            </h2>
            {stats.pendingFlags > 0 && activeTab === 'dashboard' && (
              <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats.pendingFlags} pending review
              </span>
            )}
          </div>
          <div className="text-sm text-gray-400">
            Welcome, <span className="text-white font-semibold">{user?.first_name || user?.username}</span>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-8">

          {/* ══════════════════════════════════════════════════════════════
              TAB: DASHBOARD
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'dashboard' && (
            <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
              {/* Stats grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Reports',   value: stats.totalFlags,        icon: 'flag',         color: 'text-[#0055FF]',  hoverBorder: 'hover:border-[#0055FF]/50' },
                  { label: 'Under Review',    value: stats.pendingFlags,      icon: 'pending',      color: 'text-orange-400', hoverBorder: 'hover:border-orange-400/50' },
                  { label: 'Resolved',        value: stats.resolvedFlags,     icon: 'check_circle', color: 'text-[#00C853]',  hoverBorder: 'hover:border-[#00C853]/50' },
                  { label: 'Verifications',   value: stats.verificationsToday, icon: 'qr_code_scanner', color: 'text-purple-400', hoverBorder: 'hover:border-purple-400/50' },
                ].map(stat => (
                  <div
                    key={stat.label}
                    className={`bg-[#151923] p-5 rounded-2xl border border-gray-700 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group transition-all ${stat.hoverBorder}`}
                  >
                    <div className={`absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                      <Icon name={stat.icon} className={`text-6xl ${stat.color}`} />
                    </div>
                    <div className={`flex items-center gap-2 mb-1`}>
                      <Icon name={stat.icon} className={`${stat.color} text-xl`} />
                      <p className="text-sm font-semibold text-gray-400">{stat.label}</p>
                    </div>
                    <p className="text-3xl font-extrabold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Flags Feed */}
                <div className="bg-[#151923] rounded-2xl border border-gray-700 shadow-sm flex flex-col overflow-hidden">
                  <div className="p-5 border-b border-gray-700 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Flag className="w-5 h-5 text-orange-400" />
                        Recent Reports
                      </h3>
                      <p className="text-xs text-gray-400">Your submitted product flags</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('myflags')}
                      className="text-sm text-[#0055FF] hover:text-blue-400 font-medium"
                    >
                      View All
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto max-h-80">
                    {flagsLoading ? (
                      <div className="p-12 text-center">
                        <Icon name="hourglass_empty" className="text-5xl text-gray-600 animate-spin mx-auto" />
                      </div>
                    ) : myFlags.length === 0 ? (
                      <div className="p-12 text-center">
                        <Flag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">No reports submitted yet</p>
                        <button
                          onClick={() => setActiveTab('report')}
                          className="mt-3 text-xs text-[#0055FF] font-bold hover:underline"
                        >
                          Report a product →
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-700">
                        {myFlags.slice(0, 6).map(flag => (
                          <div key={flag.id} className="p-4 hover:bg-[#0a0e1a]/50 transition-colors flex items-start gap-3">
                            <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                              flag.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                              flag.severity === 'HIGH'     ? 'bg-orange-500/20 text-orange-400' :
                              flag.severity === 'MEDIUM'   ? 'bg-yellow-500/20 text-yellow-400' :
                                                             'bg-blue-500/20 text-blue-400'
                            }`}>
                              <Icon name={
                                flag.severity === 'CRITICAL' ? 'dangerous' :
                                flag.severity === 'HIGH'     ? 'gpp_bad' :
                                flag.severity === 'MEDIUM'   ? 'warning' : 'info'
                              } />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${flagColor(flag.severity)}`}>
                                  {flag.severity}
                                </span>
                                <span className="text-[10px] text-gray-500 truncate">{flag.issue_type}</span>
                              </div>
                              <p className="text-xs text-gray-300 truncate">{flag.description || '—'}</p>
                              <p className="text-[10px] text-gray-500 mt-1">{formatDate(flag.created_at)}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                              flag.is_resolved
                                ? 'bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/30'
                                : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            }`}>
                              {flag.is_resolved ? 'Resolved' : 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Verify card */}
                <div className="bg-[#151923] rounded-2xl border border-gray-700 shadow-sm p-6 flex flex-col gap-5">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-[#0055FF]" />
                    Quick Verify
                  </h3>
                  <p className="text-sm text-gray-400">
                    Enter a Batch UUID to instantly check medicine authenticity and trust score.
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={manifestId}
                      onChange={e => setManifestId(e.target.value)}
                      placeholder="Paste Batch UUID..."
                      className="flex-1 px-4 py-3 bg-[#0a0e1a] border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-[#0055FF]/50 focus:border-[#0055FF]/50 placeholder-gray-600"
                      onKeyDown={e => e.key === 'Enter' && handleVerify()}
                    />
                    <button
                      onClick={() => handleVerify()}
                      disabled={!manifestId.trim() || verifyLoading}
                      className="px-5 py-3 rounded-lg bg-[#0055FF] hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center gap-2"
                    >
                      {verifyLoading
                        ? <Icon name="hourglass_empty" className="animate-spin" />
                        : <Icon name="search" />}
                      Verify
                    </button>
                  </div>

                  {verifyError && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                      <Icon name="error" className="text-red-400 mt-0.5" />
                      <p className="text-sm text-red-300">{verifyError}</p>
                    </div>
                  )}

                  {verifyResult && (
                    <div className={`p-4 rounded-xl border ${
                      String(verifyResult.trust_status ?? verifyResult.status ?? '').startsWith('SAF') || String(verifyResult.status ?? '').startsWith('VER')
                        ? 'bg-[#00C853]/10 border-[#00C853]/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}>
                      <div className="flex items-start gap-3 mb-3">
                        <Icon
                          name={verifyResult.is_authentic !== false ? 'verified' : 'gpp_bad'}
                          className={verifyResult.is_authentic !== false ? 'text-[#00C853] text-xl' : 'text-red-400 text-xl'}
                        />
                        <div>
                          <p className="font-bold text-white text-sm">
                            {verifyResult.medicine?.name || verifyResult.medicine_name || 'Medicine'}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">Batch: {verifyResult.batch_number}</p>
                        </div>
                        <div className="ml-auto">
                          <TrustBadge
                            status={verifyResult.trust_status ?? verifyResult.status}
                            score={verifyResult.trust_score as number}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between"><span className="text-gray-400">Expiry:</span><span className="font-semibold">{verifyResult.expiry_date}</span></div>
                        {verifyResult.distributor && (
                          <div className="flex justify-between"><span className="text-gray-400">Distributor:</span><span className="font-semibold truncate ml-1">{verifyResult.distributor}</span></div>
                        )}
                      </div>
                      <button
                        onClick={() => { setReportManifestId(verifyResult.lot_id ?? ''); setActiveTab('report'); }}
                        className="mt-3 w-full py-1.5 px-3 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <Icon name="report_problem" className="text-sm" />
                        Report this batch
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setActiveTab('verify')}
                    className="w-full py-3 px-4 rounded-xl bg-[#0055FF]/10 border border-[#0055FF]/30 text-[#0055FF] font-bold hover:bg-[#0055FF]/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon name="qr_code_scanner" />
                    Open Full Scanner
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB: VERIFY MEDICINE
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'verify' && (
            <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-6">
              {/* Left: scanner */}
              <div className="flex-1 flex flex-col gap-6">
                <div className="bg-[#151923] rounded-2xl border border-gray-700 overflow-hidden">
                  {/* Camera view — video is ALWAYS in DOM so videoRef is ready */}
                  <div className="relative bg-black aspect-video max-h-72 flex items-center justify-center overflow-hidden">
                    {/* Video element always mounted — just hidden when inactive */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        cameraActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />

                    {/* Scan frame overlay — shown when active */}
                    {cameraActive && (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-48 h-48 border-2 border-[#0055FF] rounded-xl relative">
                            <span className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#0055FF] rounded-tl-lg" />
                            <span className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#0055FF] rounded-tr-lg" />
                            <span className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#0055FF] rounded-bl-lg" />
                            <span className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#0055FF] rounded-br-lg" />
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-[#0055FF]/60 animate-[scan_2s_linear_infinite]" />
                            </div>
                          </div>
                        </div>
                        <div className="absolute bottom-3 flex justify-center w-full">
                          <p className="text-xs text-white/70 bg-black/60 px-3 py-1 rounded-full">Point at QR code</p>
                        </div>
                      </>
                    )}

                    {/* Idle placeholder — shown when camera is off */}
                    {!cameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8">
                        <div className="size-16 rounded-full bg-[#0055FF]/10 border border-[#0055FF]/20 flex items-center justify-center">
                          <Icon name="qr_code_scanner" className="text-[#0055FF] text-4xl" />
                        </div>
                        <p className="text-gray-300 text-sm font-medium">Camera not active</p>
                        {cameraError && <p className="text-red-400 text-xs text-center max-w-xs">{cameraError}</p>}
                        <button
                          onClick={startCamera}
                          className="mt-1 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0055FF] hover:bg-blue-600 text-white font-bold text-sm transition-all shadow-lg shadow-[#0055FF]/20"
                        >
                          <Icon name="camera_alt" />
                          Start QR Scanner
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Manual input */}
                  <div className="p-5 space-y-4 border-t border-gray-700">
                    {cameraActive && (
                      <button
                        onClick={stopCamera}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm transition-all"
                      >
                        <Icon name="stop_circle" />
                        Stop Camera
                      </button>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-gray-700" />
                      <span className="text-xs text-gray-500">or enter manually</span>
                      <div className="flex-1 h-px bg-gray-700" />
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={manifestId}
                        onChange={e => setManifestId(e.target.value)}
                        placeholder="Paste Batch UUID (e.g. 494466b3-0f94-...)"
                        className="flex-1 px-4 py-3 bg-[#0a0e1a] border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-[#0055FF]/50 focus:border-[#0055FF]/50 placeholder-gray-600"
                        onKeyDown={e => e.key === 'Enter' && handleVerify()}
                      />
                      <button
                        onClick={() => handleVerify()}
                        disabled={!manifestId.trim() || verifyLoading}
                        className="flex items-center gap-2 px-5 py-3 rounded-lg bg-[#0055FF] hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-sm transition-all"
                      >
                        {verifyLoading ? <Icon name="hourglass_empty" className="animate-spin" /> : <Icon name="search" />}
                        Verify
                      </button>
                    </div>
                  </div>
                </div>

                {verifyError && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                    <Icon name="error" className="text-red-400 mt-0.5" />
                    <p className="text-sm text-red-300">{verifyError}</p>
                  </div>
                )}
              </div>

              {/* Right: result */}
              <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0">
                {verifyResult ? (
                  <div className="bg-[#151923] rounded-2xl border border-gray-700 overflow-hidden">
                    <div className={`h-1.5 w-full ${
                      String(verifyResult.trust_status ?? verifyResult.status ?? '').startsWith('SAF') ||
                      String(verifyResult.status ?? '').startsWith('VER') ? 'bg-[#00C853]' : 'bg-red-500'
                    }`} />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div>
                          <h3 className="font-bold text-white">
                            {verifyResult.medicine?.name || verifyResult.medicine_name || 'Unknown Medicine'}
                          </h3>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">Batch: {verifyResult.batch_number}</p>
                        </div>
                        <TrustBadge status={verifyResult.trust_status ?? verifyResult.status} score={verifyResult.trust_score as number} />
                      </div>

                      <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
                        verifyResult.is_authentic !== false
                          ? 'bg-[#00C853]/10 border border-[#00C853]/30'
                          : 'bg-red-500/10 border border-red-500/30'
                      }`}>
                        <Icon name={verifyResult.is_authentic !== false ? 'verified' : 'gpp_bad'}
                          className={verifyResult.is_authentic !== false ? 'text-[#00C853]' : 'text-red-400'} />
                        <p className={`text-sm font-semibold ${verifyResult.is_authentic !== false ? 'text-[#00C853]' : 'text-red-400'}`}>
                          {verifyResult.verification_message ?? (verifyResult.is_authentic !== false ? 'Authentic & Verified' : 'Verification Failed')}
                        </p>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        {verifyResult.medicine && (
                          <>
                            {[
                              { label: 'Active Ingredient', value: verifyResult.medicine.active_ingredient },
                              { label: 'Strength',          value: verifyResult.medicine.strength },
                              { label: 'Dosage Form',       value: verifyResult.medicine.dosage_form },
                            ].map(({ label, value }) => (
                              <div key={label} className="flex justify-between border-b border-gray-700 pb-1">
                                <span className="text-gray-400">{label}:</span>
                                <span className="text-white font-semibold">{value}</span>
                              </div>
                            ))}
                          </>
                        )}
                        <div className="flex justify-between border-b border-gray-700 pb-1">
                          <span className="text-gray-400">Expiry Date:</span>
                          <span className="text-white font-semibold">{verifyResult.expiry_date}</span>
                        </div>
                        {verifyResult.distributor && (
                          <div className="flex justify-between border-b border-gray-700 pb-1">
                            <span className="text-gray-400">Distributor:</span>
                            <span className="text-white font-semibold text-right">{verifyResult.distributor}</span>
                          </div>
                        )}
                        {verifyResult.flags_count !== undefined && verifyResult.flags_count > 0 && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                            <Icon name="flag" className="text-orange-400" />
                            <p className="text-xs text-orange-400 font-semibold">
                              {verifyResult.flags_count} flag{verifyResult.flags_count > 1 ? 's' : ''} reported
                            </p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => { setReportManifestId(verifyResult.lot_id ?? ''); setActiveTab('report'); }}
                        className="w-full py-2 px-4 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <Icon name="report_problem" />
                        Report this batch
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#151923] rounded-2xl border border-gray-700 p-8 text-center flex flex-col items-center gap-4">
                    <div className="size-16 rounded-full bg-[#0055FF]/10 border border-[#0055FF]/20 flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-[#0055FF]" />
                    </div>
                    <div>
                      <p className="font-bold text-white">Ready to Verify</p>
                      <p className="text-sm text-gray-400 mt-1">Scan a QR code or enter a Batch UUID to see safety information.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB: REPORT
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'report' && (
            <div className="max-w-2xl mx-auto flex flex-col gap-6">
              {reportSuccess && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[#00C853]/10 border border-[#00C853]/30">
                  <CheckCircle2 className="w-6 h-6 text-[#00C853] shrink-0" />
                  <div>
                    <p className="font-bold text-[#00C853]">Report Submitted!</p>
                    <p className="text-sm text-gray-300">Thank you. Our team will review your report shortly.</p>
                  </div>
                  <button onClick={() => setReportSuccess(false)} className="ml-auto text-gray-400 hover:text-white">
                    <Icon name="close" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmitReport} className="flex flex-col gap-5">
                {/* Batch ID */}
                <div className="bg-[#151923] rounded-2xl border border-gray-700 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon name="tag" className="text-[#0055FF]" />
                    <h3 className="font-bold">Batch ID</h3>
                    <span className="ml-auto text-xs text-red-400 font-semibold">REQUIRED</span>
                  </div>
                  <input
                    type="text"
                    value={reportManifestId}
                    onChange={e => setReportManifestId(e.target.value)}
                    placeholder="Enter Lot Manifest UUID from medicine packaging…"
                    required
                    className="w-full px-4 py-3 bg-[#0a0e1a] border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-[#0055FF]/50 focus:border-[#0055FF]/50 placeholder-gray-600"
                  />
                </div>

                {/* Issue Type */}
                <div className="bg-[#151923] rounded-2xl border border-gray-700 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon name="category" className="text-[#0055FF]" />
                    <h3 className="font-bold">Issue Type</h3>
                    <span className="ml-auto text-xs text-gray-500 font-semibold">OPTIONAL</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ISSUE_TYPES.map(it => (
                      <button
                        key={it}
                        type="button"
                        onClick={() => setSelectedIssueType(prev => prev === it ? '' : it)}
                        className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                          selectedIssueType === it
                            ? 'bg-[#0055FF] border-[#0055FF] text-white'
                            : 'border-gray-700 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {it}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assessment Level */}
                <div className="bg-[#151923] rounded-2xl border border-gray-700 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Icon name="bar_chart" className="text-[#0055FF]" />
                    <h3 className="font-bold">Assessment Level</h3>
                    <span className="ml-auto text-xs text-red-400 font-semibold">REQUIRED</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {RISK_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedRisk(opt.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          selectedRisk === opt.value
                            ? `${opt.color} scale-[0.98]`
                            : 'border-gray-700 bg-[#0a0e1a] hover:border-gray-600'
                        }`}
                      >
                        <Icon name={opt.icon} className="text-2xl mb-2" />
                        <p className="font-bold text-sm text-white">{opt.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Observation Tags */}
                <div className="bg-[#151923] rounded-2xl border border-gray-700 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Icon name="label" className="text-[#0055FF]" />
                    <h3 className="font-bold">Observation Tags</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {OBS_TAGS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                          selectedTags.includes(tag)
                            ? 'bg-[#0055FF] border-[#0055FF] text-white'
                            : 'border-gray-700 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={customTag}
                    onChange={e => setCustomTag(e.target.value)}
                    placeholder="+ Add custom tag"
                    className="w-full px-3 py-2 bg-[#0a0e1a] border border-dashed border-gray-600 focus:border-[#0055FF] rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none"
                  />
                </div>

                {/* Incident Details */}
                <div className="bg-[#151923] rounded-2xl border border-gray-700 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon name="description" className="text-[#0055FF]" />
                    <h3 className="font-bold">Incident Details</h3>
                  </div>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe the anomaly in detail. Include batch numbers if legible, expiration dates, and the location of purchase…"
                    maxLength={500}
                    rows={5}
                    className="w-full px-4 py-3 bg-[#0a0e1a] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:ring-2 focus:ring-[#0055FF]/50 focus:border-[#0055FF]/50 resize-none focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 text-right">{description.length}/500</p>
                </div>

                {reportError && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                    <Icon name="error" className="text-red-400 mt-0.5" />
                    <p className="text-sm text-red-300">{reportError}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Icon name="shield" className="text-[#00C853]" />
                    Secure encrypted submission
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setSelectedRisk(null); setSelectedTags([]); setDescription(''); setReportManifestId(''); }}
                      className="px-5 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-all font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedRisk || !reportManifestId.trim() || reportLoading}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0055FF] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-[#0055FF]/20"
                    >
                      {reportLoading ? <Icon name="hourglass_empty" className="animate-spin" /> : <Icon name="send" />}
                      Submit Report
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB: MY FLAGS
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'myflags' && (
            <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-400 text-sm">Track the status of all your submitted reports.</p>
                <button
                  onClick={loadFlags}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#151923] border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm font-medium transition-all"
                >
                  <Icon name="refresh" className={flagsLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>

              {flagsLoading ? (
                <div className="flex items-center justify-center py-24 gap-3 text-gray-500">
                  <Icon name="hourglass_empty" className="animate-spin text-2xl" />
                  Loading reports…
                </div>
              ) : myFlags.length === 0 ? (
                <div className="bg-[#151923] rounded-2xl border border-gray-700 p-16 flex flex-col items-center gap-4 text-center">
                  <div className="size-16 rounded-full bg-gray-800 flex items-center justify-center">
                    <Flag className="w-8 h-8 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-300">No reports yet</p>
                    <p className="text-sm text-gray-500 mt-1">Your submitted suspect product reports will appear here.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('report')}
                    className="px-6 py-2.5 rounded-lg bg-[#0055FF] hover:bg-blue-600 text-white font-bold text-sm transition-all"
                  >
                    Report a Product
                  </button>
                </div>
              ) : (
                <div className="bg-[#151923] rounded-2xl border border-gray-700 overflow-hidden">
                  <div className="divide-y divide-gray-700">
                    {myFlags.map(flag => (
                      <div key={flag.id} className="p-4 hover:bg-[#0a0e1a]/50 transition-colors flex items-center gap-4">
                        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                          flag.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                          flag.severity === 'HIGH'     ? 'bg-orange-500/20 text-orange-400' :
                          flag.severity === 'MEDIUM'   ? 'bg-yellow-500/20 text-yellow-400' :
                                                         'bg-blue-500/20 text-blue-400'
                        }`}>
                          <Icon name={
                            flag.severity === 'CRITICAL' ? 'dangerous' :
                            flag.severity === 'HIGH'     ? 'gpp_bad' :
                            flag.severity === 'MEDIUM'   ? 'warning' : 'info'
                          } />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${flagColor(flag.severity)}`}>
                              {flag.severity}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">{flag.issue_type}</span>
                            {flag.lot_batch_number && (
                              <span className="text-[10px] text-gray-500 font-mono">
                                Batch: {flag.lot_batch_number}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 truncate">{flag.description || 'No description provided'}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{formatDate(flag.created_at)}</p>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shrink-0 ${
                          flag.is_resolved
                            ? 'bg-[#00C853]/10 border-[#00C853]/30 text-[#00C853]'
                            : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                        }`}>
                          {flag.is_resolved ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {flag.is_resolved ? 'Resolved' : 'Under Review'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Scan-line keyframe */}
      <style>{`
        @keyframes scan {
          0%   { transform: translateY(-96px); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(96px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default PatientDashboard;
