import React, { useState } from 'react';
import Icon from './Icon';

interface VerificationEvent {
  id: string;
  timestamp: string;
  productName: string;
  productType: string;
  batchId: string;
  origin: string;
  status: 'verified' | 'suspicious' | 'pending';
}

const PharmacistInventoryDashboard: React.FC = () => {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - replace with actual API calls
  const stats = {
    integrityScore: 98,
    integrityChange: 2.4,
    scansToday: 142,
    avgDaily: 120,
    flaggedItems: 1
  };

  const events: VerificationEvent[] = [
    {
      id: '1',
      timestamp: 'Today, 10:42 AM',
      productName: 'Amoxicillin 500mg',
      productType: 'Capsules',
      batchId: '#B4920',
      origin: 'Pfizer Direct',
      status: 'verified'
    },
    {
      id: '2',
      timestamp: 'Today, 09:15 AM',
      productName: 'Lipitor 20mg',
      productType: 'Tablets',
      batchId: '#X2911',
      origin: 'McKesson',
      status: 'verified'
    },
    {
      id: '3',
      timestamp: 'Yesterday, 4:50 PM',
      productName: 'OxyContin 40mg',
      productType: 'Controlled Substance',
      batchId: '#F9922',
      origin: 'Unknown Dist.',
      status: 'suspicious'
    },
    {
      id: '4',
      timestamp: 'Yesterday, 2:30 PM',
      productName: 'Metformin 500mg',
      productType: 'Tablets',
      batchId: '#M8812',
      origin: 'Amerisource',
      status: 'verified'
    },
    {
      id: '5',
      timestamp: 'Yesterday, 11:15 AM',
      productName: 'Lisinopril 10mg',
      productType: 'Tablets',
      batchId: '#L2291',
      origin: 'Cardinal Health',
      status: 'verified'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-50 text-green-700 border-green-200';
      case 'suspicious': return 'bg-red-50 text-red-700 border-red-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRowBgColor = (status: string) => {
    if (status === 'suspicious') return 'bg-red-50/30 hover:bg-red-50/50';
    return 'hover:bg-gray-50';
  };

  return (
    <div className="bg-[#f6f5f8] text-[#131018] font-display h-screen flex overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0 z-20">
        {/* Logo Area */}
        <div className="p-6 flex items-center gap-3">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(85,0,255,0.3)]">
            <Icon name="verified_user" className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-[#131018] text-lg font-bold leading-tight tracking-tight">RxVerify Lite</h1>
            <p className="text-[#6d5e8d] text-xs font-medium">Pharmacy Portal</p>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 py-2 flex flex-col gap-1 overflow-y-auto">
          <button
            onClick={() => setActiveNav('dashboard')}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
              activeNav === 'dashboard'
                ? 'bg-primary/10 text-primary'
                : 'text-[#6d5e8d] hover:bg-gray-50 hover:text-[#131018]'
            }`}
          >
            <Icon name="dashboard" className={activeNav === 'dashboard' ? 'filled' : ''} />
            <span className="text-sm font-bold">Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveNav('inventory')}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
              activeNav === 'inventory'
                ? 'bg-primary/10 text-primary'
                : 'text-[#6d5e8d] hover:bg-gray-50 hover:text-[#131018]'
            }`}
          >
            <Icon name="inventory_2" />
            <span className="text-sm font-medium">Inventory</span>
          </button>
          
          <button
            onClick={() => setActiveNav('alerts')}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors justify-between ${
              activeNav === 'alerts'
                ? 'bg-primary/10 text-primary'
                : 'text-[#6d5e8d] hover:bg-gray-50 hover:text-[#131018]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon name="notifications" />
              <span className="text-sm font-medium">Alerts</span>
            </div>
            <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">2</span>
          </button>
          
          <button
            onClick={() => setActiveNav('verify')}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
              activeNav === 'verify'
                ? 'bg-primary/10 text-primary'
                : 'text-[#6d5e8d] hover:bg-gray-50 hover:text-[#131018]'
            }`}
          >
            <Icon name="verified" />
            <span className="text-sm font-medium">Verify</span>
          </button>
          
          <button
            onClick={() => setActiveNav('settings')}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
              activeNav === 'settings'
                ? 'bg-primary/10 text-primary'
                : 'text-[#6d5e8d] hover:bg-gray-50 hover:text-[#131018]'
            }`}
          >
            <Icon name="settings" />
            <span className="text-sm font-medium">Settings</span>
          </button>

          {/* Quick Actions Divider */}
          <div className="mt-6 mb-2 px-3">
            <p className="text-xs font-bold text-[#6d5e8d] uppercase tracking-wider">Quick Actions</p>
          </div>
          
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#131018] hover:bg-gray-50 text-left transition-colors">
            <div className="size-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <Icon name="report_problem" className="text-lg" />
            </div>
            <span className="text-sm font-medium">Report Issue</span>
          </button>
          
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#131018] hover:bg-gray-50 text-left transition-colors">
            <div className="size-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Icon name="local_shipping" className="text-lg" />
            </div>
            <span className="text-sm font-medium">Request Restock</span>
          </button>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="size-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
              SC
            </div>
            <div className="flex flex-col overflow-hidden">
              <p className="text-sm font-bold text-[#131018] truncate">Dr. Sarah Chen</p>
              <p className="text-xs text-[#6d5e8d] truncate">Head Pharmacist</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 shrink-0 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-[#131018]">Dashboard Overview</h2>
            <span className="px-2 py-0.5 rounded border border-gray-200 bg-white text-xs text-[#6d5e8d] font-medium">
              v2.4.0 Live
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
              <input
                className="h-10 pl-10 pr-4 w-80 rounded-lg border-none bg-gray-100 text-sm focus:ring-2 focus:ring-primary/50 placeholder-gray-500"
                placeholder="Search batch ID, drug name..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="size-10 rounded-lg hover:bg-gray-100 flex items-center justify-center text-[#6d5e8d] transition-colors relative">
              <Icon name="notifications" />
              <span className="absolute top-2.5 right-2.5 size-2 bg-red-600 rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-6 h-full">
            {/* Left Column: Stats & Table */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Integrity Score */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon name="shield" className="text-6xl text-primary" />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="security" className="text-primary text-xl" />
                    <p className="text-sm font-semibold text-[#6d5e8d]">Integrity Score</p>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-[#131018]">
                      {stats.integrityScore}<span className="text-lg text-gray-400">%</span>
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-green-600 text-xs font-bold">
                      <Icon name="trending_up" className="text-sm" />
                      <span>+{stats.integrityChange}% this week</span>
                    </div>
                  </div>
                </div>

                {/* Scans Today */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon name="qr_code_scanner" className="text-6xl text-blue-500" />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="qr_code" className="text-blue-500 text-xl" />
                    <p className="text-sm font-semibold text-[#6d5e8d]">Scans Today</p>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-[#131018]">{stats.scansToday}</p>
                    <div className="flex items-center gap-1 mt-1 text-[#6d5e8d] text-xs font-medium">
                      <span>Avg. {stats.avgDaily} daily</span>
                    </div>
                  </div>
                </div>

                {/* Flagged Items */}
                <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon name="warning" className="text-6xl text-red-600" />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="report" className="text-red-600 text-xl" />
                    <p className="text-sm font-semibold text-red-600">Flagged Items</p>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-[#131018]">{stats.flaggedItems}</p>
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-xs font-bold">
                      <span>Action Required</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Events Table */}
              <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden min-h-[400px]">
                <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h3 className="text-lg font-bold text-[#131018]">Recent Events</h3>
                    <p className="text-xs text-[#6d5e8d]">Real-time inventory verification feed</p>
                  </div>
                  <button className="text-sm text-primary font-bold hover:underline">View All</button>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-xs font-bold text-[#6d5e8d] uppercase tracking-wider">Timestamp</th>
                        <th className="px-6 py-3 text-xs font-bold text-[#6d5e8d] uppercase tracking-wider">Product Name</th>
                        <th className="px-6 py-3 text-xs font-bold text-[#6d5e8d] uppercase tracking-wider">Batch ID</th>
                        <th className="px-6 py-3 text-xs font-bold text-[#6d5e8d] uppercase tracking-wider">Origin</th>
                        <th className="px-6 py-3 text-xs font-bold text-[#6d5e8d] uppercase tracking-wider text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {events.map((event) => (
                        <tr key={event.id} className={`group transition-colors ${getRowBgColor(event.status)}`}>
                          <td className="px-6 py-4 text-sm text-[#6d5e8d] whitespace-nowrap">{event.timestamp}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-[#131018]">{event.productName}</span>
                              <span className="text-xs text-[#6d5e8d]">{event.productType}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-mono text-xs px-2 py-1 rounded ${
                              event.status === 'suspicious' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-[#131018]'
                            }`}>
                              {event.batchId}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#131018]">
                            {event.origin === 'Unknown Dist.' ? (
                              <span className="italic text-[#6d5e8d]">{event.origin}</span>
                            ) : (
                              event.origin
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(event.status)}`}>
                              <Icon
                                name={event.status === 'verified' ? 'check_circle' : 'warning'}
                                className="text-[16px]"
                              />
                              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Rail: Widgets */}
            <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
              {/* Scan FAB / Primary Action Card */}
              <div className="bg-gradient-to-br from-primary to-[#3d00b8] rounded-2xl p-6 text-white shadow-xl shadow-primary/30 relative overflow-hidden group cursor-pointer transition-transform hover:-translate-y-1">
                {/* Decorative Circles */}
                <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/10 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 size-20 rounded-full bg-white/5 blur-xl"></div>
                <div className="relative z-10 flex flex-col items-center text-center gap-4">
                  <div className="relative">
                    {/* Pulsing Ring */}
                    <div className="absolute inset-0 rounded-full bg-white/30 animate-ping"></div>
                    <div className="size-16 bg-white text-primary rounded-full flex items-center justify-center shadow-lg">
                      <Icon name="qr_code_scanner" className="text-3xl" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Scan to Receive</h3>
                    <p className="text-primary-100 text-xs mt-1">Verify batch ID via camera</p>
                  </div>
                </div>
              </div>

              {/* Last Scan Location Map */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-bold text-[#131018] text-sm">Last Scan Location</h4>
                </div>
                <div className="h-48 relative bg-gray-100 w-full">
                  {/* Map Placeholder */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <Icon name="map" className="text-6xl text-gray-300" />
                  </div>
                  {/* Location Pin */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center">
                    <div className="bg-white px-2 py-1 rounded shadow-md text-[10px] font-bold text-[#131018] mb-1 whitespace-nowrap">
                      Warehouse B
                    </div>
                    <Icon name="location_on" className="text-primary text-4xl drop-shadow-md" />
                  </div>
                </div>
                <div className="p-4 bg-gray-50/50 text-xs text-[#6d5e8d] flex justify-between items-center">
                  <span>GPS: 34.0522° N, 118.2437° W</span>
                  <span className="text-green-600 font-bold">Match</span>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h4 className="font-bold text-[#131018] text-sm">System Status</h4>
                  <span className="size-2 rounded-full bg-green-600"></span>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 size-2 rounded-full bg-green-500 shrink-0"></div>
                    <div>
                      <p className="text-xs font-bold text-[#131018]">Database Sync</p>
                      <p className="text-[10px] text-[#6d5e8d]">Updated 2m ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 size-2 rounded-full bg-green-500 shrink-0"></div>
                    <div>
                      <p className="text-xs font-bold text-[#131018]">API Gateway</p>
                      <p className="text-[10px] text-[#6d5e8d]">Operational</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 size-2 rounded-full bg-yellow-500 shrink-0"></div>
                    <div>
                      <p className="text-xs font-bold text-[#131018]">Label Printer</p>
                      <p className="text-[10px] text-[#6d5e8d]">Low Ink Warning</p>
                    </div>
                  </div>
                </div>
                <div className="mt-auto p-4 border-t border-gray-200">
                  <button className="w-full py-2 px-3 rounded-lg border border-gray-200 text-xs font-bold text-[#131018] hover:bg-gray-50 transition-colors">
                    Run Diagnostics
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Mobile Action */}
      <div className="fixed bottom-6 right-6 lg:hidden z-50">
        <button className="size-14 rounded-full bg-primary text-white shadow-[0_0_15px_rgba(85,0,255,0.3)] flex items-center justify-center relative">
          <span className="absolute inset-0 rounded-full bg-primary/50 animate-ping"></span>
          <Icon name="qr_code_scanner" className="text-2xl relative z-10" />
        </button>
      </div>
    </div>
  );
};

export default PharmacistInventoryDashboard;
