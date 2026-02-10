import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { distributorService, type Medicine, type LotManifest, type DistributorEntity } from '../services/distributor';
import { authService } from '../services/auth';

interface DashboardStats {
  totalMedicines: number;
  totalManifests: number;
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
  const [stats, setStats] = useState<DashboardStats>({
    totalMedicines: 0,
    totalManifests: 0,
    pendingVerifications: 0,
    entityStatus: 'none'
  });
  
  // Form states
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [showManifestForm, setShowManifestForm] = useState(false);
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
  
  // Load user data and check for entity
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          console.log('[Dashboard] Loading distributor entities...');
          // Check if user has a distributor entity
          const entities = await distributorService.getDistributorEntities();
          console.log('[Dashboard] Fetched entities:', entities);
          
          if (entities && entities.length > 0) {
            const entity = entities[0];
            console.log('[Dashboard] Found existing entity:', entity.id);
            setDistributorEntity(entity);
            setStats(prev => ({ ...prev, entityStatus: 'registered' }));
            
            // Store entity ID in localStorage for backup
            localStorage.setItem('distributor_entity_id', entity.id);
            
            // Load medicines and manifests
            await loadMedicines(entity.id);
            await loadManifests(entity.id);
          } else {
            console.log('[Dashboard] No entities found');
            setStats(prev => ({ ...prev, entityStatus: 'none' }));
            localStorage.removeItem('distributor_entity_id');
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('[Dashboard] Error loading user data:', error);
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);
  
  const loadMedicines = async (distributorId?: string) => {
    try {
      const data = await distributorService.getMedicines({ 
        search: searchQuery,
        distributor: distributorId  // Pass distributor filter to backend
      });
      setMedicines(data);
      setStats(prev => ({ ...prev, totalMedicines: data.length }));
    } catch (error) {
      console.error('Error loading medicines:', error);
    }
  };
  
  const loadManifests = async (distributorId?: string) => {
    try {
      const data = await distributorService.getLotManifests({ distributor: distributorId });
      setManifests(data);
      setStats(prev => ({ ...prev, totalManifests: data.length }));
    } catch (error) {
      console.error('Error loading manifests:', error);
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
      console.error('Error creating entity:', error);
      alert(error.response?.data?.message || 'Failed to create entity');
    }
  };
  
  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributorEntity) {
      alert('Please register your entity first');
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
      console.error('Error creating medicine:', error);
      alert(error.response?.data?.message || 'Failed to create medicine');
    }
  };
  
  const handleCreateManifest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributorEntity) {
      alert('Please register your entity first');
      return;
    }
    
    try {
      // Add distributor ID to the payload
      await distributorService.createLotManifest({
        ...manifestFormData,
        distributor: distributorEntity.id  // Add distributor ID
      });
      setShowManifestForm(false);
      setManifestFormData({
        medicine: '',
        batch_number: '',
        expiry_date: ''
      });
      await loadManifests(distributorEntity.id);
    } catch (error: any) {
      console.error('Error creating manifest:', error);
      alert(error.response?.data?.message || 'Failed to create manifest');
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
    alert('Private key copied to clipboard!');
  };
  
  const closeKeyModal = () => {
    setShowKeyModal(false);
    setPrivateKey(''); // Clear from memory
  };
  
  if (loading) {
    return (
      <div className="bg-[#f6f5f8] h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon name="hourglass_empty" className="text-6xl text-primary animate-spin" />
          <p className="mt-4 text-[#6d5e8d] font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-[#f6f5f8] text-[#131018] font-display h-screen flex overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0 z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(85,0,255,0.3)]">
            <Icon name="local_shipping" className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-[#131018] text-lg font-bold leading-tight tracking-tight">RxVerify Lite</h1>
            <p className="text-[#6d5e8d] text-xs font-medium">Distributor Portal</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-2 flex flex-col gap-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-primary/10 text-primary'
                : 'text-[#6d5e8d] hover:bg-gray-50 hover:text-[#131018]'
            }`}
          >
            <Icon name="dashboard" className={activeTab === 'dashboard' ? 'filled' : ''} />
            <span className="text-sm font-bold">Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('medicines')}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
              activeTab === 'medicines'
                ? 'bg-primary/10 text-primary'
                : 'text-[#6d5e8d] hover:bg-gray-50 hover:text-[#131018]'
            }`}
          >
            <Icon name="medication" />
            <span className="text-sm font-medium">Medicines</span>
          </button>
          
          <button
            onClick={() => setActiveTab('manifests')}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
              activeTab === 'manifests'
                ? 'bg-primary/10 text-primary'
                : 'text-[#6d5e8d] hover:bg-gray-50 hover:text-[#131018]'
            }`}
          >
            <Icon name="assignment" />
            <span className="text-sm font-medium">Manifests</span>
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
              activeTab === 'settings'
                ? 'bg-primary/10 text-primary'
                : 'text-[#6d5e8d] hover:bg-gray-50 hover:text-[#131018]'
            }`}
          >
            <Icon name="settings" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors" onClick={handleLogout}>
            <div className="size-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="flex flex-col overflow-hidden flex-1">
              <p className="text-sm font-bold text-[#131018] truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-[#6d5e8d] truncate">Distributor</p>
            </div>
            <Icon name="logout" className="text-[#6d5e8d]" />
          </div>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 shrink-0 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-[#131018]">
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'medicines' && 'Medicine Catalog'}
              {activeTab === 'manifests' && 'Lot Manifests'}
              {activeTab === 'settings' && 'Settings'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
              <input
                className="h-10 pl-10 pr-4 w-80 rounded-lg border-none bg-gray-100 text-sm focus:ring-2 focus:ring-primary/50 placeholder-gray-500"
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
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon name="medication" className="text-6xl text-primary" />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="medication" className="text-primary text-xl" />
                    <p className="text-sm font-semibold text-[#6d5e8d]">Medicines Registered</p>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-[#131018]">{stats.totalMedicines}</p>
                  </div>
                </div>
                
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon name="assignment" className="text-6xl text-blue-500" />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="assignment" className="text-blue-500 text-xl" />
                    <p className="text-sm font-semibold text-[#6d5e8d]">Manifests Created</p>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-[#131018]">{stats.totalManifests}</p>
                  </div>
                </div>
                
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon name="verified" className="text-6xl text-green-500" />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="verified" className="text-green-500 text-xl" />
                    <p className="text-sm font-semibold text-[#6d5e8d]">Verifications</p>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-[#131018]">{stats.pendingVerifications}</p>
                  </div>
                </div>
                
                <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group ${
                  stats.entityStatus === 'registered' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon name="business" className={`text-6xl ${stats.entityStatus === 'registered' ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="business" className={`text-xl ${stats.entityStatus === 'registered' ? 'text-green-600' : 'text-gray-400'}`} />
                    <p className="text-sm font-semibold text-[#6d5e8d]">Entity Status</p>
                  </div>
                  <div>
                    <p className={`text-lg font-extrabold ${stats.entityStatus === 'registered' ? 'text-green-600' : 'text-gray-600'}`}>
                      {stats.entityStatus === 'registered' ? '✓ Registered' : 'Not Registered'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Recent Activity */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-[#131018] mb-4">Recent Activity</h3>
                <div className="text-center py-12 text-[#6d5e8d]">
                  <Icon name="history" className="text-6xl opacity-30" />
                  <p className="mt-4">No recent activity</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Medicines Tab */}
          {activeTab === 'medicines' && (
            <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#131018]">Medicine Catalog</h3>
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
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                  <Icon name="medication" className="text-6xl text-gray-300" />
                  <p className="mt-4 text-[#6d5e8d]">No medicines registered yet</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-[#6d5e8d] uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-[#6d5e8d] uppercase">Active Ingredient</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-[#6d5e8d] uppercase">Strength</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-[#6d5e8d] uppercase">Form</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-[#6d5e8d] uppercase">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {medicines.map((medicine) => (
                        <tr key={medicine.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-bold text-[#131018]">{medicine.name}</td>
                          <td className="px-6 py-4 text-sm text-[#6d5e8d]">{medicine.active_ingredient}</td>
                          <td className="px-6 py-4 text-sm text-[#6d5e8d]">{medicine.strength}</td>
                          <td className="px-6 py-4 text-sm text-[#6d5e8d]">{medicine.dosage_form}</td>
                          <td className="px-6 py-4 text-sm text-[#6d5e8d]">{medicine.category}</td>
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
                <h3 className="text-lg font-bold text-[#131018]">Lot Manifests</h3>
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
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                  <Icon name="assignment" className="text-6xl text-gray-300" />
                  <p className="mt-4 text-[#6d5e8d]">No manifests created yet</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-[#6d5e8d] uppercase">Batch Number</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-[#6d5e8d] uppercase">Expiry Date</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-[#6d5e8d] uppercase">Trust Score</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-[#6d5e8d] uppercase">Signature</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-[#6d5e8d] uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {manifests.map((manifest) => (
                        <tr key={manifest.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-mono font-bold text-[#131018]">{manifest.batch_number}</td>
                          <td className="px-6 py-4 text-sm text-[#6d5e8d]">{manifest.expiry_date}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-bold text-xs">
                              {manifest.trust_score}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-[#6d5e8d]">{manifest.digital_signature.substring(0, 16)}...</td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => navigate(`/distributor/qr-codes/${manifest.id}`)}
                              className="text-primary hover:underline font-bold"
                            >
                              Generate QR
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-[#131018] mb-4">Account Settings</h3>
                <p className="text-[#6d5e8d]">Settings coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Entity Registration Modal */}
      {showEntityForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#131018] mb-4">Register Distributor Entity</h3>
            <form onSubmit={handleCreateEntity} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#131018] mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={entityFormData.name}
                  onChange={(e) => setEntityFormData({ ...entityFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#131018] mb-1">License Number</label>
                <input
                  type="text"
                  required
                  value={entityFormData.license_number}
                  onChange={(e) => setEntityFormData({ ...entityFormData, license_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowEntityForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold text-sm"
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
      
      {/* Medicine Form Modal */}
      {showMedicineForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full my-8">
            <h3 className="text-xl font-bold text-[#131018] mb-4">Add New Medicine</h3>
            <form onSubmit={handleCreateMedicine} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-[#131018] mb-1">Medicine Name</label>
                  <input
                    type="text"
                    required
              value={medicineFormData.name}
                    onChange={(e) => setMedicineFormData({ ...medicineFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#131018] mb-1">Active Ingredient</label>
                  <input
                    type="text"
                    required
                    value={medicineFormData.active_ingredient}
                    onChange={(e) => setMedicineFormData({ ...medicineFormData, active_ingredient: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#131018] mb-1">Strength</label>
                  <input
                    type="text"
                    required
                    value={medicineFormData.strength}
                    onChange={(e) => setMedicineFormData({ ...medicineFormData, strength: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g., 500mg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#131018] mb-1">Dosage Form</label>
                  <select
                    required
                    value={medicineFormData.dosage_form}
                    onChange={(e) => setMedicineFormData({ ...medicineFormData, dosage_form: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50"
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
                  <label className="block text-sm font-bold text-[#131018] mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={medicineFormData.category}
                    onChange={(e) => setMedicineFormData({ ...medicineFormData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g., Analgesic"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-[#131018] mb-1">Manufacturer</label>
                  <input
                    type="text"
                    required
                    value={medicineFormData.manufacturer_name}
                    onChange={(e) => setMedicineFormData({ ...medicineFormData, manufacturer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowMedicineForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold text-sm"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#131018] mb-4">Create Lot Manifest</h3>
            <form onSubmit={handleCreateManifest} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#131018] mb-1">Medicine</label>
                <select
                  required
                  value={manifestFormData.medicine}
                  onChange={(e) => setManifestFormData({ ...manifestFormData, medicine: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select medicine</option>
                  {medicines.map((medicine) => (
                    <option key={medicine.id} value={medicine.id}>{medicine.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#131018] mb-1">Batch Number</label>
                <input
                  type="text"
                  required
                  value={manifestFormData.batch_number}
                  onChange={(e) => setManifestFormData({ ...manifestFormData, batch_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g., BATCH-2026-001"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#131018] mb-1">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={manifestFormData.expiry_date}
                  onChange={(e) => setManifestFormData({ ...manifestFormData, expiry_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowManifestForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold text-sm"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-4">
              <Icon name="warning" className="text-yellow-600 text-3xl" />
              <h3 className="text-xl font-bold text-[#131018]">Save Your Private Key</h3>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-yellow-900 font-bold text-sm">⚠️ Important: This key will only be shown once!</p>
              <p className="text-yellow-700 text-sm mt-1">Save it securely. You'll need it to sign lot manifests. We cannot recover it if lost.</p>
            </div>
            <div className="relative">
              <div className="bg-gray-900 p-4 rounded-lg mb-4 group">
                <pre className="text-green-400 font-mono text-xs break-all blur-sm hover:blur-none transition-all duration-300 select-all">{privateKey}</pre>
                <p className="text-gray-500 text-xs text-center mt-2 group-hover:hidden">Hover to reveal</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={copyPrivateKey}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold text-sm flex items-center gap-2"
              >
                <Icon name="content_copy" />
                Copy
              </button>
              <button
                onClick={downloadPrivateKey}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold text-sm flex items-center gap-2"
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
    </div>
  );
};

export default DistributorDashboard;
