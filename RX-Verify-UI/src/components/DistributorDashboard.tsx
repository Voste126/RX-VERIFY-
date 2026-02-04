import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { distributorService, type Medicine, type LotManifest } from '../services/distributor';
import { authService } from '../services/auth';

const DistributorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [manifests, setManifests] = useState<LotManifest[]>([]);
  const [loading, setLoading] = useState(true);
  const user = authService.getCurrentUser();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [medicinesData, manifestsData] = await Promise.all([
        distributorService.getMedicines(),
        distributorService.getLotManifests()
      ]);
      setMedicines(medicinesData);
      setManifests(manifestsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pendingSignatures = manifests.filter(m => !m.digital_signature || m.digital_signature === '').length;
  const averageTrustScore = manifests.length > 0
    ? (manifests.reduce((sum, m) => sum + parseFloat(m.trust_score || '0'), 0) / manifests.length).toFixed(2)
    : '0.00';

  return (
    <div className="bg-[#0B0E11] text-gray-200 font-['Inter'] min-h-screen flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 h-screen bg-[#161B1E] border-r border-[#2E3638] flex flex-col shadow-xl">
        <div className="p-6 pb-8 border-b border-[#2E3638]/50">
          <h1 className="font-['Space_Grotesk'] text-white text-xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#1f707a]/20 text-[#1f707a]">
              <Icon name="security" />
            </div>
            RxVerify Lite
          </h1>
          <p className="text-gray-500 text-[11px] font-mono mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#40CC40] animate-pulse"></span>
            v2.4.0 • DISTRIBUTOR NODE
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
          <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 font-['Space_Grotesk']">Main</p>
          
          <button
            onClick={() => navigate('/distributor/dashboard')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1f707a]/10 text-[#1f707a] border-r-2 border-[#1f707a] shadow-[0_0_20px_-5px_rgba(31,112,122,0.5)]"
          >
            <Icon name="dashboard" className="text-xl font-bold" />
            <span className="font-medium text-sm">Dashboard</span>
          </button>

          <button
            onClick={() => navigate('/distributor/medicines/new')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
          >
            <Icon name="medication" className="text-xl group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">Register Medicine</span>
          </button>

          <button
            onClick={() => navigate('/distributor/batch-management')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
          >
            <Icon name="description" className="text-xl group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">Lot Manifests</span>
          </button>

          <button
            onClick={() => navigate('/distributor/new-manifest')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
          >
            <Icon name="add_box" className="text-xl group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">Create Manifest</span>
          </button>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[#2E3638]/50 bg-[#0E1113]">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600 flex items-center justify-center text-xs font-bold font-mono text-white group-hover:border-[#1f707a] transition-colors">
              {user?.first_name?.[0] || 'D'}{user?.last_name?.[0] || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white group-hover:text-[#1f707a] transition-colors">
                {user?.first_name || 'Distributor'} {user?.last_name || 'User'}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">{user?.role || 'Distributor'}</span>
            </div>
            <button onClick={() => {
              authService.logout();
              navigate('/');
            }} className="ml-auto text-gray-500 hover:text-white transition-colors">
              <Icon name="logout" className="text-[20px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-18 border-b border-[#2E3638] bg-[#0B0E11]/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <div>
            <h2 className="text-2xl font-['Space_Grotesk'] font-bold text-white tracking-tight">Dashboard</h2>
            <p className="text-gray-400 text-sm">Welcome back, {user?.first_name || 'Distributor'}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="px-3 py-1.5 rounded-full bg-[#1A2628] border border-[#1f707a]/20 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#40CC40] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#40CC40]"></span>
              </span>
              <span className="text-[10px] font-mono text-[#1f707a] font-bold tracking-wider">TLS 1.3 SECURE</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1600px] mx-auto flex flex-col gap-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Total Medicines */}
              <div className="bg-[#161B1E] border border-[#2E3638] rounded-xl p-6 hover:border-[#1f707a]/60 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Total Medicines</p>
                    <p className="text-3xl font-['Space_Grotesk'] font-bold text-white">{medicines.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#1f707a]/10">
                    <Icon name="medication" className="text-[#1f707a] text-2xl" />
                  </div>
                </div>
              </div>

              {/* Total Manifests */}
              <div className="bg-[#161B1E] border border-[#2E3638] rounded-xl p-6 hover:border-[#1f707a]/60 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Lot Manifests</p>
                    <p className="text-3xl font-['Space_Grotesk'] font-bold text-white">{manifests.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Icon name="description" className="text-blue-400 text-2xl" />
                  </div>
                </div>
              </div>

              {/* Pending Signatures */}
              <div className="bg-[#161B1E] border border-[#2E3638] rounded-xl p-6 hover:border-[#FFD60A]/60 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Pending Signatures</p>
                    <p className="text-3xl font-['Space_Grotesk'] font-bold text-white">{pendingSignatures}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#FFD60A]/10">
                    <Icon name="pending" className="text-[#FFD60A] text-2xl" />
                  </div>
                </div>
              </div>

              {/* Avg Trust Score */}
              <div className="bg-[#161B1E] border border-[#2E3638] rounded-xl p-6 hover:border-[#40CC40]/60 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Avg Trust Score</p>
                    <p className="text-3xl font-['Space_Grotesk'] font-bold text-white">{averageTrustScore}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#40CC40]/10">
                    <Icon name="verified" className="text-[#40CC40] text-2xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#161B1E] border border-[#2E3638] rounded-xl p-6">
              <h3 className="text-lg font-['Space_Grotesk'] font-medium text-white mb-4 flex items-center gap-2">
                <Icon name="bolt" className="text-[#1f707a]" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate('/distributor/medicines/new')}
                  className="flex items-center gap-3 p-4 bg-[#0E1113] rounded-lg border border-[#2E3638] hover:border-[#1f707a] transition-all group"
                >
                  <Icon name="add_circle" className="text-[#1f707a] text-2xl group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Register Medicine</p>
                    <p className="text-xs text-gray-400">Add new pharmaceutical product</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/distributor/new-manifest')}
                  className="flex items-center gap-3 p-4 bg-[#0E1113] rounded-lg border border-[#2E3638] hover:border-[#1f707a] transition-all group"
                >
                  <Icon name="edit_document" className="text-[#1f707a] text-2xl group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Create Lot Manifest</p>
                    <p className="text-xs text-gray-400">Generate signed batch manifest</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/distributor/batch-management')}
                  className="flex items-center gap-3 p-4 bg-[#0E1113] rounded-lg border border-[#2E3638] hover:border-[#1f707a] transition-all group"
                >
                  <Icon name="visibility" className="text-[#1f707a] text-2xl group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">View All Manifests</p>
                    <p className="text-xs text-gray-400">Browse and manage batches</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[#161B1E] border border-[#2E3638] rounded-xl overflow-hidden">
              <div className="p-5 border-b border-[#2E3638] bg-[#191e20]/50">
                <h3 className="text-lg font-['Space_Grotesk'] font-medium text-white flex items-center gap-2">
                  <Icon name="history" className="text-gray-500" />
                  Recent Lot Manifests
                </h3>
              </div>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-400">
                    <Icon name="hourglass_empty" className="text-3xl animate-spin mb-2" />
                    <p>Loading...</p>
                  </div>
                ) : manifests.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Icon name="inbox" className="text-4xl mb-2" />
                    <p>No lot manifests yet. Create your first manifest to get started.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#121517] text-[11px] font-mono uppercase text-gray-500 border-b border-[#2E3638]">
                        <th className="px-6 py-4 font-bold tracking-wider">Batch ID</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Expiry Date</th>
                        <th className="px-6 py-4 font-bold tracking-wider text-center">Trust Score</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                        <th className="px-6 py-4 font-bold tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2E3638]/30 text-sm">
                      {manifests.slice(0, 5).map((manifest) => (
                        <tr key={manifest.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-mono text-white">{manifest.batch_number}</td>
                          <td className="px-6 py-4 text-gray-300 font-mono text-xs">{manifest.expiry_date}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${
                              parseFloat(manifest.trust_score) >= 90 
                                ? 'bg-[#40CC40]/10 border-[#40CC40]/30 text-[#40CC40]' 
                                : parseFloat(manifest.trust_score) >= 70
                                ? 'bg-[#FFD60A]/10 border-[#FFD60A]/30 text-[#FFD60A]'
                                : 'bg-[#FF453A]/10 border-[#FF453A]/30 text-[#FF453A]'
                            }`}>
                              {manifest.trust_score}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {manifest.digital_signature ? (
                              <span className="flex items-center gap-2 text-xs text-[#40CC40]">
                                <Icon name="verified" className="text-[16px]" />
                                <span className="font-mono">SIGNED</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-2 text-xs text-[#FFD60A]">
                                <Icon name="pending" className="text-[16px] animate-pulse" />
                                <span className="font-mono">UNSIGNED</span>
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => navigate(`/distributor/qr-codes/${manifest.id}`)}
                              className="text-[#1f707a] hover:text-white transition-colors font-medium text-xs uppercase tracking-wide"
                            >
                              View QR
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DistributorDashboard;
