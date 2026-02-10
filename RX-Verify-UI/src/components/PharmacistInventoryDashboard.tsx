import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Truck, ClipboardCheck, PlusCircle, Loader2, QrCode, CheckCircle, 
  AlertCircle, TrendingUp, Activity, Shield, LogOut 
} from 'lucide-react';
import Icon from './Icon';
import { 
  createOrder, 
  getPharmacistOrders,
  verifyReceipt,
  type SupplyOrder 
} from '../services/orders';
import api from '../services/api';

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
  const [activeTab, setActiveTab] = useState('dashboard');
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
  
  // Form states
  const [selectedDistributor, setSelectedDistributor] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [scannedUuid, setScannedUuid] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  
  useEffect(() => {
    loadAllData();
    loadUserData();
  }, []);
  
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
      alert('✅ Order created successfully!');
    } catch (error: any) {
      console.error('Error creating order:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.detail
        || JSON.stringify(error.response?.data)
        || 'Failed to create order';
      alert(`❌ ${errorMessage}`);
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
      alert('Please enter a manifest UUID');
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
            onClick={() => navigate('/pharmacist/orders')}
            className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-gray-400 hover:bg-[#0a0e1a]/50 hover:text-white"
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
            <span className="text-sm font-medium">Verify</span>
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
          
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-[#0a0e1a]/50 text-left transition-colors">
            <div className="size-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <Icon name="report_problem" className="text-lg" />
            </div>
            <span className="text-sm font-medium">Report Issue</span>
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
            <h2 className="text-xl font-bold text-white">Pharmacy Command Center</h2>
            {stats.shippedOrders > 0 && (
              <span className="px-3 py-1 rounded-full bg-[#0055FF]/20 text-[#0055FF] border border-[#0055FF]/30 text-xs font-bold flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {stats.shippedOrders} shipment{stats.shippedOrders > 1 ? 's' : ''} ready
              </span>
            )}
          </div>
        </header>
        
        {/* Scrollable Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8">
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
        </div>
      </main>
      
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
    </div>
  );
};

export default PharmacistInventoryDashboard;
