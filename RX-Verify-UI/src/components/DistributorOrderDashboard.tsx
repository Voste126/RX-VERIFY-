import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Loader2, Calendar } from 'lucide-react';
import { 
  getDistributorOrders, 
  fulfillOrder,
  type SupplyOrder,
  type FulfillOrderRequest 
} from '../services/orders';

const DistributorOrderDashboard: React.FC = () => {
  const [orders, setOrders] = useState<SupplyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Fulfillment modal states
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SupplyOrder | null>(null);
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [fulfillmentResult, setFulfillmentResult] = useState<any>(null);
  
  useEffect(() => {
    loadOrders();
  }, []);
  
  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getDistributorOrders();
      setOrders(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  
  const openFulfillModal = (order: SupplyOrder) => {
    setSelectedOrder(order);
    setBatchNumber('');
    setExpiryDate('');
    setFulfillmentResult(null);
    setShowFulfillModal(true);
  };
  
  const closeFulfillModal = () => {
    setShowFulfillModal(false);
    setSelectedOrder(null);
    setBatchNumber('');
    setExpiryDate('');
    setFulfillmentResult(null);
  };
  
  const handleFulfillOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrder || !batchNumber.trim() || !expiryDate) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const medicineId = selectedOrder.items[0].medicine_id;
      
      const data: FulfillOrderRequest = {
        batch_number: batchNumber,
        expiry_date: expiryDate,
        medicine_id: medicineId
      };
      
      const result = await fulfillOrder(selectedOrder.id, data);
      setFulfillmentResult(result);
      
      // Refresh orders
      await loadOrders();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to fulfill order');
    } finally {
      setSubmitting(false);
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
  
  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const shippedOrders = orders.filter(o => o.status === 'SHIPPED');
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
  
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
          <h1 className="text-2xl font-bold">Incoming Orders</h1>
          <p className="text-gray-400 text-sm mt-1">Manage pharmacy orders and fulfill shipments</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#151923] border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <Package className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-3xl font-bold">{pendingOrders.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#151923] border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Truck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Shipped</p>
                <p className="text-3xl font-bold">{shippedOrders.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#151923] border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Delivered</p>
                <p className="text-3xl font-bold">{deliveredOrders.length}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Pending Orders Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Pending Orders</h2>
          <div className="bg-[#151923] rounded-2xl border border-gray-700 overflow-hidden">
            {pendingOrders.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No pending orders</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#0a0e1a] border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Pharmacist</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {pendingOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#0a0e1a]/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-gray-300">{order.id.slice(0, 8)}...</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-white">{order.pharmacist_name}</p>
                          {order.pharmacist_pharmacy && (
                            <p className="text-xs text-gray-500">{order.pharmacist_pharmacy}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {order.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openFulfillModal(order)}
                          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold text-sm transition-colors"
                        >
                          <Truck className="w-4 h-4" />
                          Fulfill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        
        {/* Shipped/Delivered Orders */}
        <div>
          <h2 className="text-xl font-bold mb-4">Order History</h2>
          <div className="bg-[#151923] rounded-2xl border border-gray-700 overflow-hidden">
            {[...shippedOrders, ...deliveredOrders].length === 0 ? (
              <div className="p-12 text-center">
                <Truck className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No fulfilled orders yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#0a0e1a] border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Pharmacist</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Batch</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Trust Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {[...shippedOrders, ...deliveredOrders].map((order) => (
                    <tr key={order.id} className="hover:bg-[#0a0e1a]/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-gray-300">{order.id.slice(0, 8)}...</td>
                      <td className="px-6 py-4 text-sm font-bold text-white">{order.pharmacist_name}</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-400">{order.manifest_batch || 'N/A'}</td>
                      <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4">
                        {order.manifest_trust_score ? (
                          <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-bold text-xs">
                            {order.manifest_trust_score}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      
      {/* Fulfillment Modal */}
      {showFulfillModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#151923] border border-gray-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            {!fulfillmentResult ? (
              <>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Truck className="w-6 h-6 text-primary" />
                  Fulfill Order #{selectedOrder.id.slice(0, 8)}
                </h3>
                
                <div className="bg-[#0a0e1a] border border-gray-700 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-bold text-gray-400 mb-2">Order Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pharmacist:</span>
                      <span className="font-bold text-white">{selectedOrder.pharmacist_name}</span>
                    </div>
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Medicine:</span>
                          <span className="text-white">{item.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Quantity:</span>
                          <span className="text-white">{item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <form onSubmit={handleFulfillOrder} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">
                      Batch Number *
                    </label>
                    <input
                      type="text"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      required
                      placeholder="e.g., BATCH-2026-001"
                      className="w-full px-4 py-3 bg-[#0a0e1a] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">
                      Expiry Date *
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 bg-[#0a0e1a] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                      />
                      <Calendar className="absolute right-3 top-3 w-5 h-5 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeFulfillModal}
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
                          Fulfilling...
                        </>
                      ) : (
                        <>
                          <Truck className="w-4 h-4" />
                          Fulfill Order
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-green-400 mb-2">
                    {fulfillmentResult.message}
                  </h3>
                </div>
                
                <div className="bg-[#0a0e1a] border border-gray-700 rounded-lg p-4 mb-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Lot Manifest ID:</span>
                    <span className="font-mono text-white text-sm">{fulfillmentResult.qr_data.slice(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Batch Number:</span>
                    <span className="font-mono text-white">{fulfillmentResult.batch_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trust Score:</span>
                    <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-bold text-xs">
                      {fulfillmentResult.trust_score}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order Status:</span>
                    <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold text-xs">
                      {fulfillmentResult.order_status}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={closeFulfillModal}
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

export default DistributorOrderDashboard;
