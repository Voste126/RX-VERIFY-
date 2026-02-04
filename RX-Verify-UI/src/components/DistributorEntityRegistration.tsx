import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Key, Shield, Eye, Copy, Download, AlertTriangle } from 'lucide-react';
import { distributorService, type CreateDistributorEntityData, type DistributorEntity } from '../services/distributor';

const DistributorEntityRegistration: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [companyName, setCompanyName] = useState('');
  const [isVerifiedRegulator, setIsVerifiedRegulator] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Private key modal state
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [distributorId, setDistributorId] = useState<string | null>(null);
  const [keyRevealed, setKeyRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data: CreateDistributorEntityData = {
        name: companyName,
        is_verified_regulator: isVerifiedRegulator,
      };

      const response: DistributorEntity = await distributorService.createDistributorEntity(data);
      
      // Check if private_key exists in response
      if (response.private_key) {
        setPrivateKey(response.private_key);
        setPublicKey(response.public_key);
        setDistributorId(response.id);
        setShowKeyModal(true);
      } else {
        // No private key in response, navigate to dashboard
        navigate('/distributor/dashboard');
      }
    } catch (err: any) {
      console.error('Entity registration error:', err);
      const errorData = err.response?.data;
      if (typeof errorData === 'object') {
        const firstError = Object.values(errorData)[0];
        setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
      } else {
        setError(errorData || 'Failed to create distributor entity. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (privateKey) {
      navigator.clipboard.writeText(privateKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPEM = () => {
    if (privateKey) {
      const pemContent = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
      const blob = new Blob([pemContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `distributor_${distributorId}_private_key.pem`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleCloseModal = () => {
    // Clear sensitive data from memory
    setPrivateKey(null);
    setPublicKey(null);
    setKeyRevealed(false);
    setShowKeyModal(false);
    
    // Navigate to dashboard
    navigate('/distributor/dashboard');
  };

  return (
    <div className="bg-[#0B0E11] text-gray-200 font-['Inter'] min-h-screen  flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-[#0055FF]/10">
              <Shield className="text-[#0055FF] w-12 h-12" />
            </div>
          </div>
          <h1 className="text-3xl font-['Space_Grotesk'] font-bold text-white mb-2">
            Distributor Entity Registration
          </h1>
          <p className="text-gray-400">
            Register your organization and receive cryptographic credentials
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-[#161B1E] border border-[#2E3638] rounded-xl p-8 shadow-xl">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-2 mb-6">
              <AlertTriangle className="text-red-500" size={20} />
              <p className="text-red-500 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Company Name */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
              Company Name *
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-lg border border-[#2E3638] bg-[#0E1113] p-4 text-base text-white focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF] outline-none transition-all"
              placeholder="e.g. Pharma Distributors Ltd"
              required
            />
          </div>

          {/* Verified Regulator Checkbox */}
          <div className="mb-8">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isVerifiedRegulator}
                onChange={(e) => setIsVerifiedRegulator(e.target.checked)}
                className="w-5 h-5 rounded border-[#2E3638] bg-[#0E1113] text-[#0055FF] focus:ring-[#0055FF] focus:ring-offset-0"
              />
              <div>
                <span className="text-white font-medium group-hover:text-[#0055FF] transition-colors">
                  Verified Regulator
                </span>
                <p className="text-xs text-gray-400 mt-0.5">
                  Check this if your organization is a certified regulatory body
                </p>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !companyName.trim()}
            className="w-full px-8 py-4 rounded-lg bg-[#0055FF] text-white text-base font-bold hover:bg-[#0044CC] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_-5px_rgba(0,85,255,0.5)]"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Generating Cryptographic Keys...
              </>
            ) : (
              <>
                <Lock size={20} />
                Create Secure Entity
              </>
            )}
          </button>

          {/* Info Box */}
          <div className="mt-6 bg-[#0055FF]/5 border border-[#0055FF]/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Key className="text-[#0055FF] flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-xs font-bold text-[#0055FF] uppercase tracking-wider mb-1">
                  Secure Vault Key Generation
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Your Ed25519 cryptographic key pair will be generated server-side in a secure vault. 
                  The private key will be displayed ONCE - save it immediately and store it securely.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Private Key Reveal Modal */}
      {showKeyModal && privateKey && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161B1E] border border-[#2E3638] rounded-xl max-w-2xl w-full p-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-[#FFD60A]/10">
                <AlertTriangle className="text-[#FFD60A]" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-['Space_Grotesk'] font-bold text-white">
                  Secret Identity Generated
                </h2>
                <p className="text-sm text-gray-400">
                  This key will NEVER be shown again. Save it now.
                </p>
              </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-[#FFD60A]/10 border border-[#FFD60A]/30 rounded-lg p-4 mb-6">
              <p className="text-[#FFD60A] text-sm font-medium flex items-center gap-2">
                <AlertTriangle size={16} />
                This key is generated by the secure vault. Download or copy it immediately.
              </p>
            </div>

            {/* Private Key Display */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Private Key (Ed25519)
              </label>
              <div className="relative">
                <div 
                  className={`bg-[#0E1113] border border-[#2E3638] rounded-lg p-4 font-mono text-xs leading-relaxed text-white break-all transition-all cursor-pointer ${
                    !keyRevealed ? 'blur-sm hover:blur-none' : ''
                  }`}
                  onClick={() => setKeyRevealed(true)}
                  onMouseEnter={() => setKeyRevealed(true)}
                >
                  {privateKey}
                </div>
                {!keyRevealed && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-[#161B1E] px-4 py-2 rounded-lg border border-[#2E3638] flex items-center gap-2">
                      <Eye size={16} className="text-gray-400" />
                      <span className="text-xs text-gray-400">Hover to reveal</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Public Key Display */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Public Key (Stored on Network)
              </label>
              <div className="bg-[#0E1113] border border-[#2E3638] rounded-lg p-4 font-mono text-xs leading-relaxed text-gray-500 break-all">
                {publicKey}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={handleCopyKey}
                className="flex-1 px-4 py-3 rounded-lg border border-[#2E3638] text-white hover:border-[#0055FF] hover:bg-[#0055FF]/10 transition-all flex items-center justify-center gap-2 font-medium"
              >
                {copied ? (
                  <>
                    <span className="text-[#00C853]">✓</span>
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copy Private Key
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadPEM}
                className="flex-1 px-4 py-3 rounded-lg border border-[#2E3638] text-white hover:border-[#0055FF] hover:bg-[#0055FF]/10 transition-all flex items-center justify-center gap-2 font-medium"
              >
                <Download size={18} />
                Download .PEM
              </button>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleCloseModal}
              className="w-full px-8 py-4 rounded-lg bg-[#0055FF] text-white text-base font-bold hover:bg-[#0044CC] transition-all shadow-[0_0_30px_-5px_rgba(0,85,255,0.5)]"
            >
              I've Saved My Key - Continue to Dashboard
            </button>

            {/* Final Warning */}
            <p className="text-xs text-center text-gray-500 mt-4">
              Closing this modal will permanently clear the private key from memory. Make sure you've saved it.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributorEntityRegistration;
