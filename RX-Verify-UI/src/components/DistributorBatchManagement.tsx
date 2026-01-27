import React, { useState } from 'react';
import Icon from './Icon';

interface Batch {
  id: string;
  batchId: string;
  origin: string;
  created: string;
  units: number;
  trustScore: number;
  signatureStatus: 'verified' | 'unsigned' | 'invalid';
  isActive?: boolean;
}

const DistributorBatchManagement: React.FC = () => {
  const [activeNav, setActiveNav] = useState('lot-manifests');
  const [searchQuery, setSearchQuery] = useState('');

  const batches: Batch[] = [
    {
      id: '1',
      batchId: '0x4F9A...2B',
      origin: 'KEMSA HQ',
      created: 'Oct 27, 09:42',
      units: 12500,
      trustScore: 98,
      signatureStatus: 'verified'
    },
    {
      id: '2',
      batchId: '0x8C3D...1E',
      origin: 'Nairobi West',
      created: 'Oct 27, 10:15',
      units: 4200,
      trustScore: 85,
      signatureStatus: 'unsigned',
      isActive: true
    },
    {
      id: '3',
      batchId: '0x2B1A...9C',
      origin: 'Mombasa Dist',
      created: 'Oct 27, 11:00',
      units: 8150,
      trustScore: 95,
      signatureStatus: 'verified'
    },
    {
      id: '4',
      batchId: '0x7E5F...3D',
      origin: 'Kisumu Hub',
      created: 'Oct 27, 11:30',
      units: 3000,
      trustScore: 42,
      signatureStatus: 'invalid'
    }
  ];

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'bg-[#40CC40]/10 border-[#40CC40]/30 text-[#40CC40]';
    if (score >= 70) return 'bg-[#FFD60A]/10 border-[#FFD60A]/30 text-[#FFD60A]';
    return 'bg-[#FF453A]/10 border-[#FF453A]/30 text-[#FF453A]';
  };

  const getSignatureStatus = (status: string) => {
    switch (status) {
      case 'verified':
        return { icon: 'verified', color: 'text-[#40CC40]', label: 'Ed25519 OK' };
      case 'unsigned':
        return { icon: 'pending', color: 'text-[#FFD60A]', label: 'UNSIGNED' };
      case 'invalid':
        return { icon: 'warning', color: 'text-[#FF453A]', label: 'INVALID' };
      default:
        return { icon: 'help', color: 'text-gray-400', label: 'UNKNOWN' };
    }
  };

  const qrCodes = Array.from({ length: 6 }, (_, i) => ({
    id: `RX-8C3D-${String(i + 1).padStart(4, '0')}`,
    index: i
  }));

  return (
    <div className="bg-[#0B0E11] text-gray-200 font-['Inter'] h-screen flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 h-full bg-[#161B1E] border-r border-[#2E3638] flex flex-col z-20 shadow-xl relative">
        {/* Logo */}
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
          <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 font-['Space_Grotesk']">Production</p>
          
          <button
            onClick={() => setActiveNav('dashboard')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
              activeNav === 'dashboard'
                ? 'bg-[#1f707a]/10 text-[#1f707a] border-r-2 border-[#1f707a] shadow-[0_0_20px_-5px_rgba(31,112,122,0.5)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon name="dashboard" className={`text-xl ${activeNav === 'dashboard' ? 'font-bold' : 'group-hover:scale-110 transition-transform'}`} />
            <span className="font-medium text-sm">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveNav('lot-manifests')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
              activeNav === 'lot-manifests'
                ? 'bg-[#1f707a]/10 text-[#1f707a] border-r-2 border-[#1f707a] shadow-[0_0_20px_-5px_rgba(31,112,122,0.5)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon name="description" className={`text-xl ${activeNav === 'lot-manifests' ? 'font-bold' : 'group-hover:scale-110 transition-transform'}`} />
            <span className="font-medium text-sm">Lot Manifests</span>
          </button>

          <button
            onClick={() => setActiveNav('track-trace')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
              activeNav === 'track-trace'
                ? 'bg-[#1f707a]/10 text-[#1f707a] border-r-2 border-[#1f707a] shadow-[0_0_20px_-5px_rgba(31,112,122,0.5)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon name="qr_code_scanner" className="text-xl group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">Track & Trace</span>
          </button>

          <div className="my-4 border-t border-[#2E3638]/30"></div>
          <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 font-['Space_Grotesk']">Security</p>

          <button
            onClick={() => setActiveNav('signature-wizard')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
          >
            <Icon name="verified_user" className="text-xl group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">Signature Wizard</span>
          </button>

          <button
            onClick={() => setActiveNav('audit-logs')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
          >
            <Icon name="folder_managed" className="text-xl group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">Audit Logs</span>
          </button>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[#2E3638]/50 bg-[#0E1113]">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600 flex items-center justify-center text-xs font-bold font-mono text-white group-hover:border-[#1f707a] transition-colors">
              KM
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white group-hover:text-[#1f707a] transition-colors">KEMSA Admin</span>
              <span className="text-[10px] text-gray-400 font-mono">ID: 8A2F...9C</span>
            </div>
            <button className="ml-auto text-gray-500 hover:text-white transition-colors">
              <Icon name="logout" className="text-[20px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Circuit Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none z-0"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, #1f707a 1px, transparent 1px),
                            linear-gradient(to right, rgba(46, 54, 56, 0.3) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(46, 54, 56, 0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px, 40px 40px, 40px 40px'
          }}
        ></div>

        {/* Header */}
        <header className="h-18 border-b border-[#2E3638] bg-[#0B0E11]/80 backdrop-blur-md z-10 flex items-center justify-between px-8 shrink-0 relative">
          <div className="flex items-center gap-3">
            <nav className="flex items-center text-sm font-medium text-gray-500">
              <a className="hover:text-[#1f707a] transition-colors" href="#">Home</a>
              <span className="mx-2 text-gray-700 text-xs">/</span>
              <a className="hover:text-[#1f707a] transition-colors" href="#">Logistics</a>
              <span className="mx-2 text-gray-700 text-xs">/</span>
              <span className="text-white font-['Space_Grotesk'] tracking-tight">Batch Management</span>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <div className="px-3 py-1.5 rounded-full bg-[#1A2628] border border-[#1f707a]/20 flex items-center gap-2 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#40CC40] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#40CC40]"></span>
              </span>
              <span className="text-[10px] font-mono text-[#1f707a] font-bold tracking-wider">TLS 1.3 SECURE</span>
            </div>
            <div className="h-8 w-px bg-[#2E3638]"></div>
            <button className="text-gray-400 hover:text-white transition-colors relative">
              <Icon name="notifications" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#FF453A] rounded-full border border-[#0B0E11]"></span>
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Icon name="settings" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 z-10 scroll-smooth">
          <div className="max-w-[1600px] mx-auto flex flex-col gap-8 pb-24">
            {/* Page Title */}
            <div className="flex justify-between items-end pb-4 border-b border-[#2E3638]/30">
              <div>
                <h2 className="text-3xl font-['Space_Grotesk'] font-bold text-white tracking-tight">Batch Management</h2>
                <p className="text-gray-400 mt-2 max-w-2xl text-sm leading-relaxed">
                  Verify incoming lot manifests and cryptographically sign outgoing batches. Ensure your private key hardware token is connected for Ed25519 signing operations.
                </p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2.5 rounded-lg bg-[#161B1E] border border-[#2E3638] text-gray-300 hover:text-white hover:border-gray-500 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2 group">
                  <Icon name="sync" className="text-[18px] group-hover:rotate-180 transition-transform duration-500" />
                  Sync Ledger
                </button>
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              {/* Left: Table */}
              <div className="xl:col-span-8 flex flex-col gap-4">
                <div className="bg-[#161B1E] border border-[#2E3638] rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col h-full min-h-[550px]">
                  {/* Table Header */}
                  <div className="p-5 border-b border-[#2E3638] flex justify-between items-center bg-[#191e20]/50 backdrop-blur-sm">
                    <h3 className="text-lg font-['Space_Grotesk'] font-medium text-white flex items-center gap-2">
                      <Icon name="table_rows" className="text-[#1f707a]" />
                      Active Manifests
                    </h3>
                    <div className="flex gap-3">
                      <div className="relative group">
                        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#1f707a] transition-colors text-[18px]" />
                        <input
                          className="bg-[#0E1113] border border-[#2E3638] rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#1f707a] w-56 font-mono transition-colors"
                          placeholder="Search Batch ID..."
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <button className="p-1.5 rounded-lg bg-[#0E1113] border border-[#2E3638] text-gray-400 hover:text-white hover:border-[#1f707a] transition-colors">
                        <Icon name="filter_list" className="text-[20px]" />
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#121517] text-[11px] font-mono uppercase text-gray-500 border-b border-[#2E3638]">
                          <th className="px-6 py-4 font-bold tracking-wider">Batch ID</th>
                          <th className="px-6 py-4 font-bold tracking-wider">Origin</th>
                          <th className="px-6 py-4 font-bold tracking-wider">Created</th>
                          <th className="px-6 py-4 font-bold tracking-wider text-right">Units</th>
                          <th className="px-6 py-4 font-bold tracking-wider text-center">Trust Score</th>
                          <th className="px-6 py-4 font-bold tracking-wider">Sig. Status</th>
                          <th className="px-6 py-4 font-bold tracking-wider text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2E3638]/30 text-sm">
                        {batches.map((batch) => (
                          <tr
                            key={batch.id}
                            className={`transition-colors group cursor-default ${
                              batch.isActive
                                ? 'bg-[#1f707a]/5 border-l-2 border-l-[#1f707a]'
                                : 'hover:bg-white/5'
                            }`}
                          >
                            <td className={`px-6 py-4 font-mono ${batch.isActive ? 'text-white font-bold' : 'text-white group-hover:text-[#1f707a]'} transition-colors`}>
                              {batch.batchId}
                            </td>
                            <td className="px-6 py-4 text-gray-300">{batch.origin}</td>
                            <td className="px-6 py-4 text-gray-500 font-mono text-xs">{batch.created}</td>
                            <td className="px-6 py-4 text-gray-300 text-right font-mono">{batch.units.toLocaleString()}</td>
                            <td className="px-6 py-4 text-center">
                              <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${getTrustScoreColor(batch.trustScore)} ${
                                batch.trustScore >= 90 ? 'shadow-[0_0_15px_-3px_rgba(64,204,64,0.4)]' : ''
                              }`}>
                                {batch.trustScore}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className={`flex items-center gap-2 text-xs ${getSignatureStatus(batch.signatureStatus).color}`}>
                                <Icon name={getSignatureStatus(batch.signatureStatus).icon} className={`text-[16px] ${batch.signatureStatus === 'unsigned' ? 'animate-pulse' : ''}`} />
                                <span className="font-mono">{getSignatureStatus(batch.signatureStatus).label}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {batch.signatureStatus === 'unsigned' ? (
                                <button className="bg-[#1f707a] hover:bg-[#2a8a96] text-white px-4 py-1.5 rounded-md text-xs font-bold shadow-[0_0_20px_-5px_rgba(31,112,122,0.5)] transition-all flex items-center gap-1 ml-auto">
                                  <Icon name="edit_square" className="text-[16px]" />
                                  SIGN
                                </button>
                              ) : batch.signatureStatus === 'invalid' ? (
                                <button className="text-[#FF453A] hover:text-red-400 transition-colors font-medium text-xs uppercase tracking-wide border border-[#FF453A]/20 hover:border-[#FF453A]/50 px-3 py-1 rounded bg-[#FF453A]/5">
                                  Quarantine
                                </button>
                              ) : (
                                <button className="text-gray-400 hover:text-white transition-colors font-medium text-xs uppercase tracking-wide border border-transparent hover:border-gray-600 px-3 py-1 rounded">
                                  Details
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="p-4 border-t border-[#2E3638] bg-[#15191B] flex justify-between items-center text-xs text-gray-500">
                    <span className="font-mono">Showing 4 of 28 records</span>
                    <div className="flex gap-1">
                      <button className="p-1 rounded hover:bg-white/10 text-gray-400">
                        <Icon name="first_page" className="text-[18px]" />
                      </button>
                      <button className="p-1 rounded hover:bg-white/10 text-gray-400">
                        <Icon name="chevron_left" className="text-[18px]" />
                      </button>
                      <span className="px-3 py-1 bg-white/5 rounded text-white font-mono">1</span>
                      <button className="p-1 rounded hover:bg-white/10 text-gray-400">
                        <Icon name="chevron_right" className="text-[18px]" />
                      </button>
                      <button className="p-1 rounded hover:bg-white/10 text-gray-400">
                        <Icon name="last_page" className="text-[18px]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Sign Panel */}
              <div className="xl:col-span-4 flex flex-col h-full">
                <div className="bg-[#161B1E] border border-[#2E3638] rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col h-full relative transition-all duration-300 hover:shadow-[0_0_20px_rgba(31,112,122,0.3)] hover:border-[#1f707a]/60">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-[#1f707a]/10 rounded-full blur-[80px] pointer-events-none"></div>
                  
                  <div className="p-5 border-b border-[#2E3638] relative z-10 bg-gradient-to-r from-[#161B1E] to-[#1A2024]">
                    <h3 className="text-lg font-['Space_Grotesk'] font-medium text-white flex items-center gap-2">
                      <Icon name="key" className="text-[#1f707a]" />
                      Sign New Batch
                    </h3>
                  </div>

                  <div className="p-6 flex flex-col gap-6 flex-1 relative z-10">
                    {/* Active Batch */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Active Batch</label>
                        <span className="text-[10px] font-mono text-[#1f707a] animate-pulse">Waiting for signature...</span>
                      </div>
                      <div className="p-4 bg-[#0E1113] rounded-lg border border-[#2E3638] font-mono text-sm text-white flex justify-between items-center group cursor-pointer hover:border-[#1f707a]/50 transition-colors">
                        <span className="group-hover:text-[#1f707a] transition-colors">0x8C3D1E...</span>
                        <span className="text-[#FFD60A] text-xs font-bold px-2 py-0.5 rounded bg-[#FFD60A]/10 border border-[#FFD60A]/20">PENDING</span>
                      </div>
                    </div>

                    {/* Hardware Auth */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Hardware Authenticator</label>
                      <div className="relative group">
                        <input
                          className="w-full bg-[#0E1113] border border-[#2E3638] rounded-lg p-3 pl-10 text-white placeholder-gray-600 focus:outline-none focus:border-[#1f707a] focus:ring-1 focus:ring-[#1f707a] font-mono text-sm group-hover:border-gray-600 transition-colors"
                          readOnly
                          type="text"
                          value="YubiKey 5 NFC (Connected)"
                        />
                        <Icon name="usb" className="absolute left-3 top-3 text-[#40CC40] text-[20px]" />
                        <span className="absolute right-3 top-3 w-2 h-2 bg-[#40CC40] rounded-full animate-pulse shadow-[0_0_15px_-3px_rgba(64,204,64,0.4)]"></span>
                      </div>
                    </div>

                    {/* Signature Visualization */}
                    <div className="flex-1 min-h-[200px] bg-[#080A0B] rounded-lg border border-[#2E3638] relative overflow-hidden group">
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'linear-gradient(rgba(31,112,122,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(31,112,122,0.05) 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                      }}></div>
                      
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-[#0B0E11]/90 backdrop-blur-md px-5 py-3 rounded-xl border border-[#1f707a]/30 flex flex-col items-center gap-2 shadow-xl">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1f707a] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#1f707a]"></span>
                            </span>
                            <span className="text-xs font-mono text-[#1f707a] font-bold">Ed25519 READY</span>
                          </div>
                          <span className="text-[10px] text-gray-500 font-mono">Key Fingerprint: 8F:2A...C4</span>
                        </div>
                      </div>
                    </div>

                    {/* Sign Button */}
                    <button className="w-full py-4 bg-[#1f707a] hover:bg-[#2a8a96] text-white rounded-lg font-bold shadow-[0_0_20px_-5px_rgba(31,112,122,0.5)] transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-wider group relative overflow-hidden">
                      <Icon name="fingerprint" />
                      Sign & Commit Batch
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Grid */}
            <div className="bg-[#161B1E] border border-[#2E3638] rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="p-5 border-b border-[#2E3638] flex justify-between items-center bg-[#191e20]">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-['Space_Grotesk'] font-medium text-white flex items-center gap-2">
                    <Icon name="qr_code_2" className="text-gray-500" />
                    Inventory Grid
                  </h3>
                  <div className="h-4 w-px bg-gray-700"></div>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400 text-xs font-mono border border-white/5">Batch 0x8C3D1E</span>
                </div>
                <div className="text-xs text-gray-400 font-mono flex items-center gap-4">
                  <span>1,500 LABELS GENERATED</span>
                  <span className="text-[#40CC40] flex items-center gap-1">
                    <Icon name="check_circle" className="text-[14px]" />
                    READY FOR PRINT
                  </span>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {qrCodes.map((qr) => (
                    <div key={qr.id} className="bg-white p-3 rounded-lg relative group transition-all duration-300 hover:shadow-[0_0_20px_rgba(31,112,122,0.3)] hover:border hover:border-[#1f707a]/60">
                      <div className="aspect-square bg-white flex items-center justify-center mb-2 overflow-hidden relative">
                        {/* Simple QR code placeholder */}
                        <div className="w-full h-full bg-black flex items-center justify-center text-white text-xs">
                          QR
                        </div>
                        <div className="absolute inset-0 bg-[#1f707a]/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          <button className="p-2 rounded-full bg-white text-[#1f707a] hover:scale-110 transition-transform shadow-lg">
                            <Icon name="print" className="text-[20px]" />
                          </button>
                          <span className="text-[10px] text-white font-bold uppercase tracking-wider">Print Label</span>
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-gray-600 text-center truncate font-medium">{qr.id}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Download Button */}
        <button className="fixed bottom-8 right-8 z-50 bg-[#1f707a] hover:bg-[#2a8a96] text-white pl-5 pr-6 py-4 rounded-2xl shadow-[0_0_20px_-5px_rgba(31,112,122,0.5)] flex items-center gap-3 transition-all hover:-translate-y-1 group">
          <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
            <Icon name="download" className="text-[24px]" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold uppercase tracking-wider">Download All</span>
            <span className="text-[10px] opacity-80 font-mono">1.2GB • ZIP ARCHIVE</span>
          </div>
        </button>
      </main>
    </div>
  );
};

export default DistributorBatchManagement;
