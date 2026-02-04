import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Package, FileText, Eye, LogOut, Plus } from 'lucide-react';
import { distributorService, type LotManifest, type DistributorEntity } from '../services/distributor';
import { authService } from '../services/auth';
import NewLotManifest from './NewLotManifest';

type TabType = 'batches' | 'create' | 'identity';

const DistributorDashboardTabs: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('batches');
  const [manifests, setManifests] = useState<LotManifest[]>([]);
  const [distributorEntity, setDistributorEntity] = useState<DistributorEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const user = authService.getCurrentUser();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch manifests for this distributor
      const manifestsData = await distributorService.getLotManifests();
      setManifests(manifestsData);

      // Fetch distributor entity info (for identity tab)
      // Note: You'll need to store the distributor entity ID when it's created
      // For now, we'll fetch all and get the first one
      const entities = await distributorService.getDistributorEntities();
      if (entities.length > 0) {
        setDistributorEntity(entities[0]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'batches':
        return <MyBatchesTab manifests={manifests} loading={loading} navigate={navigate} />;
      case 'create':
        return <CreateManifestTab />;
      case 'identity':
        return <IdentityTab distributorEntity={distributorEntity} loading={loading} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#0B0E11] text-gray-200 font-['Inter'] min-h-screen flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 h-screen bg-[#161B1E] border-r border-[#2E3638] flex flex-col shadow-xl">
        <div className="p-6 pb-8 border-b border-[#2E3638]/50">
          <h1 className="font-['Space_Grotesk'] text-white text-xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#0055FF]/20 text-[#0055FF]">
              <Shield />
            </div>
            RxVerify Lite
          </h1>
          <p className="text-gray-500 text-[11px] font-mono mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00C853] animate-pulse"></span>
            DISTRIBUTOR NODE
          </p>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-[#2E3638]/50">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600 flex items-center justify-center text-xs font-bold font-mono text-white group-hover:border-[#0055FF] transition-colors">
              {user?.first_name?.[0] || 'D'}{user?.last_name?.[0] || 'U'}
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-xs font-bold text-white group-hover:text-[#0055FF] transition-colors">
                {user?.first_name || 'Distributor'} {user?.last_name || 'User'}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">{user?.role || 'Distributor'}</span>
            </div>
            <button onClick={() => {
              authService.logout();
              navigate('/');
            }} className="text-gray-500 hover:text-white transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
          <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 font-['Space_Grotesk']">Views</p>
          
          <button
            onClick={() => setActiveTab('batches')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
              activeTab === 'batches'
                ? 'bg-[#0055FF]/10 text-[#0055FF] border-r-2 border-[#0055FF] shadow-[0_0_20px_-5px_rgba(0,85,255,0.5)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="text-xl" />
            <span>My Batches</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
              activeTab === 'create'
                ? 'bg-[#0055FF]/10 text-[#0055FF] border-r-2 border-[#0055FF] shadow-[0_0_20px_-5px_rgba(0,85,255,0.5)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Plus className="text-xl" />
            <span>Create Manifest</span>
          </button>

          <button
            onClick={() => setActiveTab('identity')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
              activeTab === 'identity'
                ? 'bg-[#0055FF]/10 text-[#0055FF] border-r-2 border-[#0055FF] shadow-[0_0_20px_-5px_rgba(0,85,255,0.5)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Lock className="text-xl" />
            <span>Identity</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-18 border-b border-[#2E3638] bg-[#0B0E11]/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <div>
            <h2 className="text-2xl font-['Space_Grotesk'] font-bold text-white tracking-tight">
              {activeTab === 'batches' && 'My Lot Manifests'}
              {activeTab === 'create' && 'Create New Manifest'}
              {activeTab === 'identity' && 'Cryptographic Identity'}
            </h2>
            <p className="text-gray-400 text-sm">
              {activeTab === 'batches' && 'View and manage your batch signatures'}
              {activeTab === 'create' && 'Generate a new signed lot manifest'}
              {activeTab === 'identity' && 'Your public key and verification status'}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="px-3 py-1.5 rounded-full bg-[#1A2628] border border-[#0055FF]/20 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C853] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C853]"></span>
              </span>
              <span className="text-[10px] font-mono text-[#0055FF] font-bold tracking-wider">SECURE</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

// Tab Components
const MyBatchesTab: React.FC<{ manifests: LotManifest[]; loading: boolean; navigate: any }> = ({ manifests, loading, navigate }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0055FF]/30 border-t-[#0055FF] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading manifests...</p>
        </div>
      </div>
    );
  }

  if (manifests.length === 0) {
    return (
      <div className="bg-[#161B1E] border border-[#2E3638] rounded-xl p-12 text-center">
        <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Lot Manifests Yet</h3>
        <p className="text-gray-400 mb-6">Create your first lot manifest to get started</p>
        <button
          onClick={() => navigate('/distributor/new-manifest')}
          className="px-6 py-3 rounded-lg bg-[#0055FF] text-white font-bold hover:bg-[#0044CC] transition-all inline-flex items-center gap-2"
        >
          <Plus size={20} />
          Create Manifest
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#161B1E] border border-[#2E3638] rounded-xl overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#121517] text-[11px] font-mono uppercase text-gray-500 border-b border-[#2E3638]">
            <th className="px-6 py-4 font-bold tracking-wider">Batch Number</th>
            <th className="px-6 py-4 font-bold tracking-wider">Expiry Date</th>
            <th className="px-6 py-4 font-bold tracking-wider text-center">Trust Score</th>
            <th className="px-6 py-4 font-bold tracking-wider">Status</th>
            <th className="px-6 py-4 font-bold tracking-wider text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2E3638]/30 text-sm">
          {manifests.map((manifest) => (
            <tr key={manifest.id} className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4 font-mono text-white">{manifest.batch_number}</td>
              <td className="px-6 py-4 text-gray-300 font-mono text-xs">{manifest.expiry_date}</td>
              <td className="px-6 py-4 text-center">
                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${
                  parseFloat(manifest.trust_score) >= 90 
                    ? 'bg-[#00C853]/10 border-[#00C853]/30 text-[#00C853]' 
                    : parseFloat(manifest.trust_score) >= 70
                    ? 'bg-[#FFD60A]/10 border-[#FFD60A]/30 text-[#FFD60A]'
                    : 'bg-[#FF453A]/10 border-[#FF453A]/30 text-[#FF453A]'
                }`}>
                  {manifest.trust_score}
                </span>
              </td>
              <td className="px-6 py-4">
                {manifest.digital_signature ? (
                  <span className="flex items-center gap-2 text-xs text-[#00C853]">
                    <Shield className="text-[16px]" />
                    <span className="font-mono">SIGNED</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-xs text-[#FFD60A]">
                    <Lock className="text-[16px] animate-pulse" />
                    <span className="font-mono">UNSIGNED</span>
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <button 
                  onClick={() => navigate(`/distributor/qr-codes/${manifest.id}`)}
                  className="text-[#0055FF] hover:text-white transition-colors font-medium text-xs uppercase tracking-wide inline-flex items-center gap-1"
                >
                  <Eye size={14} />
                  View QR
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CreateManifestTab: React.FC = () => {
  return (
    <div>
      <NewLotManifest />
    </div>
  );
};

const IdentityTab: React.FC<{ distributorEntity: DistributorEntity | null; loading: boolean }> = ({ distributorEntity, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0055FF]/30 border-t-[#0055FF] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading identity...</p>
        </div>
      </div>
    );
  }

  if (!distributorEntity) {
    return (
      <div className="bg-[#161B1E] border border-[#2E3638] rounded-xl p-12 text-center">
        <Lock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Cryptographic Identity Found</h3>
        <p className="text-gray-400">Register a distributor entity to view your cryptographic credentials</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Verification Status Card */}
      <div className="bg-[#161B1E] border border-[#2E3638] rounded-xl p-8 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-4 rounded-full ${
            distributorEntity.is_verified_regulator 
              ? 'bg-[#00C853]/10' 
              : 'bg-[#0055FF]/10'
          }`}>
            {distributorEntity.is_verified_regulator ? (
              <Shield className="text-[#00C853] w-8 h-8" />
            ) : (
              <Lock className="text-[#0055FF] w-8 h-8" />
            )}
          </div>
          <div>
            <h3 className="text-2xl font-['Space_Grotesk'] font-bold text-white">
              {distributorEntity.name}
            </h3>
            <p className={`text-sm font-mono ${
              distributorEntity.is_verified_regulator 
                ? 'text-[#00C853]' 
                : 'text-gray-400'
            }`}>
              {distributorEntity.is_verified_regulator ? 'VERIFIED REGULATOR' : 'STANDARD DISTRIBUTOR'}
            </p>
          </div>
        </div>

        {/* Entity ID */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Entity ID
          </label>
          <div className="bg-[#0E1113] border border-[#2E3638] rounded-lg p-3 font-mono text-xs text-gray-400">
            {distributorEntity.id}
          </div>
        </div>
      </div>

      {/* Public Key Card */}
      <div className="bg-[#161B1E] border border-[#2E3638] rounded-xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="text-[#0055FF]" size={24} />
          <h3 className="text-xl font-['Space_Grotesk'] font-bold text-white">
            Public Key (Ed25519)
          </h3>
        </div>

        <div className="bg-[#0E1113] border border-[#2E3638] rounded-lg p-6 mb-4">
          <p className="font-mono text-sm leading-relaxed text-white break-all">
            {distributorEntity.public_key}
          </p>
        </div>

        <div className="bg-[#0055FF]/5 border border-[#0055FF]/20 rounded-lg p-4">
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="text-[#0055FF] font-bold">Security Note:</span> This public key is cryptographically bound to all lot manifests you create.
            It enables verification without revealing your private key. Your private key was shown once during entity registration and cannot be recovered.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DistributorDashboardTabs;
