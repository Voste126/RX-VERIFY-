import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, Package, Truck } from 'lucide-react';
import Icon from './Icon';
import ErrorModal from './ErrorModal';
import { distributorService, type Medicine, type LotManifest, type DistributorEntity } from '../services/distributor';
import { authService } from '../services/auth';
import { getDistributorOrders, fulfillOrder, type SupplyOrder } from '../services/orders';
import TrustBadge from './TrustBadge';

interface DashboardStats {
  totalMedicines: number;
  totalManifests: number;
  totalOrders: number;
  pendingOrders: number;
  pendingVerifications: number;
  entityStatus: 'registered' | 'pending' | 'none';
}

const DistributorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // User and entity state
  const [user, setUser] = useState<any>(null);
  const [distributorEntity, setDistributorEntity] = useState<DistributorEntity | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  
  // Data state
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [manifests, setManifests] = useState<LotManifest[]>([]);
  const [orders, setOrders] = useState<SupplyOrder[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalMedicines: 0,
    totalManifests: 0,
    totalOrders: 0,
    pendingOrders: 0,
    pendingVerifications: 0,
    entityStatus: 'none'
  });
  
  // Form states
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [showManifestForm, setShowManifestForm] = useState(false);
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SupplyOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'error' | 'success' | 'warning' | 'info';
  }>({  
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  
  const showModal = (title: string, message: string, type: 'error' | 'success' | 'warning' | 'info' = 'info') => {
    setModal({ isOpen: true, title, message, type });
  };
  
  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };
  
  const [entityFormData, setEntityFormData] = useState({ name: '', license_number: '' });
  const [medicineFormData, setMedicineFormData] = useState({
    name: '',
    category: '',
    active_ingredient: '',
    strength: '',
    dosage_form: '',
    manufacturer_name: ''
  });
  const [manifestFormData, setManifestFormData] = useState({
    medicine: '',
    batch_number: '',
    expiry_date: ''
  });
  const [fulfillFormData, setFulfillFormData] = useState({
    manifest_id: ''  // Only need manifest selection
  });
  
  const location = useLocation();

  // Load user data and check for entity
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = sessionStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // Check if user has a distributor entity
          const entities = await distributorService.getDistributorEntities();
          
          if (entities && entities.length > 0) {
            const entity = entities[0];
            setDistributorEntity(entity);
            setStats(prev => ({ ...prev, entityStatus: 'registered' }));
            
            // Store entity ID in sessionStorage for backup
            sessionStorage.setItem('distributor_entity_id', entity.id);
            
            // Load medicines, manifests, and orders
            await loadMedicines(entity.id);
            await loadManifests(entity.id);
            await loadOrders();
          } else {
            setStats(prev => ({ ...prev, entityStatus: 'none' }));
            sessionStorage.removeItem('distributor_entity_id');
          }
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [location.key]);
  
  const loadMedicines = async (distributorId?: string) => {
    try {
      const data = await distributorService.getMedicines({ 
        search: searchQuery,
        distributor: distributorId  // Pass distributor filter to backend
      });
      setMedicines(data);
      setStats(prev => ({ ...prev, totalMedicines: data.length }));
    } catch (error) {
    }
  };
  
  const loadManifests = async (distributorId?: string) => {
    try {
      const data = await distributorService.getLotManifests({ distributor: distributorId });
      setManifests(data);
      setStats(prev => ({ ...prev, totalManifests: data.length }));
    } catch (error) {
    }
  };
  
  const loadOrders = async () => {
    try {
      const data = await getDistributorOrders();
      setOrders(data);
      const pending = data.filter((order: SupplyOrder) => order.status === 'PENDING');
      setStats(prev => ({ 
        ...prev, 
        totalOrders: data.length,
        pendingOrders: pending.length 
      }));
    } catch (error) {
    }
  };
  

  
  const handleFulfillOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !fulfillFormData.manifest_id) return;
    
    try {
      setSubmitting(true);
      
      const response = await fulfillOrder(selectedOrder.id, {
        manifest_id: fulfillFormData.manifest_id
      });
      
      // Refresh orders and manifests
      await loadOrders();
      await loadManifests(distributorEntity?.id);
      
      // Reset and close
      setShowFulfillModal(false);
      setSelectedOrder(null);
      setFulfillFormData({ manifest_id: '' });
      
      
      showModal(
        'Order Fulfilled Successfully',
        `Batch: ${response.batch_number}\nTrust Score: ${response.trust_score}`,
        'success'
      );
    } catch (error: any) {
      showModal(
        'Order Fulfillment Failed',
        error.response?.data?.error || 'Failed to fulfill order',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };
  
  // Entity Registration with Ed25519 Key Generation
  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const generateKeyPair = () => {
        const privateKey = Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        return { privateKey };
      };
      
      const { privateKey: privKey } = generateKeyPair();
      
      // Create entity with public key
      const entity = await distributorService.createDistributorEntity({
        name: entityFormData.name,
        is_verified_regulator: false
      });
      
      setDistributorEntity(entity);
      setPrivateKey(privKey);
      setShowKeyModal(true);
      setShowEntityForm(false);
      setStats(prev => ({ ...prev, entityStatus: 'registered' }));
    } catch (error: any) {
      showModal(
        'Entity Creation Failed',
        error.response?.data?.message || 'Failed to create entity',
        'error'
      );
    }
  };
  
  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributorEntity) {
      showModal(
        'Entity Required',
        'Please register your distributor entity first before creating medicines.',
        'warning'
      );
      return;
    }
    
    try {
      await distributorService.createMedicine({
        ...medicineFormData,
        distributor: distributorEntity.id  // Add distributor ID
      });
      setShowMedicineForm(false);
      setMedicineFormData({
        name: '',
        category: '',
        active_ingredient: '',
        strength: '',
        dosage_form: '',
        manufacturer_name: ''
      });
      await loadMedicines(distributorEntity.id);
    } catch (error: any) {
      
      // Parse validation errors from backend
      const errorData = error.response?.data;
      let errorMessage = 'Failed to create medicine';
      
      if (errorData && typeof errorData === 'object') {
        // Handle field-specific validation errors
        const errors = [];
        for (const [field, messages] of Object.entries(errorData)) {
          if (Array.isArray(messages)) {
            errors.push(`${field}: ${messages.join(', ')}`);
          } else if (typeof messages === 'string') {
            errors.push(`${field}: ${messages}`);
          }
        }
        if (errors.length > 0) {
          errorMessage = errors.join('\n');
        }
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
      
      showModal('Medicine Creation Failed', errorMessage, 'error');
    }
  };
  
  const handleCreateManifest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributorEntity) {
      showModal(
        'Entity Required',
        'Please register your distributor entity first before creating manifests.',
        'warning'
      );
      return;
    }
    
    try {
      // Add distributor ID to the payload
      const newManifest = await distributorService.createLotManifest({
        ...manifestFormData,
        distributor: distributorEntity.id  // Add distributor ID
      });
      
      // Reset form and close modal
      setShowManifestForm(false);
      setManifestFormData({
        medicine: '',
        batch_number: '',
        expiry_date: ''
      });
      
      // Reload manifests to show the new one
      await loadManifests(distributorEntity.id);
      
      // Success message
      showModal(
        'Manifest Created Successfully',
        `Batch: ${newManifest.batch_number}\nTrust Score: ${newManifest.trust_score}%`,
        'success'
      );
    } catch (error: any) {
      
      // Parse validation errors from backend
      const errorData = error.response?.data;
      let errorMessage = 'Failed to create manifest';
      
      if (errorData && typeof errorData === 'object') {
        // Handle field-specific validation errors
        const errors = [];
        for (const [field, messages] of Object.entries(errorData)) {
          if (Array.isArray(messages)) {
            const fieldName = field.replace('_', ' ');
            errors.push(`${fieldName}: ${messages.join(', ')}`);
          } else if (typeof messages === 'string') {
            errors.push(`${field}: ${messages}`);
          }
        }
        if (errors.length > 0) {
          errorMessage = errors.join('\n');
        }
        
        // Special handling for duplicate batch number
        if (errorData.batch_number && errorData.batch_number[0]?.includes('already exists')) {
          errorMessage = `⚠️ Batch number "${manifestFormData.batch_number}" already exists.\n\nPlease use a different batch number or check the Manifests tab to view the existing manifest.`;
        }
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
      
      showModal('Manifest Creation Failed', errorMessage, 'error');
    }
  };
  
  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };
  
  const downloadPrivateKey = () => {
    const element = document.createElement('a');
    const file = new Blob([privateKey], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `distributor-private-key-${Date.now()}.pem`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  const copyPrivateKey = () => {
    navigator.clipboard.writeText(privateKey);
    showModal('Copied!', 'Private key copied to clipboard successfully.', 'success');
  };
  
  const closeKeyModal = () => {
    setShowKeyModal(false);
    setPrivateKey(''); // Clear from memory
  };
  
  if (loading) {
    return (
      <div className="bg-[#0a0e1a] h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon name="hourglass_empty" className="text-6xl text-primary animate-spin" />
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
            <Icon name="local_shipping" className="text-primary text-2xl" />
          </div>
          <div>
            <h1 className="text-white text-lg font-bold leading-tight tracking-tight">RxVerify Lite</h1>
            <p className="text-gray-400 text-xs font-medium">Distributor Portal</p>
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
            onClick={() => setActiveTab('medicines')}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
              activeTab === 'medicines'
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-gray-400 hover:bg-[#0a0e1a]/50 hover:text-white'
            }`}
          >
            <Icon name="medication" />
            <span className="text-sm font-medium">Medicines</span>
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
            {stats.pendingOrders > 0 && (
              <span className="ml-auto bg-[#FF6B00] text-white text-xs font-bold rounded-full px-2 py-0.5">
                {stats.pendingOrders}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('manifests')}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
              activeTab === 'manifests'
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-gray-400 hover:bg-[#0a0e1a]/50 hover:text-white'
            }`}
          >
            <Icon name="assignment" />
            <span className="text-sm font-medium">Manifests</span>
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
              activeTab === 'settings'
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-gray-400 hover:bg-[#0a0e1a]/50 hover:text-white'
            }`}
          >
            <Icon name="settings" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </nav>
        
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#0a0e1a]/50 cursor-pointer transition-colors" onClick={handleLogout}>
            <div className="size-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="flex flex-col overflow-hidden flex-1">
              <p className="text-sm font-bold text-white truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-gray-400 truncate">Distributor</p>
            </div>
            <Icon name="logout" className="text-gray-400" />
          </div>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 shrink-0 bg-[#151923]/80 backdrop-blur-md border-b border-gray-700 flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'medicines' && 'Medicine Catalog'}
              {activeTab === 'orders' && 'Pending Orders'}
              {activeTab === 'manifests' && 'Lot Manifests'}
              {activeTab === 'settings' && 'Settings'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl" />
              <input
                className="h-10 pl-10 pr-4 w-80 rounded-lg border border-gray-700 bg-[#0a0e1a] text-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 placeholder-gray-500"
                placeholder="Search..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
              {/* Entity Status Card */}
              {stats.entityStatus === 'none' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-xl">
                  <div className="flex items-start gap-4">
                    <Icon name="warning" className="text-yellow-600 text-3xl" />
                    <div className="flex-1">
                      <h3 className="font-bold text-yellow-900 text-lg">Entity Registration Required</h3>
                      <p className="text-yellow-700 text-sm mt-1">You need to register your distributor entity before you can manage medicines and manifests.</p>
                      <button
                        onClick={() => setShowEntityForm(true)}
                        className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-bold text-sm transition-colors"
                      >
                        Register Entity Now
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#151923] p-5 rounded-2xl border border-gray-700 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group hover:border-primary/50 transition-all">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon name="medication" className="text-6xl text-primary" />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="medication" className="text-primary text-xl" />
                    <p className="text-sm font-semibold text-gray-400">Medicines Registered</p>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-white">{stats.totalMedicines}</p>
                  </div>
                </div>
                
                <div className="bg-[#151923] p-5 rounded-2xl border border-gray-700 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group hover:border-blue-500/50 transition-all">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon name="assignment" className="text-6xl text-blue-500" />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="assignment" className="text-blue-500 text-xl" />
                    <p className="text-sm font-semibold text-gray-400">Manifests Created</p>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-white">{stats.totalManifests}</p>
                  </div>
                </div>
                
                <div className="bg-[#151923] p-5 rounded-2xl border border-gray-700 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group hover:border-[#FF6B00]/50 transition-all">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon name="local_shipping" className="text-6xl text-[#FF6B00]" />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="local_shipping" className="text-[#FF6B00] text-xl" />
                    <p className="text-sm font-semibold text-gray-400">Orders</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-extrabold text-white">{stats.totalOrders}</p>
                    {stats.pendingOrders > 0 && (
                      <span className="px-2 py-1 rounded-full bg-[#FF6B00]/20 text-[#FF6B00] text-xs font-bold border border-[#FF6B00]/30">
                        {stats.pendingOrders} pending
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="bg-[#151923] p-5 rounded-2xl border border-gray-700 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group hover:border-green-500/50 transition-all">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon name="verified" className="text-6xl text-green-500" />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="verified" className="text-green-500 text-xl" />
                    <p className="text-sm font-semibold text-gray-400">Verifications</p>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-white">{stats.pendingVerifications}</p>
                  </div>
                </div>
                
                <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group transition-all ${
                  stats.entityStatus === 'registered' ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50' : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                }`}>
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon name="business" className={`text-6xl ${stats.entityStatus === 'registered' ? 'text-green-400' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="business" className={`text-xl ${stats.entityStatus === 'registered' ? 'text-green-400' : 'text-gray-500'}`} />
                    <p className="text-sm font-semibold text-gray-400">Entity Status</p>
                  </div>
                  <div>
                    <p className={`text-lg font-extrabold ${stats.entityStatus === 'registered' ? 'text-green-400' : 'text-gray-500'}`}>
                      {stats.entityStatus === 'registered' ? '✓ Registered' : 'Not Registered'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* QR Codes Gallery */}
              <div className="bg-[#151923] rounded-2xl border border-gray-700 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Icon name="qr_code_2" className="text-primary" />
                    Recent QR Codes
                  </h3>
                  {manifests.length > 0 && (
                    <button
                      onClick={() => setActiveTab('manifests')}
                      className="text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      View All
                    </button>
                  )}
                </div>
                
                {manifests.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Icon name="qr_code_2" className="text-5xl opacity-30" />
                    <p className="mt-3 text-sm">No QR codes generated yet</p>
                    <p className="text-xs mt-1 text-gray-500">Create a manifest to generate QR codes</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {manifests.slice(0, 4).map((manifest) => (
                      <div 
                        key={manifest.id} 
                        className="bg-[#0a0e1a] border border-gray-700 rounded-xl p-4 hover:border-primary/50 transition-all cursor-pointer group"
                        onClick={() => navigate(`/distributor/qr-codes/${manifest.id}`)}
                      >
                        <div className="bg-white rounded-lg p-3 mb-3 flex items-center justify-center">
                          <QRCodeSVG
                            value={manifest.id}
                            size={80}
                            level="M"
                            className="group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <p className="text-xs font-mono font-bold text-white truncate mb-1">
                          {manifest.batch_number}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-bold">
                            {manifest.trust_score}%
                          </span>
                          <Icon name="arrow_forward" className="text-primary text-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Data Visualizations Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trust Score Distribution */}
                <div className="bg-[#151923] rounded-2xl border border-gray-700 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Icon name="analytics" className="text-blue-400" />
                    Trust Score Overview
                  </h3>
                  {manifests.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Icon name="bar_chart" className="text-4xl opacity-30" />
                      <p className="mt-2 text-sm">No data available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(() => {
                        const avgScore = manifests.reduce((sum, m) => sum + parseFloat(m.trust_score), 0) / manifests.length;
                        const scoreColor = avgScore >= 90 ? 'bg-green-500' : avgScore >= 70 ? 'bg-yellow-500' : 'bg-red-500';
                        const scoreBgColor = avgScore >= 90 ? 'bg-green-500/10 border border-green-500/30' : avgScore >= 70 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-red-500/10 border border-red-500/30';
                        const scoreTextColor = avgScore >= 90 ? 'text-green-400' : avgScore >= 70 ? 'text-yellow-400' : 'text-red-400';
                        
                        return (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-400">Average Trust Score</span>
                              <span className={`text-2xl font-black ${scoreTextColor}`}>{avgScore.toFixed(1)}%</span>
                            </div>
                            <div className="relative h-8 bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className={`absolute inset-y-0 left-0 ${scoreColor} rounded-full transition-all duration-500`}
                                style={{ width: `${avgScore}%` }}
                              >
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-4">
                              <div className={`${avgScore >= 90 ? scoreBgColor : 'bg-green-500/10 border border-green-500/30'} rounded-lg p-3 text-center`}>
                                <Icon name="verified" className="text-green-400" />
                                <p className="text-2xl font-bold text-green-400 mt-1">{manifests.filter(m => parseFloat(m.trust_score) >= 90).length}</p>
                                <p className="text-xs text-gray-500 mt-1">High Trust</p>
                              </div>
                              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                                <Icon name="warning" className="text-yellow-400" />
                                <p className="text-2xl font-bold text-yellow-400 mt-1">{manifests.filter(m => parseFloat(m.trust_score) >= 70 && parseFloat(m.trust_score) < 90).length}</p>
                                <p className="text-xs text-gray-500 mt-1">Medium</p>
                              </div>
                              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                                <Icon name="error" className="text-red-400" />
                                <p className="text-2xl font-bold text-red-400 mt-1">{manifests.filter(m => parseFloat(m.trust_score) < 70).length}</p>
                                <p className="text-xs text-gray-500 mt-1">Low Trust</p>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Medicines by Category */}
                <div className="bg-[#151923] rounded-2xl border border-gray-700 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Icon name="pie_chart" className="text-purple-400" />
                    Medicines by Category
                  </h3>
                  {medicines.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Icon name="category" className="text-4xl opacity-30" />
                      <p className="mt-2 text-sm">No medicines registered</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(() => {
                        const categoryCounts = medicines.reduce((acc, med) => {
                          acc[med.category] = (acc[med.category] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);
                        
                        const sortedCategories = Object.entries(categoryCounts)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 5);
                        
                        const maxCount = Math.max(...sortedCategories.map(([, count]) => count));
                        const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500'];
                        
                        return sortedCategories.map(([category, count], index) => (
                          <div key={category} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-white truncate">{category}</span>
                              <span className="text-gray-400 font-bold ml-2">{count}</span>
                            </div>
                            <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className={`absolute inset-y-0 left-0 ${colors[index % colors.length]} rounded-full transition-all duration-500`}
                                style={{ width: `${(count / maxCount) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-[#151923] rounded-2xl border border-gray-700 shadow-sm p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Icon name="history" className="text-cyan-400" />
                  Recent Activity
                </h3>
                {medicines.length === 0 && manifests.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Icon name="history" className="text-5xl opacity-30" />
                    <p className="mt-3">No recent activity</p>
                    <p className="text-sm mt-1 text-gray-500">Start by creating medicines and manifests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      // Combine and sort activities
                      const activities = [
                        ...manifests.slice(0, 4).map(m => ({
                          type: 'manifest' as const,
                          id: m.id,
                          title: `Created manifest for batch ${m.batch_number}`,
                          subtitle: `Trust Score: ${m.trust_score}%`,
                          icon: 'assignment' as const,
                          color: 'text-blue-400',
                          bgColor: 'bg-blue-500/10 border border-blue-500/30'
                        })),
                        ...medicines.slice(0, 4).map(m => ({
                          type: 'medicine' as const,
                          id: m.id,
                          title: `Registered medicine: ${m.name}`,
                          subtitle: `${m.active_ingredient} - ${m.strength}`,
                          icon: 'medication' as const,
                          color: 'text-primary',
                          bgColor: 'bg-primary/10 border border-primary/30'
                        }))
                      ].slice(0, 6);
                      
                      return activities.map((activity) => (
                        <div 
                          key={`${activity.type}-${activity.id}`}
                          className="flex items-start gap-4 p-4 rounded-xl hover:bg-[#0a0e1a]/50 transition-colors group"
                        >
                          <div className={`size-10 rounded-lg ${activity.bgColor} flex items-center justify-center shrink-0`}>
                            <Icon name={activity.icon} className={`${activity.color} text-xl`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-sm">{activity.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{activity.subtitle}</p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {activity.type === 'manifest' && (
                              <button
                                onClick={() => navigate(`/distributor/qr-codes/${activity.id}`)}
                                className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 font-bold"
                              >
                                View QR
                              </button>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
          
          
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
              {/* Summary tabs */}
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="bg-[#151923] border border-[#FF6B00]/30 rounded-xl px-4 py-2 text-center">
                    <p className="text-lg font-extrabold text-[#FF6B00]">{orders.filter(o => o.status === 'PENDING').length}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                  <div className="bg-[#151923] border border-blue-500/30 rounded-xl px-4 py-2 text-center">
                    <p className="text-lg font-extrabold text-blue-400">{orders.filter(o => o.status === 'SHIPPED').length}</p>
                    <p className="text-xs text-gray-500">Shipped</p>
                  </div>
                  <div className="bg-[#151923] border border-green-500/30 rounded-xl px-4 py-2 text-center">
                    <p className="text-lg font-extrabold text-green-400">{orders.filter(o => o.status === 'DELIVERED').length}</p>
                    <p className="text-xs text-gray-500">Verified</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{orders.length} total orders</p>
              </div>
              
              {orders.filter(o => o.status === 'PENDING').length === 0 ? (
                <div className="bg-[#151923] rounded-2xl border border-gray-700 shadow-sm p-12 text-center">
                  <Package className="mx-auto text-gray-600" size={64} />
                  <p className="mt-4 text-gray-400">No pending orders</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.filter(o => o.status === 'PENDING').map((order) => (
                    <div key={order.id} className="bg-[#151923] rounded-2xl border border-gray-700 shadow-sm p-6 hover:border-primary/50 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 rounded-full bg-[#FF6B00]/20 text-[#FF6B00] text-xs font-bold border border-[#FF6B00]/30">
                              PENDING
                            </span>
                          </div>
                          <div className="flex items-start gap-2 mb-1">
                            <Icon name="receipt_long" className="text-gray-400 text-sm mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-400">Order ID</p>
                              <p className="text-white font-mono text-sm">{order.id}</p>
                            </div>
                          </div>
                          <h4 className="text-white font-bold text-lg mt-3">{order.pharmacist_name}</h4>
                          {order.pharmacist_pharmacy && (
                            <p className="text-gray-400 text-sm">{order.pharmacist_pharmacy}</p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            // Set first item medicine_id as default
                            if (order.items && order.items.length > 0) {
                              setFulfillFormData(prev => ({
                                ...prev,
                                medicine_id: order.items[0].medicine_id
                              }));
                            }
                            setShowFulfillModal(true);
                          }}
                          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold text-sm transition-colors flex items-center gap-2"
                        >
                              <Truck size={18} />
                          Fulfill Order
                        </button>
                      </div>
                      
                      <div className="border-t border-gray-700 pt-4 mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-white text-sm font-bold flex items-center gap-2">
                            <Package size={16} className="text-primary" />
                            Order Items ({order.items?.length || 0})
                          </h5>
                          <span className="text-xs text-gray-500">
                            Total: {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} units
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {order.items && order.items.length > 0 ? order.items.map((item, idx) => (
                            <div key={idx} className="bg-[#0a0e1a] rounded-lg border border-gray-700 p-4 hover:border-primary/50 transition-colors">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  {item.name ? (
                                    <>
                                      <p className="text-white text-base font-bold mb-1">{item.name}</p>
                                      <p className="text-xs text-gray-400 mb-1">Medicine ID</p>
                                      <p className="text-gray-500 font-mono text-xs break-all">{item.medicine_id}</p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-xs text-gray-400 mb-1">Medicine ID</p>
                                      <p className="text-white font-mono text-sm break-all">{item.medicine_id}</p>
                                    </>
                                  )}
                                </div>
                                <div className="shrink-0">
                                  <div className="bg-primary/20 border border-primary/30 rounded-lg px-3 py-2 text-center min-w-[60px]">
                                    <p className="text-primary text-xl font-bold">{item.quantity}</p>
                                    <p className="text-primary text-[10px] font-semibold uppercase">Units</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )) : (
                            <div className="col-span-2 text-center py-4">
                              <p className="text-gray-400 text-sm">No items found in this order</p>
                              <p className="text-xs text-gray-500 mt-1">Order data: {JSON.stringify(order.items)}</p>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
                          <Icon name="schedule" className="text-xs" />
                          Ordered: {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Verified / Delivered orders ─────────────────────── */}
              {orders.filter(o => o.status === 'DELIVERED' || o.status === 'SHIPPED').length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                    Fulfilled Orders
                  </h3>
                  {orders.filter(o => o.status === 'DELIVERED' || o.status === 'SHIPPED').map((order) => (
                    <div key={order.id} className={`bg-[#151923] rounded-2xl border shadow-sm p-6 transition-colors ${
                      order.status === 'DELIVERED' ? 'border-green-500/30 hover:border-green-500/50' : 'border-blue-500/30 hover:border-blue-500/50'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            {order.status === 'DELIVERED' ? (
                              <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">
                                ✓ VERIFIED BY PHARMACIST
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                                SHIPPED
                              </span>
                            )}
                            {order.manifest_batch && <span className="text-xs text-gray-500 font-mono">Batch: {order.manifest_batch}</span>}
                            {order.manifest_trust_score && (
                              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                                Trust {order.manifest_trust_score}%
                              </span>
                            )}
                          </div>
                          <h4 className="text-white font-bold">{order.pharmacist_name}</h4>
                          {order.pharmacist_pharmacy && <p className="text-gray-400 text-sm">{order.pharmacist_pharmacy}</p>}
                        </div>
                        <p className="text-xs text-gray-500 shrink-0">
                          {new Date(order.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      {order.status === 'DELIVERED' && (
                        <div className="mt-3 pt-3 border-t border-gray-700/60 flex items-center gap-2 text-xs text-green-500">
                          <Icon name="verified" className="text-base" />
                          Chain of custody complete — pharmacist confirmed receipt and authenticated this batch.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'medicines' && (
            <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Medicine Catalog</h3>
                <button
                  onClick={() => setShowMedicineForm(true)}
                  disabled={!distributorEntity}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Icon name="add" />
                  Add Medicine
                </button>
              </div>
              
              {medicines.length === 0 ? (
                <div className="bg-[#151923] rounded-2xl border border-gray-700 shadow-sm p-12 text-center">
                  <Icon name="medication" className="text-6xl text-gray-600" />
                  <p className="mt-4 text-gray-400">No medicines registered yet</p>
                </div>
              ) : (
                <div className="bg-[#151923] rounded-2xl border border-gray-700 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#0a0e1a] border-b border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Active Ingredient</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Strength</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Form</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {medicines.map((medicine) => (
                        <tr key={medicine.id} className="hover:bg-[#0a0e1a]/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-white">{medicine.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">{medicine.active_ingredient}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">{medicine.strength}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">{medicine.dosage_form}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">{medicine.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {/* Manifests Tab */}
          {activeTab === 'manifests' && (
            <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Lot Manifests</h3>
                <button
                  onClick={() => setShowManifestForm(true)}
                  disabled={!distributorEntity || medicines.length === 0}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Icon name="add" />
                  Create Manifest
                </button>
              </div>
              
              {manifests.length === 0 ? (
                <div className="bg-[#151923] rounded-2xl border border-gray-700 shadow-sm p-12 text-center">
                  <Icon name="assignment" className="text-6xl text-gray-600" />
                  <p className="mt-4 text-gray-400">No manifests created yet</p>
                </div>
              ) : (
                <div className="bg-[#151923] rounded-2xl border border-gray-700 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#0a0e1a] border-b border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Batch Number</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Expiry Date</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Trust Score</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Signature</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {[...manifests].sort((a, b) => {
                        const scoreA = parseFloat(a.trust_score.toString());
                        const scoreB = parseFloat(b.trust_score.toString());
                        if (scoreA < 80 && scoreB >= 80) return -1;
                        if (scoreA >= 80 && scoreB < 80) return 1;
                        return 0;
                      }).map((manifest) => {
                        const isAnomalous = parseFloat(manifest.trust_score.toString()) < 80;
                        return (
                          <tr 
                            key={manifest.id} 
                            className={`transition-all ${isAnomalous ? 'bg-red-900/10 hover:bg-red-900/20 animate-[pulse_3s_ease-in-out_infinite] border-l-4 border-l-red-500' : 'hover:bg-[#0a0e1a]/50'}`}
                          >
                            <td className="px-6 py-4 text-sm font-mono font-bold text-white">{manifest.batch_number}</td>
                            <td className="px-6 py-4 text-sm text-gray-400">{manifest.expiry_date}</td>
                            <td className="px-6 py-4 text-sm">
                              <TrustBadge score={manifest.trust_score} />
                            </td>
                            <td className="px-6 py-4 text-sm font-mono text-gray-400">{manifest.digital_signature.substring(0, 16)}...</td>
                            <td className="px-6 py-4 text-sm">
                              <button
                                onClick={() => navigate(`/distributor/qr-codes/${manifest.id}`)}
                                className="text-primary hover:text-primary/80 font-bold"
                              >
                                Generate QR
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
              {/* User Profile Card */}
              <div className="bg-gradient-to-br from-[#0a0e1a] to-[#151923] rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
                {/* Header with gradient */}
                <div className="h-32 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 relative">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0e1a] to-transparent"></div>
                </div>
                
                {/* Profile Content */}
                <div className="px-8 pb-8 -mt-16 relative z-10">
                  <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
                    {/* Avatar */}
                    <div className="size-32 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center text-white font-black text-5xl shadow-2xl shadow-purple-500/30 ring-4 ring-[#0a0e1a] group-hover:scale-105 transition-transform">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-3xl font-black text-white mb-1">
                        {user?.first_name} {user?.last_name}
                      </h2>
                      <p className="text-gray-400 text-lg mb-2">@{user?.username}</p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 border border-primary/30">
                        <Icon name="local_shipping" className="text-primary" />
                        <span className="text-primary font-bold text-sm">{user?.role}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* User Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email Card */}
                    <div className="bg-[#151923] border border-gray-700 rounded-xl p-5 hover:border-blue-500/50 transition-all group">
                      <div className="flex items-start gap-4">
                        <div className="size-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                          <Icon name="email" className="text-blue-400 text-2xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-400 text-sm font-medium mb-1">Email Address</p>
                          <p className="text-white font-bold truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Username Card */}
                    <div className="bg-[#151923] border border-gray-700 rounded-xl p-5 hover:border-purple-500/50 transition-all group">
                      <div className="flex items-start gap-4">
                        <div className="size-12 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:bg-purple-500/20 transition-colors">
                          <Icon name="person" className="text-purple-400 text-2xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-400 text-sm font-medium mb-1">Username</p>
                          <p className="text-white font-bold truncate">@{user?.username}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* User ID Card */}
                    <div className="bg-[#151923] border border-gray-700 rounded-xl p-5 hover:border-cyan-500/50 transition-all group">
                      <div className="flex items-start gap-4">
                        <div className="size-12 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0 group-hover:bg-cyan-500/20 transition-colors">
                          <Icon name="badge" className="text-cyan-400 text-2xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-400 text-sm font-medium mb-1">User ID</p>
                          <p className="text-white font-mono text-sm truncate">{user?.id}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Role Card */}
                    <div className="bg-[#151923] border border-gray-700 rounded-xl p-5 hover:border-green-500/50 transition-all group">
                      <div className="flex items-start gap-4">
                        <div className="size-12 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 group-hover:bg-green-500/20 transition-colors">
                          <Icon name="shield" className="text-green-400 text-2xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-400 text-sm font-medium mb-1">Account Role</p>
                          <p className="text-white font-bold">{user?.role}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Entity Information */}
                  {distributorEntity && (
                    <div className="mt-6 bg-[#151923] border border-gray-700 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <Icon name="business" className="text-yellow-400 text-2xl" />
                        <h3 className="text-xl font-bold text-white">Distributor Entity</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm font-medium mb-1">Company Name</p>
                          <p className="text-white font-bold">{distributorEntity.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm font-medium mb-1">Entity ID</p>
                          <p className="text-white font-mono text-sm truncate">{distributorEntity.id}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm font-medium mb-1">Verification Status</p>
                          <div className="flex items-center gap-2">
                            <Icon 
                              name={distributorEntity.is_verified_regulator ? "verified" : "pending"} 
                              className={distributorEntity.is_verified_regulator ? "text-green-400" : "text-yellow-400"} 
                            />
                            <p className={`font-bold ${distributorEntity.is_verified_regulator ? "text-green-400" : "text-yellow-400"}`}>
                              {distributorEntity.is_verified_regulator ? "Verified" : "Pending Verification"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm font-medium mb-1">Public Key</p>
                          <p className="text-white font-mono text-xs truncate">{distributorEntity.public_key?.substring(0, 32)}...</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Security Notice */}
                  <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
                    <Icon name="security" className="text-blue-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-blue-300 font-medium">Secure JWT Authentication</p>
                      <p className="text-gray-400 mt-1">Your session is protected with industry-standard JWT tokens and Ed25519 cryptographic signatures.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional Settings */}
              <div className="bg-[#151923] rounded-2xl border border-gray-700 shadow-sm p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Icon name="settings" className="text-primary" />
                  Account Settings
                </h3>
                <div className="space-y-3">
                  <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#0a0e1a]/50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Icon name="lock" className="text-gray-400 group-hover:text-primary transition-colors" />
                      <span className="font-medium text-white">Change Password</span>
                    </div>
                    <Icon name="chevron_right" className="text-gray-400" />
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#0a0e1a]/50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Icon name="notifications" className="text-gray-400 group-hover:text-primary transition-colors" />
                      <span className="font-medium text-white">Notification Preferences</span>
                    </div>
                    <Icon name="chevron_right" className="text-gray-400" />
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#0a0e1a]/50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Icon name="key" className="text-gray-400 group-hover:text-primary transition-colors" />
                      <span className="font-medium text-white">API Keys</span>
                    </div>
                    <Icon name="chevron_right" className="text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Entity Registration Modal */}
      {showEntityForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151923] border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Register Distributor Entity</h3>
            <form onSubmit={handleCreateEntity} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={entityFormData.name}
                  onChange={(e) => setEntityFormData({ ...entityFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-700 bg-[#0a0e1a] text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">License Number</label>
                <input
                  type="text"
                  required
                  value={entityFormData.license_number}
                  onChange={(e) => setEntityFormData({ ...entityFormData, license_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-700 bg-[#0a0e1a] text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowEntityForm(false)}
                  className="px-4 py-2 border border-gray-700 bg-[#0a0e1a] text-gray-300 rounded-lg hover:bg-gray-800 font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold text-sm"
                >
                  Generate Keys & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Fulfillment Modal */}
      {showFulfillModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151923] border border-gray-700 rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Truck className="text-primary" size={24} />
              Fulfill Order
            </h3>
            
            <div className="mb-6 p-4 bg-[#0a0e1a] rounded-xl border border-gray-700">
              <p className="text-sm text-gray-400 mb-1">Order ID</p>
              <p className="text-white font-mono text-sm">{selectedOrder.id}</p>
              <p className="text-sm text-gray-400 mt-3 mb-1">Pharmacist</p>
              <p className="text-white font-bold">{selectedOrder.pharmacist_name}</p>
              {selectedOrder.pharmacist_pharmacy && (
                <p className="text-gray-400 text-sm">{selectedOrder.pharmacist_pharmacy}</p>
              )}
            </div>
            
            <form onSubmit={handleFulfillOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Select Manifest to Ship</label>
                <select
                  required
                  value={fulfillFormData.manifest_id}
                  onChange={(e) => setFulfillFormData({ manifest_id: e.target.value })}
                  className="w-full px-3 py-2 border border-primary/50 bg-[#0a0e1a] text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                >
                  <option value="">-- Select a Lot Manifest --</option>
                  {manifests.map((manifest) => (
                    <option key={manifest.id} value={manifest.id}>
                      Batch: {manifest.batch_number} | Expires: {new Date(manifest.expiry_date).toLocaleDateString()} | Trust: {manifest.trust_score}%
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-2">
                  💡 Select an existing lot manifest that you've already created. QR code is already generated for the manifest.
                </p>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowFulfillModal(false);
                    setSelectedOrder(null);
                    setFulfillFormData({ manifest_id: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-[#0a0e1a] transition-colors font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !fulfillFormData.manifest_id}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Truck size={18} />
                      Fulfill & Generate QR
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Medicine Form Modal */}
      {showMedicineForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#151923] border border-gray-700 rounded-2xl p-6 max-w-2xl w-full my-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Add New Medicine</h3>
            <form onSubmit={handleCreateMedicine} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-300 mb-1">Medicine Name</label>
                  <input
                    type="text"
                    required
              value={medicineFormData.name}
                    onChange={(e) => setMedicineFormData({ ...medicineFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-700 bg-[#0a0e1a] text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Active Ingredient</label>
                  <input
                    type="text"
                    required
                    value={medicineFormData.active_ingredient}
                    onChange={(e) => setMedicineFormData({ ...medicineFormData, active_ingredient: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-700 bg-[#0a0e1a] text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Strength</label>
                  <input
                    type="text"
                    required
                    value={medicineFormData.strength}
                    onChange={(e) => setMedicineFormData({ ...medicineFormData, strength: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-700 bg-[#0a0e1a] text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder="e.g., 500mg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Dosage Form</label>
                  <select
                    required
                    value={medicineFormData.dosage_form}
                    onChange={(e) => setMedicineFormData({ ...medicineFormData, dosage_form: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-700 bg-[#0a0e1a] text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                  >
                    <option value="">Select form</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Cream">Cream</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={medicineFormData.category}
                    onChange={(e) => setMedicineFormData({ ...medicineFormData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-700 bg-[#0a0e1a] text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder="e.g., Analgesic"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-300 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    required
                    value={medicineFormData.manufacturer_name}
                    onChange={(e) => setMedicineFormData({ ...medicineFormData, manufacturer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-700 bg-[#0a0e1a] text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowMedicineForm(false)}
                  className="px-4 py-2 border border-gray-700 bg-[#0a0e1a] text-gray-300 rounded-lg hover:bg-gray-800 font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold text-sm"
                >
                  Add Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Manifest Form Modal */}
      {showManifestForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151923] border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Create Lot Manifest</h3>
            <form onSubmit={handleCreateManifest} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Medicine</label>
                <select
                  required
                  value={manifestFormData.medicine}
                  onChange={(e) => setManifestFormData({ ...manifestFormData, medicine: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-700 bg-[#0a0e1a] text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                >
                  <option value="">Select medicine</option>
                  {medicines.map((medicine) => (
                    <option key={medicine.id} value={medicine.id}>{medicine.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Batch Number</label>
                <input
                  type="text"
                  required
                  value={manifestFormData.batch_number}
                  onChange={(e) => setManifestFormData({ ...manifestFormData, batch_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-700 bg-[#0a0e1a] text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                  placeholder="e.g., BATCH-2026-001"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={manifestFormData.expiry_date}
                  onChange={(e) => setManifestFormData({ ...manifestFormData, expiry_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-700 bg-[#0a0e1a] text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowManifestForm(false)}
                  className="px-4 py-2 border border-gray-700 bg-[#0a0e1a] text-gray-300 rounded-lg hover:bg-gray-800 font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold text-sm"
                >
                  Create Manifest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Private Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#151923] border border-gray-700 rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Icon name="warning" className="text-yellow-400 text-3xl" />
              <h3 className="text-xl font-bold text-white">Save Your Private Key</h3>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <p className="text-yellow-300 font-bold text-sm">⚠️ Important: This key will only be shown once!</p>
              <p className="text-yellow-200/80 text-sm mt-1">Save it securely. You'll need it to sign lot manifests. We cannot recover it if lost.</p>
            </div>
            <div className="relative">
              <div className="bg-[#0a0e1a] border border-gray-700 p-4 rounded-lg mb-4 group">
                <pre className="text-green-400 font-mono text-xs break-all blur-sm hover:blur-none transition-all duration-300 select-all">{privateKey}</pre>
                <p className="text-gray-500 text-xs text-center mt-2 group-hover:hidden">Hover to reveal</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={copyPrivateKey}
                className="px-4 py-2 border border-gray-700 bg-[#0a0e1a] text-gray-300 rounded-lg hover:bg-gray-800 font-bold text-sm flex items-center gap-2 transition-colors"
              >
                <Icon name="content_copy" />
                Copy
              </button>
              <button
                onClick={downloadPrivateKey}
                className="px-4 py-2 border border-gray-700 bg-[#0a0e1a] text-gray-300 rounded-lg hover:bg-gray-800 font-bold text-sm flex items-center gap-2 transition-colors"
              >
                <Icon name="download" />
                Download
              </button>
              <button
                onClick={closeKeyModal}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold text-sm"
              >
                I've Saved It
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Error/Success Modal */}
      <ErrorModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
      />
    </div>
  );
};
export default DistributorDashboard;
