import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Truck, ClipboardCheck, PlusCircle, Loader2, QrCode, CheckCircle, 
  AlertCircle, TrendingUp, Activity, Shield, LogOut, Search, Flag, FileText,
  X, CheckCircle2, Camera, StopCircle, Receipt, Lock, LockOpen, AlertTriangle
} from 'lucide-react';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import Icon from './Icon';
import ErrorModal from './ErrorModal';
import { 
  createOrder, 
  getPharmacistOrders,
  verifyReceipt,
  getOrderManifest,
  type SupplyOrder, type VerifyReceiptResponse, type ManifestDetails
} from '../services/orders';
import { createFlag, type FlagSeverity } from '../services/flags';
import { getReceiptEvents, createReceiptEvent, type ReceiptEvent as ReceiptEventType } from '../services/receipts';
import { useQRScanner } from '../hooks/useQRScanner';
import { api } from '../services/api';
import TrustGauge from './TrustGauge';

// TypeScript Interfaces
interface ReceiptEvent {
  id: string;
  location_coord: { lat: number; lng: number };
  user: string;
  lot: string;
  lot_batch_number?: string;
  lot_medicine_name?: string;
  created_at: string;
}

interface Distributor {
  id: string;
  name: string;
}

interface Medicine {
  id: string;
  name: string;
  active_ingredient: string;
  strength: string;
}

interface DashboardStats {
  totalReceipts: number;
  totalOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  integrityScore: number;
}

const PharmacistInventoryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'verify' | 'report' | 'receipts' | 'orders'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Data state
  const [receipts, setReceipts] = useState<ReceiptEvent[]>([]);
  const [orders, setOrders] = useState<SupplyOrder[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalReceipts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    integrityScore: 98
  });
  
  // Modal states
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedOrderForVerify, setSelectedOrderForVerify] = useState<SupplyOrder | null>(null);

  // ── Verify Batch tab state ─────────────────────────────────────────────────
  const [verifyBatchId, setVerifyBatchId] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyQRResult, setVerifyQRResult] = useState<null | {
    lot_id?: string; batch_number: string;
    medicine?: { name: string; active_ingredient: string; strength: string; dosage_form: string };
    medicine_name?: string; distributor?: string; expiry_date: string;
    trust_score: number | string; trust_status?: string;
    is_authentic?: boolean; verification_message?: string; flags_count?: number;
  }>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [receiptResult, setReceiptResult] = useState<VerifyReceiptResponse | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // ── Receipts log state ─────────────────────────────────────────────────────
  const [receiptsLog, setReceiptsLog] = useState<ReceiptEventType[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  // useQRScanner must be called at the top level (Rules of Hooks).
  // We use a ref so onDetected can call handleVerifyBatch even though
  // handleVerifyBatch is defined later in the function body.
  const onDetectedRef = React.useRef<(data: string) => void>(() => {});
  const { videoRef, cameraActive, cameraError, startCamera, stopCamera } = useQRScanner({
    onDetected: (data: string) => onDetectedRef.current(data),
  });

  // ── Report Issue tab state ─────────────────────────────────────────────────
  const ISSUE_TYPES = ['Counterfeit Suspected','Quality Issue','Packaging Damage','Wrong Medicine','Missing Seal','General Concern'];
  const ISSUE_TAGS  = ['Broken Seal','Suspected Forgery','Label Discrepancy','Wrong Color/Shape','Missing Batch #','Adverse Reaction'];
  const RISK_OPTIONS: { value: FlagSeverity; label: string; color: string; desc: string }[] = [
    { value: 'LOW',      label: 'Low Risk',   color: 'border-blue-400/50 bg-blue-500/10 text-blue-400',     desc: 'Cosmetic damage or minor label issue.' },
    { value: 'MEDIUM',   label: 'Medium',     color: 'border-yellow-400/50 bg-yellow-500/10 text-yellow-400', desc: 'Packaging compromise or missing seals.' },
    { value: 'HIGH',     label: 'High Risk',  color: 'border-orange-400/50 bg-orange-500/10 text-orange-400', desc: 'Suspected forgery or adverse reaction.' },
    { value: 'CRITICAL', label: 'Critical',   color: 'border-red-500/50 bg-red-500/10 text-red-400',         desc: 'Confirmed counterfeit or lethal threat.' },
  ];
  const [selectedRisk, setSelectedRisk] = useState<FlagSeverity | null>(null);
  const [selectedIssueType, setSelectedIssueType] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reportDescription, setReportDescription] = useState('');
  const [reportBatchId, setReportBatchId] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Form states
  const [selectedDistributor, setSelectedDistributor] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [scannedUuid, setScannedUuid] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  
  // ── Digital Bill of Lading states ──────────────────────────────────────────
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [inspectingOrder, setInspectingOrder] = useState<SupplyOrder | null>(null);
  const [manifestDetails, setManifestDetails] = useState<ManifestDetails | null>(null);
  const [scannedPhysicalUuid, setScannedPhysicalUuid] = useState('');
  const [verificationMatch, setVerificationMatch] = useState<'match' | 'mismatch' | null>(null);
  const [locked, setLocked] = useState(true);

  // Scanner for Inspect Modal
  const onInspectDetectedRef = React.useRef<(data: string) => void>(() => {});
  const { 
    videoRef: inspectVideoRef, 
    cameraActive: inspectCameraActive, 
    cameraError: inspectCameraError, 
    startCamera: inspectStartCamera, 
    stopCamera: inspectStopCamera 
  } = useQRScanner({
    onDetected: (data: string) => onInspectDetectedRef.current(data),
  });

  // ── Error Modal state ──────────────────────────────────────────────────────
  const [modal, setModal] = useState<{
    isOpen: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', type: 'info' });
  
  const showModal = (title: string, message: string, type: 'error' | 'success' | 'warning' | 'info' = 'info') => {
    setModal({ isOpen: true, title, message, type });
  };
  
  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));
  
  useEffect(() => {
    loadAllData();
    loadUserData();
    loadReceipts();
  }, []);

  useEffect(() => {
    if (activeTab !== 'verify') stopCamera();
    inspectStopCamera();
  }, [activeTab, stopCamera, inspectStopCamera]);
  
  const loadUserData = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };
  
  const loadAllData = async () => {
    try {
      setLoading(true);
      console.log('[PharmacistDashboard] Loading data...');
      
      const [receiptsData, ordersData, distributorsData] = await Promise.all([
        api.get<{results: ReceiptEvent[]}>('/receipts/').then(r => r.data.results || r.data),
        getPharmacistOrders(),
        api.get<{results: Distributor[]}>('/distributors/').then(r => {
          console.log('[PharmacistDashboard] Distributors response:', r.data);
          // Extract results from paginated response
          return r.data.results || r.data;
        })
      ]);
      
      console.log('[PharmacistDashboard] Loaded:', {
        receipts: receiptsData.length,
        orders: ordersData.length,
        distributors: distributorsData.length
      });
      
      setReceipts(receiptsData);
      setOrders(ordersData);
      setDistributors(distributorsData);
      
      // Don't load all medicines initially - wait for distributor selection
      setMedicines([]);
      
      // Calculate stats
      setStats({
        totalReceipts: receiptsData.length,
        totalOrders: ordersData.length,
        pendingOrders: ordersData.filter(o => o.status === 'PENDING').length,
        shippedOrders: ordersData.filter(o => o.status === 'SHIPPED').length,
        deliveredOrders: ordersData.filter(o => o.status === 'DELIVERED').length,
        integrityScore: 98
      });
    } catch (error) {
      console.error('[PharmacistDashboard] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadMedicinesByDistributor = async (distributorId: string) => {
    try {
      setSubmitting(true);
      // Fetch medicines filtered by distributor
      const response = await api.get<{results: Medicine[]}>(`/medicines/?distributor=${distributorId}`);
      const medicinesData = response.data.results || response.data;
      setMedicines(medicinesData);
      
      // Reset selected medicine when distributor changes
      setSelectedMedicine('');
    } catch (error) {
      console.error('Error loading medicines for distributor:', error);
      setMedicines([]);
    } finally {
      setSubmitting(false);
    }
  };
  
  const loadReceipts = async () => {
    setReceiptsLoading(true);
    try {
      const data = await getReceiptEvents();
      setReceiptsLog(data);
    } catch { setReceiptsLog([]); }
    finally { setReceiptsLoading(false); }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDistributor || !selectedMedicine || quantity <= 0) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Backend expects only medicine_id and quantity in items
      await createOrder({
        distributor: selectedDistributor,
        items: [{
          medicine_id: selectedMedicine,
          quantity: quantity
        }]
      });
      
      await loadAllData();
      
      setSelectedDistributor('');
      setSelectedMedicine('');
      setQuantity(100);
      setShowCreateOrderModal(false);
      showModal('Order Placed', '✅ Order created successfully!', 'success');
    } catch (error: any) {
      console.error('Error creating order:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.detail
        || JSON.stringify(error.response?.data)
        || 'Failed to create order';
      showModal('Order Creation Failed', errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };
  
  const openVerifyModal = (order: SupplyOrder) => {
    setSelectedOrderForVerify(order);
    setScannedUuid('');
    setVerificationResult(null);
    setShowVerifyModal(true);
  };
  
  const closeVerifyModal = () => {
    setShowVerifyModal(false);
    setSelectedOrderForVerify(null);
    setScannedUuid('');
    setVerificationResult(null);
  };
  
  const handleVerifyReceipt = async () => {
    if (!scannedUuid.trim()) {
      showModal('Input Required', 'Please enter a manifest UUID', 'warning');
      return;
    }
    
    try {
      setSubmitting(true);
      const result = await verifyReceipt({ scanned_uuid: scannedUuid });
      setVerificationResult(result);
      await loadAllData();
    } catch (error: any) {
      console.error('Error verifying receipt:', error);
      setVerificationResult({
        status: 'INVALID',
        message: error.response?.data?.message || 'Verification failed',
        trust_score: '0.00',
        chain_of_custody: false
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openInspectModal = async (order: SupplyOrder) => {
    setInspectingOrder(order);
    setLocked(true);
    setShowInspectModal(true);
    setScannedPhysicalUuid('');
    setVerificationMatch(null);
    
    setTimeout(() => setLocked(false), 300);
    
    try {
      setSubmitting(true);
      const details = await getOrderManifest(order.id);
      setManifestDetails(details);
    } catch (error: any) {
      console.error('Error fetching manifest:', error);
      showModal('Failed to Load Manifest', error.response?.data?.error || 'Failed to load manifest details', 'error');
      setShowInspectModal(false);
    } finally {
      setSubmitting(false);
    }
  };
  
  const closeInspectModal = () => {
    setShowInspectModal(false);
    inspectStopCamera();
    setInspectingOrder(null);
    setManifestDetails(null);
    setScannedPhysicalUuid('');
    setVerificationMatch(null);
    setLocked(true);
  };
  
  const handlePhysicalScan = (scannedValue: string) => {
    setScannedPhysicalUuid(scannedValue);
    if (!manifestDetails) return;
    if (scannedValue.trim().toLowerCase() === manifestDetails.manifest_id.toLowerCase()) {
      setVerificationMatch('match');
    } else {
      setVerificationMatch('mismatch');
    }
  };
  
  useEffect(() => {
    onInspectDetectedRef.current = handlePhysicalScan;
  }, [manifestDetails]);
  
  const handleCompleteVerification = async () => {
    if (verificationMatch === 'match' && manifestDetails && inspectingOrder) {
      try {
        setSubmitting(true);
        await verifyReceipt({ scanned_uuid: manifestDetails.manifest_id });
        closeInspectModal();
        await loadAllData();
        showModal('Verification Complete', '✓ Shipment successfully verified and received!', 'success');
      } catch (error: any) {
        console.error('Error verifying receipt:', error);
        showModal('Verification Failed', error.response?.data?.error || 'Failed to verify receipt', 'error');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleRejectShipment = async () => {
    if (manifestDetails && inspectingOrder) {
      try {
        setSubmitting(true);
        // Create a flag on the manifest indicating poor quality or counterfeit suspicion which subtracts points
        await createFlag({
          lot: manifestDetails.manifest_id,
          severity: 'HIGH',
          reporter_type: 'Pharmacist',
          issue_type: 'Quality Issue',
          description: 'Shipment rejected during pre-receipt validation due to existing trust score warnings.',
        });
        closeInspectModal();
        await loadAllData();
        showModal('Shipment Rejected', 'Shipment has been quarantined and flagged.', 'warning');
      } catch (error: any) {
        console.error('Error rejecting shipment:', error);
        showModal('Rejection Failed', error.response?.data?.error || 'Failed to reject shipment', 'error');
      } finally {
        setSubmitting(false);
      }
    }
  };

  // ── Verify Batch tab handlers ──────────────────────────────────────────────
  const handleVerifyBatch = async (id?: string) => {
    const target = id ?? verifyBatchId;
    if (!target.trim()) return;
    setVerifyLoading(true);
    setVerifyError(null);
    setVerifyQRResult(null);
    setReceiptResult(null);
    try {
      const res = await api.get(`/manifests/${target.trim()}/verify-qr/`);
      setVerifyQRResult(res.data);
      stopCamera();
    } catch (err: any) {
      setVerifyError(err.response?.data?.detail ?? 'Manifest not found. Check the Batch UUID and try again.');
    } finally { setVerifyLoading(false); }
  };

  // Wire up the stable ref so the hook's onDetected calls the latest handler
  onDetectedRef.current = (data: string) => {
    setVerifyBatchId(data);
    handleVerifyBatch(data);
  };


  const handleGenerateReceipt = async () => {
    const target = verifyBatchId.trim() || verifyQRResult?.lot_id || '';
    if (!target) return;
    setReceiptLoading(true);
    try {
      const result = await verifyReceipt({ scanned_uuid: target });
      setReceiptResult(result);
      setShowReceiptModal(true);
      // Auto-create a ReceiptEvent (accreditation log) for this verification
      try {
        await createReceiptEvent({ lot: target });
        await loadReceipts(); // refresh the Receipts tab
      } catch { /* non-blocking — receipt event is supplementary */ }
      await loadAllData();
    } catch (err: any) {
      setVerifyError(err.response?.data?.message ?? 'Failed to generate receipt.');
    } finally { setReceiptLoading(false); }
  };

  // ── Report Issue tab handlers ──────────────────────────────────────────────
  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRisk || !reportBatchId.trim()) return;
    setReportLoading(true);
    setReportError(null);
    try {
      const fullDesc = selectedTags.length > 0
        ? `[${selectedTags.join(', ')}] ${reportDescription}`
        : reportDescription;
      await createFlag({
        lot: reportBatchId.trim(),
        severity: selectedRisk,
        reporter_type: 'Pharmacist',
        issue_type: selectedIssueType || 'General Concern',
        description: fullDesc,
      });
      setReportSuccess(true);
      setSelectedRisk(null);
      setSelectedIssueType('');
      setSelectedTags([]);
      setReportDescription('');
      setReportBatchId('');
    } catch (err: any) {
      const d = err.response?.data;
      setReportError(typeof d === 'string' ? d : d?.detail ?? d?.lot?.[0] ?? 'Failed to submit report.');
    } finally { setReportLoading(false); }
  };
  
  const getStatusBadge = (status: SupplyOrder['status']) => {
    const styles = {
      PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      SHIPPED: 'bg-[#0055FF]/20 text-[#0055FF] border-[#0055FF]/30',
      DELIVERED: 'bg-[#00C853]/20 text-[#00C853] border-[#00C853]/30',
      REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full border font-bold text-xs ${styles[status]}`}>
        {status}
      </span>
    );
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return `${Math.floor(diffMs / (1000 * 60))}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };
  
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  
  if (loading) {
    return (
      <div className="bg-[#0a0e1a] h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
          <p className="mt-4 text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-[#0a0e1a] text-white font-display h-screen flex overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#151923] border-r border-gray-700 flex flex-col h-full shrink-0 z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
            <Icon name="verified_user" className="text-primary text-2xl" />
          </div>
          <div>
            <h1 className="text-white text-lg font-bold leading-tight tracking-tight">RxVerify Lite</h1>
            <p className="text-gray-400 text-xs font-medium">Pharmacy Portal</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-2 flex flex-col gap-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-gray-400 hover:bg-[#0a0e1a]/50 hover:text-white'
            }`}
          >
            <Icon name="dashboard" className={activeTab === 'dashboard' ? 'filled' : ''} />
            <span className="text-sm font-bold">Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
              activeTab === 'orders'
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-gray-400 hover:bg-[#0a0e1a]/50 hover:text-white'
            }`}
          >
            <Icon name="local_shipping" />
            <span className="text-sm font-medium">Orders</span>
          </button>
          
          <button
            onClick={() => setActiveTab('verify')}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
              activeTab === 'verify'
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-gray-400 hover:bg-[#0a0e1a]/50 hover:text-white'
            }`}
          >
            <Icon name="verified" />
            <span className="text-sm font-medium">Verify Batch</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
              activeTab === 'report'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-gray-400 hover:bg-[#0a0e1a]/50 hover:text-white'
            }`}
          >
            <Flag className="w-5 h-5" />
            <span className="text-sm font-medium">Report Issue</span>
          </button>

          <button
            onClick={() => { setActiveTab('receipts'); loadReceipts(); }}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
              activeTab === 'receipts'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'text-gray-400 hover:bg-[#0a0e1a]/50 hover:text-white'
            }`}
          >
            <Receipt className="w-5 h-5" />
            <span className="text-sm font-medium">Receipts</span>
            {receiptsLog.length > 0 && (
              <span className="ml-auto bg-green-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {receiptsLog.length}
              </span>
            )}
          </button>
          
          <div className="mt-6 mb-2 px-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quick Actions</p>
          </div>
          
          <button
            onClick={() => setShowCreateOrderModal(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-[#0a0e1a]/50 text-left transition-colors"
          >
            <div className="size-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Icon name="add_shopping_cart" className="text-lg" />
            </div>
            <span className="text-sm font-medium">New Order</span>
          </button>
        </nav>
        
        {/* User Profile */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#0a0e1a]/50 cursor-pointer transition-colors mb-2">
            <div className="size-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
              {user?.username?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div className="flex flex-col overflow-hidden flex-1">
              <p className="text-sm font-bold text-white truncate">{user?.username || 'Pharmacist'}</p>
              <p className="text-xs text-gray-400 truncate">Pharmacist</p>
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
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 shrink-0 bg-[#151923]/80 backdrop-blur-md border-b border-gray-700 flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">
              {activeTab === 'dashboard' && 'Pharmacy Command Center'}
              {activeTab === 'verify'    && 'Verify Batch'}
              {activeTab === 'report'   && 'Report Suspect Product'}
              {activeTab === 'receipts' && 'Verified Receipts'}
              {activeTab === 'orders'   && 'Supply Chain Orders'}
            </h2>
            {activeTab === 'dashboard' && stats.shippedOrders > 0 && (
              <span className="px-3 py-1 rounded-full bg-[#0055FF]/20 text-[#0055FF] border border-[#0055FF]/30 text-xs font-bold flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {stats.shippedOrders} shipment{stats.shippedOrders > 1 ? 's' : ''} ready
              </span>
            )}
          </div>
        </header>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">

          {/* ══ VERIFY BATCH TAB ══════════════════════════════════════════════════ */}
          {activeTab === 'verify' && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Scanner card */}
              <div className="bg-[#151923] rounded-2xl border border-gray-700 overflow-hidden">
                {/* Camera viewport — video always in DOM so videoRef is ready */}
                <div className="relative bg-black aspect-video max-h-64 flex items-center justify-center overflow-hidden">
                  {/* Video always mounted — hidden via opacity when not active */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      cameraActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />

                  {/* Scan frame overlay — only when active */}
                  {cameraActive && (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 border-2 border-primary rounded-xl relative">
                          <span className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                          <span className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                          <span className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                          <span className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-primary/60 animate-[scan_2s_linear_infinite]" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-3 w-full flex justify-center">
                        <p className="text-xs text-white/70 bg-black/60 px-3 py-1 rounded-full">Point at QR code on packaging</p>
                      </div>
                    </>
                  )}

                  {/* Idle placeholder — shown when camera is off */}
                  {!cameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8">
                      <div className="size-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <QrCode className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-gray-300 text-sm font-medium">Camera not active</p>
                      {cameraError && <p className="text-red-400 text-xs text-center max-w-xs">{cameraError}</p>}
                      <button
                        onClick={startCamera}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-all shadow-lg shadow-primary/20"
                      >
                        <Camera className="w-4 h-4" />
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
                      <StopCircle className="w-4 h-4" />
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
                      value={verifyBatchId}
                      onChange={e => setVerifyBatchId(e.target.value)}
                      placeholder="Paste Batch UUID (e.g. 494466b3-0f94-…)"
                      onKeyDown={e => e.key === 'Enter' && handleVerifyBatch()}
                      className="flex-1 px-4 py-3 bg-[#0a0e1a] border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary/50 placeholder-gray-600"
                    />
                    <button
                      onClick={() => handleVerifyBatch()}
                      disabled={!verifyBatchId.trim() || verifyLoading}
                      className="flex items-center gap-2 px-5 py-3 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold text-sm transition-all"
                    >
                      {verifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Verify
                    </button>
                  </div>
                  {verifyError && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-300">{verifyError}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification result */}
              {verifyQRResult && (
                <div className="bg-[#151923] rounded-2xl border border-gray-700 overflow-hidden">
                  <div className={`h-1.5 w-full ${
                    String(verifyQRResult.trust_status ?? '').startsWith('SAF') ? 'bg-[#00C853]' :
                    String(verifyQRResult.trust_status ?? '').startsWith('CAU') ? 'bg-yellow-400' : 'bg-red-500'
                  }`} />
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-5">
                      <div>
                        <h3 className="font-bold text-white text-lg">
                          {verifyQRResult.medicine?.name || verifyQRResult.medicine_name || 'Unknown Medicine'}
                        </h3>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">Batch: {verifyQRResult.batch_number}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full border font-bold text-xs ${
                        String(verifyQRResult.trust_status ?? '').startsWith('SAF') ? 'bg-[#00C853]/20 text-[#00C853] border-[#00C853]/30' :
                        String(verifyQRResult.trust_status ?? '').startsWith('CAU') ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {verifyQRResult.trust_status ?? 'UNKNOWN'} · {Number(verifyQRResult.trust_score).toFixed(0)}%
                      </span>
                    </div>

                    <div className={`flex items-center gap-2 p-3 rounded-lg mb-5 ${
                      verifyQRResult.is_authentic !== false
                        ? 'bg-[#00C853]/10 border border-[#00C853]/30'
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}>
                      {verifyQRResult.is_authentic !== false
                        ? <CheckCircle className="w-5 h-5 text-[#00C853]" />
                        : <AlertCircle className="w-5 h-5 text-red-400" />}
                      <p className={`text-sm font-semibold ${
                        verifyQRResult.is_authentic !== false ? 'text-[#00C853]' : 'text-red-400'
                      }`}>
                        {verifyQRResult.verification_message ?? (verifyQRResult.is_authentic !== false ? 'Authentic & Verified' : 'Verification Failed')}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                      {verifyQRResult.medicine && [
                        ['Active Ingredient', verifyQRResult.medicine.active_ingredient],
                        ['Strength', verifyQRResult.medicine.strength],
                        ['Dosage Form', verifyQRResult.medicine.dosage_form],
                        ['Expiry Date', verifyQRResult.expiry_date],
                      ].map(([label, value]) => (
                        <div key={label} className="flex flex-col bg-[#0a0e1a] rounded-lg p-3 border border-gray-700">
                          <span className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{label}</span>
                          <span className="text-white font-semibold">{value}</span>
                        </div>
                      ))}
                      {verifyQRResult.distributor && (
                        <div className="col-span-2 flex flex-col bg-[#0a0e1a] rounded-lg p-3 border border-gray-700">
                          <span className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Distributor</span>
                          <span className="text-white font-semibold">{verifyQRResult.distributor}</span>
                        </div>
                      )}
                    </div>

                    {verifyQRResult.flags_count !== undefined && verifyQRResult.flags_count > 0 && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 mb-4">
                        <Flag className="w-4 h-4 text-orange-400" />
                        <p className="text-xs text-orange-400 font-semibold">
                          {verifyQRResult.flags_count} flag{verifyQRResult.flags_count > 1 ? 's' : ''} reported on this batch
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleGenerateReceipt}
                        disabled={receiptLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#00C853]/10 border border-[#00C853]/30 text-[#00C853] font-bold hover:bg-[#00C853]/20 transition-colors disabled:opacity-50"
                      >
                        {receiptLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        Generate Receipt
                      </button>
                      <button
                        onClick={() => { setReportBatchId(verifyQRResult.lot_id ?? verifyBatchId); setActiveTab('report'); }}
                        className="flex items-center gap-2 py-3 px-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold hover:bg-orange-500/20 transition-colors text-sm"
                      >
                        <Flag className="w-4 h-4" /> Report
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ REPORT ISSUE TAB ════════════════════════════════════════════════ */}
          {activeTab === 'report' && (
            <div className="max-w-2xl mx-auto space-y-5">
              {reportSuccess && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[#00C853]/10 border border-[#00C853]/30">
                  <CheckCircle2 className="w-6 h-6 text-[#00C853] shrink-0" />
                  <div>
                    <p className="font-bold text-[#00C853]">Report Submitted!</p>
                    <p className="text-sm text-gray-300">Thank you. Our team will review your report shortly.</p>
                  </div>
                  <button onClick={() => setReportSuccess(false)} className="ml-auto text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
              )}

              <form onSubmit={handleSubmitReport} className="space-y-5">
                {/* Batch ID */}
                <div className="bg-[#151923] rounded-2xl border border-gray-700 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon name="tag" className="text-primary" />
                    <h3 className="font-bold">Batch ID</h3>
                    <span className="ml-auto text-xs text-red-400 font-semibold">REQUIRED</span>
                  </div>
                  <input
                    type="text" value={reportBatchId}
                    onChange={e => setReportBatchId(e.target.value)}
                    placeholder="Enter Lot Manifest UUID from medicine packaging…"
                    required
                    className="w-full px-4 py-3 bg-[#0a0e1a] border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary/50 placeholder-gray-600"
                  />
                </div>

                {/* Issue Type */}
                <div className="bg-[#151923] rounded-2xl border border-gray-700 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon name="category" className="text-primary" />
                    <h3 className="font-bold">Issue Type</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ISSUE_TYPES.map(it => (
                      <button key={it} type="button"
                        onClick={() => setSelectedIssueType(prev => prev === it ? '' : it)}
                        className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                          selectedIssueType === it ? 'bg-primary border-primary text-white' : 'border-gray-700 text-gray-300 hover:border-gray-500'
                        }`}>{it}</button>
                    ))}
                  </div>
                </div>

                {/* Severity */}
                <div className="bg-[#151923] rounded-2xl border border-gray-700 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Icon name="bar_chart" className="text-primary" />
                    <h3 className="font-bold">Risk Assessment</h3>
                    <span className="ml-auto text-xs text-red-400 font-semibold">REQUIRED</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {RISK_OPTIONS.map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => setSelectedRisk(opt.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          selectedRisk === opt.value ? opt.color + ' border-opacity-100' : 'border-gray-700 hover:border-gray-500'
                        }`}>
                        <p className="font-bold">{opt.label}</p>
                        <p className="text-xs text-gray-400 mt-1">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Observation Tags */}
                <div className="bg-[#151923] rounded-2xl border border-gray-700 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon name="label" className="text-primary" />
                    <h3 className="font-bold">Observations</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ISSUE_TAGS.map(tag => (
                      <button key={tag} type="button" onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                          selectedTags.includes(tag) ? 'bg-primary/20 border-primary/50 text-primary' : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                        }`}>{tag}</button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="bg-[#151923] rounded-2xl border border-gray-700 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon name="notes" className="text-primary" />
                    <h3 className="font-bold">Description</h3>
                  </div>
                  <textarea
                    value={reportDescription} rows={4}
                    onChange={e => setReportDescription(e.target.value)}
                    placeholder="Describe the issue in detail — what you observed, when, and any patient impact…"
                    className="w-full px-4 py-3 bg-[#0a0e1a] border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary/50 placeholder-gray-600 resize-none"
                  />
                </div>

                {reportError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-300">{reportError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={reportLoading || !selectedRisk || !reportBatchId.trim()}
                  className="w-full py-3 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20"
                >
                  {reportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                  Submit Report
                </button>
              </form>
            </div>
          )}

          {/* ══ ORDERS TAB ═══════════════════════════════════════════════════ */}
          {activeTab === 'orders' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowCreateOrderModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  <PlusCircle className="w-4 h-4" />
                  New Order
                </button>
              </div>

              <div className="bg-[#151923] rounded-2xl border border-gray-700 overflow-hidden">
                {orders.length === 0 ? (
                  <div className="p-16 text-center flex flex-col items-center gap-4">
                    <Package className="w-16 h-16 text-gray-600" />
                    <div>
                      <p className="text-white font-bold">No orders yet</p>
                      <p className="text-gray-400 text-sm mt-1">Place your first supply order to get started.</p>
                    </div>
                    <button
                      onClick={() => setShowCreateOrderModal(true)}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold text-sm"
                    >
                      Place First Order
                    </button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-[#0a0e1a] border-b border-gray-700">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Order ID</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Distributor</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Items</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Date</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {orders.map((order) => {
                        return (
                          <tr key={order.id} className="hover:bg-[#0a0e1a]/50 transition-colors">
                            <td className="px-5 py-4 text-sm font-mono text-gray-400">{order.id.slice(0, 8)}…</td>
                            <td className="px-5 py-4 text-sm font-bold text-white">{order.distributor_name}</td>
                            <td className="px-5 py-4 text-sm text-gray-400 max-w-[200px] truncate">
                              {order.items?.map(i => `${i.name ?? i.medicine_id} (${i.quantity})`).join(', ')}
                            </td>
                            <td className="px-5 py-4">
                              {getStatusBadge(order.status)}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-400">
                              {new Date(order.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                            </td>
                            <td className="px-5 py-4">
                              {order.status === 'SHIPPED' && (
                                <button
                                  onClick={() => openInspectModal(order)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 font-bold text-xs transition-colors"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  Inspect Shipment
                                </button>
                              )}
                              {order.status === 'DELIVERED' && (
                                <span className="text-green-400 font-bold text-xs flex items-center gap-1">
                                  <ClipboardCheck className="w-3.5 h-3.5" />
                                  Received
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ══ RECEIPTS TAB ══════════════════════════════════════════════════ */}
          {activeTab === 'receipts' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header info banner */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 flex items-start gap-4">
                <div className="size-10 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-green-300 font-bold text-sm">Accreditation Trail</h3>
                  <p className="text-gray-400 text-xs mt-1">
                    Each entry below is a cryptographically-backed proof that your pharmacy received and verified an authentic batch.
                    These receipts are timestamped audit logs submitted to the RxVerify system.
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#151923] rounded-2xl border border-gray-700 p-4 text-center">
                  <p className="text-3xl font-extrabold text-white">{receiptsLog.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Total Receipts</p>
                </div>
                <div className="bg-[#151923] rounded-2xl border border-green-500/30 p-4 text-center">
                  <p className="text-3xl font-extrabold text-green-400">{receiptsLog.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Verified Batches</p>
                </div>
                <div className="bg-[#151923] rounded-2xl border border-blue-500/30 p-4 text-center">
                  <p className="text-3xl font-extrabold text-blue-400">
                    {new Set(receiptsLog.map(r => r.lot_batch_number)).size}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Unique Batches</p>
                </div>
              </div>

              {/* Receipts list */}
              {receiptsLoading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm">Loading receipts...</span>
                </div>
              ) : receiptsLog.length === 0 ? (
                <div className="bg-[#151923] rounded-2xl border border-gray-700 p-16 flex flex-col items-center gap-4 text-center">
                  <div className="size-16 rounded-full bg-gray-800 flex items-center justify-center">
                    <Receipt className="w-8 h-8 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-white font-bold">No receipts yet</p>
                    <p className="text-gray-400 text-sm mt-1">Verify a batch to generate your first accreditation receipt.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {receiptsLog.map((receipt, idx) => (
                    <div
                      key={receipt.id}
                      className="bg-[#151923] border border-gray-700 rounded-2xl p-5 hover:border-green-500/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {/* Index badge */}
                          <div className="size-10 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center shrink-0">
                            <span className="text-green-400 font-bold text-sm">#{receiptsLog.length - idx}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="font-mono font-bold text-white text-sm">{receipt.lot_batch_number}</span>
                              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">
                                VERIFIED
                              </span>
                            </div>
                            <p className="text-gray-400 text-xs mt-1">
                              Pharmacist: <span className="text-white font-medium">{receipt.user_username}</span>
                              {receipt.location_coord && (
                                <span className="ml-3">
                                  📍 {receipt.location_coord.lat.toFixed(4)}, {receipt.location_coord.lng.toFixed(4)}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-500">
                            {new Date(receipt.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {new Date(receipt.created_at).toLocaleTimeString('en-GB', {
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Divider + batch UUID */}
                      <div className="mt-3 pt-3 border-t border-gray-700/60 flex items-center justify-between">
                        <p className="text-xs text-gray-600 font-mono">
                          Lot ID: {receipt.lot}
                        </p>
                        <span className="flex items-center gap-1 text-xs text-green-500">
                          <Shield className="w-3 h-3" />
                          Chain of Custody Logged
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ DASHBOARD TAB ════════════════════════════════════════════════════ */}
          {activeTab === 'dashboard' && (
          <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-6">
            {/* Left Column: Stats & Activity */}
            <div className="flex-1 flex flex-col gap-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Integrity Score */}
                <div className="bg-[#151923] p-5 rounded-2xl border border-gray-700 relative overflow-hidden group hover:border-primary/50 transition-colors">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Shield className="w-16 h-16 text-primary" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-primary" />
                      <p className="text-sm font-semibold text-gray-400">Integrity Score</p>
                    </div>
                    <p className="text-3xl font-extrabold text-white">
                      {stats.integrityScore}<span className="text-lg text-gray-500">%</span>
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-[#00C853] text-xs font-bold">
                      <TrendingUp className="w-4 h-4" />
                      <span>+2.4% this week</span>
                    </div>
                  </div>
                </div>
                
                {/* Total Receipts */}
                <div className="bg-[#151923] p-5 rounded-2xl border border-gray-700 relative overflow-hidden group hover:border-[#00C853]/50 transition-colors">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ClipboardCheck className="w-16 h-16 text-[#00C853]" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <ClipboardCheck className="w-5 h-5 text-[#00C853]" />
                      <p className="text-sm font-semibold text-gray-400">Verified Receipts</p>
                    </div>
                    <p className="text-3xl font-extrabold text-white">{stats.totalReceipts}</p>
                    <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
                  </div>
                </div>
                
                {/* Active Orders */}
                <div className="bg-[#151923] p-5 rounded-2xl border border-gray-700 relative overflow-hidden group hover:border-[#0055FF]/50 transition-colors">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Truck className="w-16 h-16 text-[#0055FF]" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-5 h-5 text-[#0055FF]" />
                      <p className="text-sm font-semibold text-gray-400">Active Orders</p>
                    </div>
                    <p className="text-3xl font-extrabold text-white">{stats.totalOrders}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="text-yellow-400">{stats.pendingOrders} pending</span>
                      <span className="text-[#0055FF]">{stats.shippedOrders} shipped</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recent Activity Feed */}
              <div className="bg-[#151923] rounded-2xl border border-gray-700 flex flex-col overflow-hidden">
                <div className="p-5 border-b border-gray-700 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                    <p className="text-xs text-gray-400">Real-time verification feed</p>
                  </div>
                </div>
                <div className="flex-1 overflow-auto max-h-96">
                  {receipts.length === 0 ? (
                    <div className="p-12 text-center">
                      <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">No recent activity</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-700">
                      {receipts.slice(0, 10).map((receipt) => (
                        <div key={receipt.id} className="p-4 hover:bg-[#0a0e1a]/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="size-10 rounded-xl bg-[#00C853]/20 border border-[#00C853]/30 flex items-center justify-center shrink-0">
                              <CheckCircle className="w-5 h-5 text-[#00C853]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">{receipt.lot_medicine_name || 'Medicine'}</p>
                              <p className="text-xs text-gray-400">Batch: {receipt.lot_batch_number || 'N/A'}</p>
                              <p className="text-xs text-gray-500 mt-1">{formatDate(receipt.created_at)}</p>
                            </div>
                            <span className="px-2 py-1 rounded-full bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/30 text-xs font-bold shrink-0">
                              VERIFIED
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Column: Orders & Quick Actions */}
            <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0">
              {/* Pending Shipments */}
              {stats.shippedOrders > 0 && (
                <div className="bg-gradient-to-br from-[#0055FF] to-[#0033cc] rounded-2xl p-6 text-white shadow-xl shadow-[#0055FF]/30 relative overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-[#0055FF]/40 transition-all">
                  <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/10 blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 size-20 rounded-full bg-white/5 blur-xl"></div>
                  <div className="relative z-10 flex flex-col items-center text-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-white/30 animate-ping"></div>
                      <div className="size-16 bg-white text-[#0055FF] rounded-full flex items-center justify-center shadow-lg">
                        <Truck className="w-8 h-8" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{stats.shippedOrders} Shipment{stats.shippedOrders > 1 ? 's' : ''} Ready</h3>
                      <p className="text-blue-100 text-xs mt-1">Click to receive stock</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Quick Create Order */}
              <div className="bg-[#151923] rounded-2xl border border-gray-700 p-6">
                <h4 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-primary" />
                  Quick Order
                </h4>
                <button
                  onClick={() => setShowCreateOrderModal(true)}
                  className="w-full py-3 px-4 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
                >
                  <PlusCircle className="w-5 h-5" />
                  Create New Order
                </button>
              </div>
              
              {/* Recent Orders */}
              <div className="bg-[#151923] rounded-2xl border border-gray-700 flex flex-col overflow-hidden flex-1">
                <div className="p-4 border-b border-gray-700">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Recent Orders
                  </h4>
                </div>
                <div className="flex-1 overflow-auto">
                  {orders.length === 0 ? (
                    <div className="p-8 text-center">
                      <Package className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-400 text-xs">No orders yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-700">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="p-3 hover:bg-[#0a0e1a]/50 transition-colors">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-xs font-mono text-gray-400">{order.id.slice(0, 8)}...</p>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-sm font-bold text-white truncate">{order.distributor_name}</p>
                          <p className="text-xs text-gray-400 truncate mt-1">
                            {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                          </p>
                          {order.status === 'SHIPPED' && (
                            <button
                              onClick={() => openVerifyModal(order)}
                              className="mt-2 w-full py-1.5 px-3 rounded-lg bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/30 hover:bg-[#00C853]/30 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                            >
                              <QrCode className="w-3 h-3" />
                              Receive
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {orders.length > 5 && (
                  <div className="p-3 border-t border-gray-700">
                    <button 
                      onClick={() => navigate('/pharmacist/orders')}
                      className="w-full text-xs text-primary font-bold hover:underline"
                    >
                      View All Orders →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </main>
      

      {/* ── Receipt / Verification Certificate Modal ──────────────────────────── */}
      {showReceiptModal && receiptResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#151923] border border-gray-700 rounded-2xl p-0 max-w-lg w-full shadow-2xl overflow-hidden">
            {/* Header */}
            <div className={`h-2 w-full ${receiptResult.chain_of_custody ? 'bg-[#00C853]' : 'bg-yellow-400'}`} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#00C853]" />
                  Verification Receipt
                </h3>
                <button onClick={() => setShowReceiptModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status banner */}
              <div className={`flex items-center gap-3 p-4 rounded-xl mb-5 ${
                receiptResult.chain_of_custody
                  ? 'bg-[#00C853]/10 border border-[#00C853]/30'
                  : 'bg-yellow-500/10 border border-yellow-500/30'
              }`}>
                {receiptResult.chain_of_custody
                  ? <CheckCircle className="w-5 h-5 text-[#00C853]" />
                  : <AlertCircle className="w-5 h-5 text-yellow-400" />}
                <div>
                  <p className={`font-bold text-sm ${receiptResult.chain_of_custody ? 'text-[#00C853]' : 'text-yellow-400'}`}>
                    {receiptResult.message}
                  </p>
                  {receiptResult.chain_of_custody && (
                    <p className="text-xs text-gray-400">Full chain of custody confirmed</p>
                  )}
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  ['Medicine',    receiptResult.medicine_name],
                  ['Batch #',     receiptResult.batch_number],
                  ['Trust Score', receiptResult.trust_score + (receiptResult.bonus_applied ? ` (+${receiptResult.bonus_applied} bonus)` : '')],
                  ['Distributor', receiptResult.distributor_name],
                ].map(([label, value]) => (
                  <div key={label} className="bg-[#0a0e1a] border border-gray-700 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 text-center mb-5">
                Verified at {new Date().toLocaleString()} · RxVerify Lite
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0055FF]/10 border border-[#0055FF]/30 text-[#0055FF] font-bold hover:bg-[#0055FF]/20 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}

      {showCreateOrderModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#151923] border border-gray-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-primary" />
              Create New Supply Order
            </h3>
            
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Select Distributor
                </label>
                <select
                  value={selectedDistributor}
                  onChange={(e) => {
                    const distId = e.target.value;
                    setSelectedDistributor(distId);
                    if (distId) {
                      loadMedicinesByDistributor(distId);
                    } else {
                      setMedicines([]);
                      setSelectedMedicine('');
                    }
                  }}
                  required
                  className="w-full px-4 py-3 bg-[#0a0e1a] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                >
                  <option value="">Choose a distributor...</option>
                  {distributors.map(dist => (
                    <option key={dist.id} value={dist.id}>{dist.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Select Medicine
                </label>
                <select
                  value={selectedMedicine}
                  onChange={(e) => setSelectedMedicine(e.target.value)}
                  required
                  disabled={!selectedDistributor || medicines.length === 0}
                  className="w-full px-4 py-3 bg-[#0a0e1a] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!selectedDistributor 
                      ? 'Select a distributor first...' 
                      : submitting 
                      ? 'Loading medicines...' 
                      : medicines.length === 0 
                      ? 'No medicines available from this distributor' 
                      : 'Choose a medicine...'}
                  </option>
                  {medicines.map(med => (
                    <option key={med.id} value={med.id}>
                      {med.name} - {med.active_ingredient} {med.strength}
                    </option>
                  ))}
                </select>
                {selectedDistributor && !submitting && medicines.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    {medicines.length} medicine{medicines.length > 1 ? 's' : ''} available from this distributor
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  min="1"
                  required
                  className="w-full px-4 py-3 bg-[#0a0e1a] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateOrderModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-700 bg-[#0a0e1a] text-gray-300 rounded-lg hover:bg-gray-800 font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Order'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Receive Stock / Verify Modal */}
      {showVerifyModal && selectedOrderForVerify && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#151923] border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <QrCode className="w-6 h-6 text-primary" />
              Receive Stock
            </h3>
            
            {!verificationResult ? (
              <>
                <div className="bg-[#0a0e1a] border border-gray-700 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-bold text-gray-400 mb-2">Order Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Distributor:</span>
                      <span className="text-white font-bold">{selectedOrderForVerify.distributor_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Items:</span>
                      <span className="text-white">{selectedOrderForVerify.items[0]?.name}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-400 text-sm mb-4">
                  Scan the QR code on the package or enter the manifest UUID
                </p>
                
                <input
                  type="text"
                  value={scannedUuid}
                  onChange={(e) => setScannedUuid(e.target.value)}
                  placeholder="Manifest UUID (from QR code)"
                  className="w-full px-4 py-3 bg-[#0a0e1a] border border-gray-700 rounded-lg text-white mb-4 focus:ring-2 focus:ring-primary/50"
                />
                
                <div className="flex gap-3">
                  <button
                    onClick={closeVerifyModal}
                    className="flex-1 px-4 py-2 border border-gray-700 bg-[#0a0e1a] text-gray-300 rounded-lg hover:bg-gray-800 font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyReceipt}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Verifying...' : 'Verify & Receive'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={`p-4 rounded-lg mb-4 ${
                  verificationResult.chain_of_custody 
                    ? 'bg-[#00C853]/10 border border-[#00C853]/30' 
                    : verificationResult.status === 'VERIFIED'
                    ? 'bg-[#0055FF]/10 border border-[#0055FF]/30'
                    : 'bg-red-500/10 border border-red-500/30'
                }`}>
                  <div className="flex items-start gap-3 mb-3">
                    {verificationResult.chain_of_custody ? (
                      <CheckCircle className="w-6 h-6 text-[#00C853] mt-0.5" />
                    ) : verificationResult.status === 'VERIFIED' ? (
                      <AlertCircle className="w-6 h-6 text-[#0055FF] mt-0.5" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-400 mt-0.5" />
                    )}
                    <p className={`font-bold text-sm ${
                      verificationResult.chain_of_custody ? 'text-[#00C853]' : 
                      verificationResult.status === 'VERIFIED' ? 'text-[#0055FF]' : 'text-red-400'
                    }`}>
                      {verificationResult.message}
                    </p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trust Score:</span>
                      <span className="font-bold text-white">{verificationResult.trust_score}</span>
                    </div>
                    {verificationResult.bonus_applied && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Chain Bonus:</span>
                        <span className="font-bold text-[#00C853]">{verificationResult.bonus_applied}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Batch:</span>
                      <span className="font-mono text-white text-xs">{verificationResult.batch_number}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={closeVerifyModal}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold transition-colors"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {/* Digital Bill of Lading Modal */}
      {showInspectModal && inspectingOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#151923] border border-blue-500/30 rounded-2xl p-8 max-w-5xl w-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-400 flex items-center gap-3">
                {locked ? <Lock className="w-7 h-7" /> : <LockOpen className="w-7 h-7" />}
                Secure Digital Bill of Lading
              </h3>
              <button onClick={closeInspectModal} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            
            {submitting && !manifestDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
            ) : manifestDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Digital Truth */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-blue-400">📘 Digital Truth</h4>
                  
                  <div className="bg-[#0a0e1a] border border-gray-700 rounded-xl p-4 space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 uppercase font-bold">Medicine</label>
                      <p className="text-white font-bold">{manifestDetails.medicine_name}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 uppercase font-bold">Batch #</label>
                        <p className="text-white font-mono text-sm">{manifestDetails.batch_number}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 uppercase font-bold">Expiry</label>
                        <p className="text-white font-mono text-sm">{manifestDetails.expiry_date}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center py-5 bg-[#151923] rounded-xl border border-gray-700/50">
                      <label className="text-xs text-gray-400 uppercase font-bold mb-4">Trust Score Assessment</label>
                      <TrustGauge score={parseFloat(manifestDetails.trust_score.toString())} size={150} strokeWidth={14} />
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-400 uppercase font-bold">Digital Signature (Ed25519)</label>
                      <p className="text-xs text-gray-500 font-mono break-all">
                        {manifestDetails.digital_signature.slice(0, 64)}...
                      </p>
                    </div>
                  </div>
                  
                  {/* QR Code */}
                  <div className="bg-[#0a0e1a] border border-gray-700 rounded-xl p-6 flex flex-col items-center">
                    <label className="text-xs text-gray-400 uppercase font-bold mb-3">Digital QR Code</label>
                    <div className="bg-white p-4 rounded-lg">
                      <QRCode value={manifestDetails.qr_code_content} size={180} level="H" />
                    </div>
                    <p className="text-xs text-gray-500 font-mono mt-3">{manifestDetails.manifest_id}</p>
                  </div>
                </div>
                
                {/* Right Column: Physical Verification */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-yellow-400">📦 Physical Check</h4>
                  
                  <div className="bg-[#0a0e1a] border border-gray-700 rounded-xl p-4">
                    <label className="block text-sm text-gray-400 mb-2 font-bold">Scan Physical Package QR</label>
                    <input
                      type="text"
                      value={scannedPhysicalUuid}
                      onChange={(e) => handlePhysicalScan(e.target.value)}
                      placeholder="Scan or paste manifest UUID..."
                      className="w-full px-4 py-3 bg-[#151923] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500/50 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2">Use your scanner or manually enter the UUID from the physical package</p>
                  </div>
                  
                  <div className="bg-[#151923] border border-gray-700 rounded-xl overflow-hidden relative">
                    {/* Camera View for Inspection */}
                    <div className="aspect-video bg-black relative flex items-center justify-center">
                      {!inspectCameraActive && !inspectCameraError && (
                        <div className="text-center p-6 w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-700/50 rounded-lg">
                          <Camera className="w-10 h-10 text-gray-600 mb-3" />
                          <button
                            onClick={inspectStartCamera}
                            className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                          >
                            Use Camera Scanner
                          </button>
                        </div>
                      )}
                      
                      {inspectCameraError && (
                        <div className="text-center p-6">
                            <AlertTriangle className="w-10 h-10 text-red-500/80 mx-auto mb-3" />
                            <p className="text-red-400 text-sm mb-3">{inspectCameraError}</p>
                            <button
                              onClick={inspectStartCamera}
                              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-1.5 rounded-lg transition-colors text-sm"
                            >
                              Try Again
                            </button>
                        </div>
                      )}
                      
                      <video
                        ref={inspectVideoRef}
                        className={`w-full h-full object-cover ${!inspectCameraActive ? 'hidden' : ''}`}
                      />
                      
                      {inspectCameraActive && (
                        <div className="absolute inset-0 pointer-events-none border-2 border-blue-500/30">
                          {/* Optional overlay guides */}
                        </div>
                      )}
                    </div>
                    
                    {inspectCameraActive && (
                      <div className="p-3 bg-[#0a0e1a] border-t border-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-green-400">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          <span className="text-xs font-bold tracking-wide animate-pulse">Scanning package...</span>
                        </div>
                        <button
                          onClick={inspectStopCamera}
                          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
                        >
                          <StopCircle className="w-4 h-4" />
                          <span className="text-xs font-bold">Stop</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Verification Result */}
                  {verificationMatch && (
                    <div className={`p-6 rounded-xl border-2 ${
                      verificationMatch === 'match' 
                        ? 'bg-green-500/10 border-green-500' 
                        : 'bg-red-500/10 border-red-500'
                    }`}>
                      <div className="flex items-center gap-3 mb-3">
                        {verificationMatch === 'match' ? (
                          <CheckCircle className="w-8 h-8 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-8 h-8 text-red-400" />
                        )}
                        <h5 className={`text-xl font-bold ${
                          verificationMatch === 'match' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {verificationMatch === 'match' 
                            ? '✓ Shipment Authenticated' 
                            : '⚠️ TAMPER WARNING'
                          }
                        </h5>
                      </div>
                      
                      <p className={`text-sm ${
                        verificationMatch === 'match' ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {verificationMatch === 'match' 
                          ? 'Physical batch matches digital order. Chain of custody is secure.' 
                          : 'Physical batch does NOT match digital order. Do not accept this shipment!'
                        }
                      </p>
                      
                      {verificationMatch === 'match' && (
                        <div className="w-full mt-6 space-y-4">
                          {parseFloat(manifestDetails.trust_score.toString()) >= 90 ? (
                            <>
                              <p className="text-sm text-green-300 font-bold mb-1 text-center">Chain of Custody Verified. Do you accept this delivery?</p>
                              <button
                                onClick={handleCompleteVerification}
                                disabled={submitting}
                                className="w-full px-4 py-4 bg-[#00C853] text-white rounded-xl hover:bg-[#00C853]/90 font-bold transition-all disabled:opacity-50 shadow-lg shadow-[#00C853]/20"
                              >
                                {submitting ? 'Processing...' : 'Generate Secure Receipt'}
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-1 text-center">
                                <p className="text-sm text-red-400 font-bold">WARNING: This batch has active flags. Quarantine advised.</p>
                              </div>
                              <button
                                onClick={handleRejectShipment}
                                disabled={submitting}
                                className="w-full px-4 py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold transition-all disabled:opacity-50 shadow-lg shadow-red-500/20"
                              >
                                {submitting ? 'Processing...' : 'Reject & Flag Shipment'}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!verificationMatch && (
                    <div className="p-6 rounded-xl bg-[#0a0e1a] border border-gray-700 text-center">
                      <QrCode className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">Scan the physical package to verify authenticity</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Error / Success Modal */}
      <ErrorModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  );
};

export default PharmacistInventoryDashboard;
