import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { distributorService, type Medicine } from '../services/distributor';

const NewLotManifest: React.FC = () => {
  const navigate = useNavigate();
  
  // Available medicines from API
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loadingMedicines, setLoadingMedicines] = useState(true);
  
  // Form state
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const data = await distributorService.getMedicines();
      setMedicines(data);
      if (data.length > 0) {
        setSelectedMedicineId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching medicines:', err);
      setError('Failed to load medicines. Please try again.');
    } finally {
      setLoadingMedicines(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const manifest = await distributorService.createLotManifest({
        batch_number: batchId,
        expiry_date: expiryDate,
        medicine: selectedMedicineId,
      });
      
      // Navigate to QR code page after successful creation
      navigate(`/distributor/qr-codes/${manifest.id}`);
    } catch (err: any) {
      console.error('Manifest creation error:', err);
      const errorData = err.response?.data;
      if (typeof errorData === 'object') {
        const firstError = Object.values(errorData)[0];
        setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
      } else {
        setError(errorData || 'Failed to create manifest. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f6f5f8] text-[#131018] font-['Manrope'] min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e5e7eb] bg-white px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="size-8 text-[#5500ff] flex items-center justify-center bg-[#5500ff]/10 rounded-lg">
            <Icon name="verified_user" className="text-2xl" />
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-tight hidden sm:block">
            RxVerify <span className="text-[#5500ff]">Lite</span>
          </h2>
        </div>
        <div className="flex flex-1 justify-end gap-6 items-center">
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => navigate('/distributor/batch-management')} className="text-sm font-medium hover:text-[#5500ff] transition-colors">
              Dashboard
            </button>
            <a className="text-sm font-medium text-[#5500ff]" href="#">Manifests</a>
            <a className="text-sm font-medium hover:text-[#5500ff] transition-colors" href="#">Reports</a>
          </nav>
          <div className="h-6 w-px bg-[#e5e7eb] hidden md:block"></div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 text-sm font-medium opacity-70 hover:opacity-100">
              <Icon name="help" className="text-[20px]" />
            </button>
            <button className="flex items-center gap-2 text-sm font-medium opacity-70 hover:opacity-100">
              <Icon name="notifications" className="text-[20px]" />
            </button>
            <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-full size-9 ml-2 border border-[#e5e7eb] flex items-center justify-center text-white font-bold text-xs">
              KM
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 md:p-8 lg:p-12">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap gap-2 mb-6 text-sm">
          <button onClick={() => navigate('/distributor/batch-management')} className="text-gray-500 hover:text-[#5500ff] transition-colors">
            Dashboard
          </button>
          <span className="text-gray-400">/</span>
          <a className="text-gray-500 hover:text-[#5500ff] transition-colors" href="#">Manifests</a>
          <span className="text-gray-400">/</span>
          <span className="text-[#5500ff] font-medium">New Lot Manifest</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Panel: Form Wizard */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Page Heading */}
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight">New Lot Manifest</h1>
              <p className="text-gray-600 text-base">Enter lot details to generate a secure supply chain manifest.</p>
            </div>

            {/* Step Progress */}
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 shadow-sm">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <p className="text-sm font-bold uppercase tracking-wider text-gray-500">Step 2 of 3</p>
                  <p className="text-lg font-bold text-[#5500ff]">Batch Control</p>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#5500ff] w-2/3 rounded-full relative">
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/30"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="bg-white border border-[#e5e7eb] rounded-xl p-6 md:p-8 shadow-sm flex flex-col gap-8">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                  <Icon name="error" className="text-red-500" />
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Section: Product Identity */}
              <div className="flex flex-col gap-5">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span className="flex items-center justify-center size-6 rounded bg-[#5500ff]/10 text-[#5500ff] text-xs font-bold">1</span>
                  Product Definition
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex flex-col gap-2 col-span-1 md:col-span-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Select Medicine</span>
                    {loadingMedicines ? (
                      <div className="w-full rounded-lg border border-[#e5e7eb] bg-gray-50 p-4 text-base text-gray-500 flex items-center gap-2">
                        <Icon name="hourglass_empty" className="animate-spin" />
                        Loading medicines...
                      </div>
                    ) : medicines.length === 0 ? (
                      <div className="w-full rounded-lg border border-[#e5e7eb] bg-yellow-50 p-4 text-base text-yellow-800 flex items-center gap-2">
                        <Icon name="warning" />
                        No medicines registered. Please register a medicine first.
                      </div>
                    ) : (
                      <div className="relative">
                        <select
                          value={selectedMedicineId}
                          onChange={(e) => setSelectedMedicineId(e.target.value)}
                          className="w-full appearance-none rounded-lg border border-[#e5e7eb] bg-transparent p-4 pr-10 text-base focus:border-[#5500ff] focus:ring-1 focus:ring-[#5500ff] outline-none transition-all font-medium"
                          required
                        >
                          {medicines.map((med) => (
                            <option key={med.id} value={med.id}>
                              {med.name} ({med.active_ingredient} {med.strength})
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                          <Icon name="expand_more" />
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <hr className="border-[#e5e7eb] border-dashed" />

              {/* Section: Batch Details */}
              <div className="flex flex-col gap-5">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span className="flex items-center justify-center size-6 rounded bg-[#5500ff] text-white text-xs font-bold">2</span>
                  Batch Parameters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Batch ID Number</span>
                    <div className="relative">
                      <input
                        type="text"
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        className="w-full rounded-lg border border-[#e5e7eb] bg-transparent p-4 pl-11 text-base font-mono focus:border-[#5500ff] focus:ring-1 focus:ring-[#5500ff] outline-none transition-all text-gray-900"
                        placeholder="e.g. BATCH-001"
                      />
                      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 flex items-center">
                        <Icon name="tag" className="text-[20px]" />
                      </div>
                    </div>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Expiry Date</span>
                    <div className="relative">
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full rounded-lg border border-[#e5e7eb] bg-transparent p-4 pl-11 text-base focus:border-[#5500ff] focus:ring-1 focus:ring-[#5500ff] outline-none transition-all text-gray-900"
                      />
                      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 flex items-center">
                        <Icon name="calendar_today" className="text-[20px]" />
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex justify-between items-center pt-6 mt-4 border-t border-[#e5e7eb]">
                <button
                  type="button"
                  onClick={() => navigate('/distributor/batch-management')}
                  className="px-6 py-3 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <div className="flex gap-4">
                  <button
                    type="button"
                    className="px-6 py-3 rounded-lg border border-[#e5e7eb] text-sm font-bold hover:bg-gray-50 transition-all"
                  >
                    Save Draft
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || loadingMedicines || medicines.length === 0}
                    className="px-8 py-3 rounded-lg bg-[#5500ff] text-white text-sm font-bold shadow-lg shadow-[#5500ff]/30 hover:shadow-[#5500ff]/50 hover:bg-[#5500ff]/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Icon name="hourglass_empty" className="text-[18px] animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Icon name="fingerprint" className="text-[18px]" />
                        Generate Manifest
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Right Panel: Security & Verification */}
          <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
            {/* Security Card */}
            <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
              <div className="bg-gray-50 px-6 py-4 border-b border-[#e5e7eb] flex justify-between items-center">
                <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                  <Icon name="lock" className="text-gray-400 text-[18px]" />
                  Cryptographic Proof
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-yellow-100 text-yellow-800">
                  <span className="size-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                  Pending Sign
                </span>
              </div>

              <div className="p-6 flex flex-col gap-6">
                {/* QR Preview */}
                <div className="relative group">
                  <div className="aspect-square w-full bg-white border border-[#e5e7eb] rounded-lg flex items-center justify-center p-4 relative overflow-hidden">
                    {/* Blurred state */}
                    <div className="absolute inset-0 bg-white/60 z-10 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 transition-opacity group-hover:opacity-0">
                      <Icon name="qr_code_2" className="text-4xl text-gray-300" />
                      <p className="text-xs font-medium text-gray-500 text-center px-8">Signature required to generate final QR</p>
                    </div>
                    {/* QR placeholder */}
                    <div className="w-full h-full opacity-30 group-hover:opacity-100 transition-opacity bg-gray-200 flex items-center justify-center">
                      <Icon name="qr_code_2" className="text-6xl text-gray-400" />
                    </div>
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border border-[#e5e7eb] px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 shadow-sm z-20">
                    LABEL PREVIEW
                  </div>
                </div>

                {/* Live Hash Calculation */}
                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Live Hash (SHA-256)</span>
                    <span className="text-[10px] text-[#5500ff] animate-pulse">Calculating...</span>
                  </div>
                  <div className="bg-black/5 rounded-lg p-3 border border-[#e5e7eb] relative overflow-hidden">
                    <p className="font-mono text-[10px] leading-relaxed text-gray-500 break-all select-all">
                      <span className="text-gray-800">9f86d081884c7d659a2feaa0c55ad015</span>a3bf4f1b2b0b822cd15d6c15b0f00a08
                    </p>
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-100/80 to-transparent pointer-events-none"></div>
                  </div>
                </div>

                {/* Digital Signature Block */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400">Digital Signature (Ed25519)</span>
                  <div className="bg-gray-900 rounded-lg p-3 border border-gray-800 relative group cursor-pointer hover:border-gray-600 transition-colors">
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Icon name="content_copy" className="text-gray-500 text-sm" />
                    </div>
                    <p className="font-mono text-[10px] leading-relaxed text-gray-400 break-all opacity-50">
                      0x4a7f...[Waiting for key generation]...e8d9
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer status */}
              <div className="bg-gray-50 px-6 py-3 border-t border-[#e5e7eb] text-[10px] text-gray-500 flex justify-between">
                <span>Security Level: <strong className="text-green-600">High</strong></span>
                <span>Network: <strong className="text-gray-700">Mainnet</strong></span>
              </div>
            </div>

            {/* Helper Box */}
            <div className="bg-[#5500ff]/5 border border-[#5500ff]/20 rounded-xl p-4 flex gap-3 items-start">
              <Icon name="info" className="text-[#5500ff] text-xl mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#5500ff] mb-1">Validation Requirement</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Ensure the Batch ID matches the physical packaging exactly. Discrepancies will flag the manifest for manual audit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewLotManifest;
