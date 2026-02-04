import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import Icon from './Icon';
import { distributorService, type LotManifest } from '../services/distributor';

const QRCodeDisplayPage: React.FC = () => {
  const { manifestId } = useParams<{ manifestId: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [manifest, setManifest] = useState<LotManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (manifestId) {
      fetchManifestData();
    }
  }, [manifestId]);

  const fetchManifestData = async () => {
    try {
      const data = await distributorService.getLotManifestById(manifestId!);
      setManifest(data);
    } catch (err: any) {
      console.error('Error fetching manifest:', err);
      setError('Failed to load manifest data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `QR_Code_${manifest?.batch_number || manifestId}`,
  });

  // Generate QR code data - the manifest ID for patient verification
  const qrCodeData = manifestId || '';

  if (loading) {
    return (
      <div className="bg-[#0B0E11] text-gray-200 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon name="hourglass_empty" className="text-5xl animate-spin mb-4 text-[#1f707a]" />
          <p className="text-gray-400">Loading manifest data...</p>
        </div>
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <div className="bg-[#0B0E11] text-gray/200 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <Icon name="error" className="text-5xl mb-4 text-[#FF453A]" />
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Manifest</h2>
          <p className="text-gray-400 mb-6">{error || 'Manifest not found'}</p>
          <button
            onClick={() => navigate('/distributor/dashboard')}
            className="px-6 py-3 bg-[#1f707a] text-white rounded-lg hover:bg-[#2a8a96] transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0B0E11] text-gray-200 font-['Inter'] min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-18 border-b border-[#2E3638] bg-[#161B1E] flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/distributor/dashboard')} className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#1f707a]/20 text-[#1f707a]">
              <Icon name="security" className="text-xl" />
            </div>
            <h1 className="font-['Space_Grotesk'] text-white text-xl font-bold tracking-tight">
              RxVerify Lite
            </h1>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-[#1f707a] text-white rounded-lg hover:bg-[#2a8a96] transition-all shadow-[0_0_20px_-5px_rgba(31,112,122,0.5)]"
          >
            <Icon name="print" className="text-xl" />
            <span className="text-sm font-bold">Print QR Code</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex items-center text-sm font-medium text-gray-500 mb-6">
            <button onClick={() => navigate('/distributor/dashboard')} className="hover:text-[#1f707a] transition-colors">
              Dashboard
            </button>
            <span className="mx-2 text-gray-700">/</span>
            <button onClick={() => navigate('/distributor/batch-management')} className="hover:text-[#1f707a] transition-colors">
              Lot Manifests
            </button>
            <span className="mx-2 text-gray-700">/</span>
            <span className="text-white font-['Space_Grotesk']">QR Code Display</span>
          </nav>

          {/* Success Message */}
          <div className="bg-[#40CC40]/10 border border-[#40CC40]/30 rounded-lg p-4 mb-8 flex items-center gap-3">
            <Icon name="check_circle" className="text-[#40CC40] text-2xl" />
            <div>
              <p className="text-[#40CC40] font-bold">Lot Manifest Created Successfully!</p>
              <p className="text-gray-400 text-sm">Digital signature has been auto-generated. QR code is ready for printing.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Manifest Details */}
            <div className="bg-[#161B1E] border border-[#2E3638] rounded-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <h2 className="text-2xl font-['Space_Grotesk'] font-bold text-white mb-6 flex items-center gap-2">
                <Icon name="info" className="text-[#1f707a]" />
                Manifest Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Batch Number
                  </label>
                  <p className="text-white font-mono text-lg">{manifest.batch_number}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Expiry Date
                  </label>
                  <p className="text-white font-mono">{manifest.expiry_date}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Trust Score
                  </label>
                  <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-bold font-mono border ${
                    parseFloat(manifest.trust_score) >= 90 
                      ? 'bg-[#40CC40]/10 border-[#40CC40]/30 text-[#40CC40]' 
                      : parseFloat(manifest.trust_score) >= 70
                      ? 'bg-[#FFD60A]/10 border-[#FFD60A]/30 text-[#FFD60A]'
                      : 'bg-[#FF453A]/10 border-[#FF453A]/30 text-[#FF453A]'
                  }`}>
                    {manifest.trust_score}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    Digital Signature (Ed25519)
                  </label>
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 relative group">
                    <p className="font-mono text-[11px] leading-relaxed text-gray-400 break-all">
                      {manifest.digital_signature || 'Signature pending...'}
                    </p>
                    {manifest.digital_signature && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(manifest.digital_signature);
                        }}
                        className="absolute top-2 right-2 p-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
                      >
                        <Icon name="content_copy" className="text-gray-400 text-sm" />
                      </button>
                    )}
                  </div>
                  {manifest.digital_signature && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-[#40CC40]">
                      <Icon name="verified" className="text-sm" />
                      <span>Cryptographically Signed</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Manifest ID
                  </label>
                  <p className="text-gray-300 font-mono text-xs">{manifest.id}</p>
                </div>
              </div>
            </div>

            {/* Right: QR Code Display */}
            <div className="bg-[#161B1E] border border-[#2E3638] rounded-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col">
              <h2 className="text-2xl font-['Space_Grotesk'] font-bold text-white mb-6 flex items-center gap-2">
                <Icon name="qr_code_2" className="text-[#1f707a]" />
                QR Code
              </h2>

              {/* Printable Area */}
              <div ref={printRef} className="flex-1 flex flex-col items-center justify-center bg-white rounded-lg p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">RxVerify Lite</h3>
                  <p className="text-sm text-gray-600">Pharmaceutical Verification System</p>
                </div>

                {/* QR Code */}
                <div className="bg-white p-4 rounded-lg shadow-inner mb-6">
                  <QRCodeSVG
                    value={qrCodeData}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                {/* Batch Info */}
                <div className="text-center space-y-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Batch Number</p>
                  <p className="text-lg font-mono font-bold text-gray-900">{manifest.batch_number}</p>
                  <p className="text-xs text-gray-500">Expiry: {manifest.expiry_date}</p>
                  <p className="text-xs text-gray-400 mt-4">Scan to verify authenticity</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-6 bg-[#1f707a]/10 border border-[#1f707a]/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon name="info" className="text-[#1f707a] text-lg mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-[#1f707a] mb-1">Printing Instructions</p>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>• Print this QR code on medication packaging</li>
                      <li>• Ensure the QR code isreadable and not damaged</li>
                      <li>• Patients can scan to verify authenticity</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between items-center">
            <button
              onClick={() => navigate('/distributor/dashboard')}
              className="px-6 py-3 rounded-lg border border-[#2E3638] text-gray-300 hover:text-white hover:border-gray-500 transition-all text-sm font-bold uppercase tracking-wider"
            >
              Back to Dashboard
            </button>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/distributor/new-manifest')}
                className="px-6 py-3 rounded-lg border border-[#2E3638] text-gray-300 hover:text-white hover:border-gray-500 transition-all text-sm font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <Icon name="add" />
                Create Another
              </button>
              <button
                onClick={handlePrint}
                className="px-8 py-3 rounded-lg bg-[#1f707a] hover:bg-[#2a8a96] text-white text-sm font-bold shadow-[0_0_20px_-5px_rgba(31,112,122,0.5)] transition-all flex items-center gap-2 uppercase tracking-wider"
              >
                <Icon name="print" />
                Print QR Code
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QRCodeDisplayPage;
