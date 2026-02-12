import React, { useState, useEffect } from 'react';
import { Package, ClipboardCheck, Plus, QrCode, Loader2, Lock, LockOpen, CheckCircle, AlertTriangle } from 'lucide-react';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import ErrorModal from './ErrorModal';
import { 
  createOrder, 
  getPharmacistOrders, 
  verifyReceipt,
  getOrderManifest,
  type SupplyOrder, 
  type OrderItem,
  type ManifestDetails 
} from '../services/orders';
import api from '../services/api';

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

const PharmacistOrderDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'new'>('orders');
  const [orders, setOrders] = useState<SupplyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedDistributor, setSelectedDistributor] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [quantity, setQuantity] = useState(100);
  
  // Verification states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [scannedUuid, setScannedUuid] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  
  // Digital Bill of Lading states
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [inspectingOrder, setInspectingOrder] = useState<SupplyOrder | null>(null);
  const [manifestDetails, setManifestDetails] = useState<ManifestDetails | null>(null);
  const [scannedPhysicalUuid, setScannedPhysicalUuid] = useState('');
  const [verificationMatch, setVerificationMatch] = useState<'match' | 'mismatch' | null>(null);
  const [locked, setLocked] = useState(true);
  
  // Error Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'error' | 'success' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', type: 'info' });
  
  const showModal = (title: string, message: string, type: 'error' | 'success' | 'warning' | 'info' = 'info') => {
    setModal({ isOpen: true, title, message, type });
  };
  
  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, distributorsData, medicinesData] = await Promise.all([
        getPharmacistOrders(),
        api.get<{results: Distributor[]}>('/distributors/').then(r => r.data.results || r.data),
        api.get<{results: Medicine[]}>('/medicines/').then(r => r.data.results || r.data)
      ]);
      
      setOrders(ordersData);
      setDistributors(distributorsData);
      setMedicines(medicinesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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
      const items: OrderItem[] = [{
        medicine_id: selectedMedicine,
        quantity: quantity
      }];
      
      await createOrder({
        distributor: selectedDistributor,
        items
      });
      
      // Refresh orders
      await loadData();
      
      // Reset form
      setSelectedDistributor('');
      setSelectedMedicine('');
      setQuantity(100);
      setActiveTab('orders');
      
      showModal('Order Placed', '✓ Order placed successfully!', 'success');
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
  
  const handleVerifyReceipt = async () => {
    if (!scannedUuid.trim()) {
      alert('Please enter a manifest UUID');
      return;
    }
    
    try {
      setSubmitting(true);
      const result = await verifyReceipt({ scanned_uuid: scannedUuid });
      setVerificationResult(result);
      
      // Refresh orders to update status
      await loadData();
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
  
  const openVerifyModal = () => {
    setScannedUuid('');
    setVerificationResult(null);
    setShowVerifyModal(true);
  };
  
  const closeVerifyModal = () => {
    setShowVerifyModal(false);
    setScannedUuid('');
    setVerificationResult(null);
  };
  
  const openInspectModal = async (order: SupplyOrder) => {
    setInspectingOrder(order);
    setLocked(true);
    setShowInspectModal(true);
    setScannedPhysicalUuid('');
    setVerificationMatch(null);
    
    // Animate unlock
    setTimeout(() => setLocked(false), 300);
    
    // Fetch manifest details
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
    setInspectingOrder(null);
    setManifestDetails(null);
    setScannedPhysicalUuid('');
    setVerificationMatch(null);
    setLocked(true);
  };
  
  const handlePhysicalScan = (scannedValue: string) => {
    setScannedPhysicalUuid(scannedValue);
    
    if (!manifestDetails) return;
    
    // Compare scanned UUID with digital manifest
    if (scannedValue.trim().toLowerCase() === manifestDetails.manifest_id.toLowerCase()) {
      setVerificationMatch('match');
    } else {
      setVerificationMatch('mismatch');
    }
  };
  
  const handleCompleteVerification = async () => {
    if (verificationMatch === 'match' && manifestDetails && inspectingOrder) {
      // Trigger receipt verification
      try {
        setSubmitting(true);
        await verifyReceipt({ scanned_uuid: manifestDetails.manifest_id });
        closeInspectModal();
        await loadData();
        showModal('Verification Complete', '✓ Shipment successfully verified and received!', 'success');
      } catch (error: any) {
        console.error('Error verifying receipt:', error);
        showModal('Verification Failed', error.response?.data?.error || 'Failed to verify receipt', 'error');
      } finally {
        setSubmitting(false);
      }
    }
  };
  
  const getStatusBadge = (status: SupplyOrder['status']) => {
    const styles = {
      PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      SHIPPED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      DELIVERED: 'bg-green-500/20 text-green-400 border-green-500/30',
      REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full border font-bold text-xs ${styles[status]}`}>
        {status}
      </span>
    );
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Header */}
      <div className="bg-[#151923] border-b border-gray-700 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Supply Chain Orders</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your pharmacy orders</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-[#151923] text-gray-400 hover:bg-[#0a0e1a]/50'
            }`}
          >
            <Package className="w-5 h-5" />
            My Orders
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'new'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-[#151923] text-gray-400 hover:bg-[#0a0e1a]/50'
            }`}
          >
            <Plus className="w-5 h-5" />
            New Order
          </button>
        </div>
        
        {/* Tab 1: My Orders */}
        {activeTab === 'orders' && (
          <div className="bg-[#151923] rounded-2xl border border-gray-700 overflow-hidden">
            {orders.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No orders yet</p>
                <button
                  onClick={() => setActiveTab('new')}
                  className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold"
                >
                  Place Your First Order
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#0a0e1a] border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Distributor</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#0a0e1a]/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-gray-300">{order.id.slice(0, 8)}...</td>
                      <td className="px-6 py-4 text-sm font-bold text-white">{order.distributor_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {order.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {order.status === 'SHIPPED' && (
                          <button
                            onClick={() => openInspectModal(order)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 font-bold text-sm transition-colors"
                          >
                            <Lock className="w-4 h-4" />
                            Inspect Shipment
                          </button>
                        )}
                        {order.status === 'DELIVERED' && (
                          <span className="text-green-400 font-bold text-sm flex items-center gap-2">
                            <ClipboardCheck className="w-4 h-4" />
                            Received
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        
        {/* Tab 2: New Order */}
        {activeTab === 'new' && (
          <div className="bg-[#151923] rounded-2xl border border-gray-700 p-8">
            <h2 className="text-xl font-bold mb-6">Place New Order</h2>
            
            <form onSubmit={handleCreateOrder} className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Select Distributor
                </label>
                <select
                  value={selectedDistributor}
                  onChange={(e) => setSelectedDistributor(e.target.value)}
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
                  className="w-full px-4 py-3 bg-[#0a0e1a] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                >
                  <option value="">Choose a medicine...</option>
                  {medicines.map(med => (
                    <option key={med.id} value={med.id}>
                      {med.name} - {med.active_ingredient} {med.strength}
                    </option>
                  ))}
                </select>
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
              
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5" />
                    Place Order
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
      
      {/* Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#151923] border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <QrCode className="w-6 h-6 text-primary" />
              Verify Receipt
            </h3>
            
            {!verificationResult ? (
              <>
                <p className="text-gray-400 text-sm mb-4">
                  Scan the QR code or enter the manifest UUID to verify delivery
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
                    {submitting ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={`p-4 rounded-lg mb-4 ${
                  verificationResult.chain_of_custody 
                    ? 'bg-green-500/10 border border-green-500/30' 
                    : verificationResult.status === 'VERIFIED'
                    ? 'bg-blue-500/10 border border-blue-500/30'
                    : 'bg-red-500/10 border border-red-500/30'
                }`}>
                  <p className={`font-bold mb-2 ${
                    verificationResult.chain_of_custody ? 'text-green-400' : 
                    verificationResult.status === 'VERIFIED' ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    {verificationResult.message}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trust Score:</span>
                      <span className="font-bold text-white">{verificationResult.trust_score}</span>
                    </div>
                    {verificationResult.bonus_applied && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bonus:</span>
                        <span className="font-bold text-green-400">{verificationResult.bonus_applied}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Batch:</span>
                      <span className="font-mono text-white">{verificationResult.batch_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Medicine:</span>
                      <span className="text-white">{verificationResult.medicine_name}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={closeVerifyModal}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold transition-colors"
                >
                  Close
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
                    
                    <div>
                      <label className="text-xs text-gray-400 uppercase font-bold">Trust Score</label>
                      <p className="text-green-400 font-bold text-xl">{manifestDetails.trust_score}</p>
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
                        <button
                          onClick={handleCompleteVerification}
                          disabled={submitting}
                          className="w-full mt-4 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold transition-colors disabled:opacity-50"
                        >
                          {submitting ? 'Processing...' : 'Complete Verification & Receive'}
                        </button>
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
    </div>
  );
};

export default PharmacistOrderDashboard;
