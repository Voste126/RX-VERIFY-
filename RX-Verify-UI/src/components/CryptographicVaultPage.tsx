import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { api } from '../services/api';
import { authService } from '../services/auth';

const CryptographicVaultPage: React.FC = () => {
  const navigate = useNavigate();
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distributorId, setDistributorId] = useState<string | null>(null);

  useEffect(() => {
    generateKeys();
  }, []);

  const generateKeys = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const user = authService.getCurrentUser();
      if (!user || user.role !== 'Distributor') {
        setError('You must be logged in as a distributor to access this page');
        return;
      }

      // Create Distributor entity - backend will generate Ed25519 keypair
      const response = await api.post('/distributors/', {
        name: user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.username,
      });

      const { id, public_key, private_key } = response.data;
      
      setDistributorId(id);
      setPublicKey(public_key || '');
      setPrivateKey(private_key || '');
      
      // Store distributor ID in localStorage for later use
      localStorage.setItem('distributor_id', id);
      
    } catch (err: any) {
      console.error('Key generation error:', err);
      setError(err.response?.data?.detail || 'Failed to generate cryptographic keys');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadKeyBackup = () => {
    const keyData = {
      distributorId,
      publicKey,
      privateKey,
      timestamp: new Date().toISOString(),
      warning: 'KEEP THIS FILE SECURE! Anyone with access to your private key can impersonate you.',
    };

    const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rxverify-keys-${distributorId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
    console.log(`${label} copied to clipboard`);
  };

  return (
    <div className="bg-[#0a0e1a] text-white font-display min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-gray-800">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-8 rounded bg-primary/20 flex items-center justify-center text-primary">
            <Icon name="verified_user" className="text-2xl" />
          </div>
          <div>
            <h2 className="text-lg font-bold">RxVerify Lite</h2>
            <p className="text-xs text-gray-400">Distributor Portal</p>
          </div>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-[640px]">
          {/* Title Section */}
          <div className="mb-8 text-center">
            <p className="text-sm text-blue-400 font-semibold uppercase tracking-wider mb-2">STEP 2 OF 2</p>
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Icon name="key" className="text-primary text-2xl" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-black">Cryptographic Vault</h1>
                <p className="text-gray-400">Secure Identity Management</p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="bg-[#151923] border border-gray-700 rounded-xl p-12 text-center">
              <Icon name="hourglass_empty" className="text-5xl text-primary animate-spin mx-auto mb-4" />
              <p className="text-lg font-semibold">Generating Ed25519 Keypair...</p>
              <p className="text-sm text-gray-400 mt-2">Please wait while we create your cryptographic identity</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <Icon name="error" className="text-red-400 text-4xl mx-auto mb-3" />
              <p className="text-red-300 font-semibold text-center">{error}</p>
              <button 
                onClick={generateKeys}
                className="mt-4 mx-auto block px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Keys Display */}
          {!isLoading && !error && publicKey && privateKey && (
            <>
              {/* Vault Card */}
              <div className="bg-[#151923] border border-gray-700 rounded-xl p-8 space-y-6">
                {/* Public Key */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm text-gray-400 flex items-center gap-2">
                      Public Key (Identity)
                      <Icon name="help" className="text-gray-500 text-sm cursor-help" />
                    </label>
                  </div>
                  <div className="bg-[#0a0e1a] border border-gray-700 rounded-lg px-4 py-3 flex items-center justify-between group">
                    <span className="text-blue-400 font-mono text-sm truncate">{publicKey}</span>
                    <button
                      className="ml-3 text-gray-500 hover:text-primary transition-colors"
                      onClick={() => copyToClipboard(publicKey, 'Public key')}
                    >
                      <Icon name="content_copy" className="text-lg" />
                    </button>
                  </div>
                </div>

                {/* Private Key */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm text-gray-400">Private Key (Secret)</label>
                    <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 rounded px-2 py-1">
                      <Icon name="lock" className="text-red-400 text-xs" />
                      <span className="text-xs text-red-400 font-bold">
                        {showPrivateKey ? 'VISIBLE' : 'HIDDEN'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-[#0a0e1a] border border-red-500/30 rounded-lg px-4 py-3 flex items-center justify-between group">
                    {showPrivateKey ? (
                      <>
                        <span className="text-red-300 font-mono text-sm truncate">{privateKey}</span>
                        <button
                          className="ml-3 text-gray-500 hover:text-primary transition-colors"
                          onClick={() => copyToClipboard(privateKey, 'Private key')}
                        >
                          <Icon name="content_copy" className="text-lg" />
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-600 font-mono">••••••••••••••••••••••••••••••••••••••••••</span>
                    )}
                  </div>
                  <button
                    className="mt-2 text-sm text-primary hover:text-blue-400 transition-colors flex items-center gap-1"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                  >
                    <Icon name={showPrivateKey ? 'visibility_off' : 'visibility'} className="text-base" />
                    {showPrivateKey ? 'Hide' : 'Reveal'} Private Key
                  </button>
                </div>

                {/* Critical Warning */}
                <div className="bg-red-500/10 border-l-4 border-red-500 p-4">
                  <div className="flex items-start gap-3">
                    <Icon name="warning" className="text-red-400 mt-0.5 text-xl" />
                    <div>
                      <p className="text-sm font-bold text-red-300 mb-1">SAVE THE KEY IMMEDIATELY</p>
                      <p className="text-xs text-gray-400">
                        If you lose your private key, you cannot create digital signatures. 
                        RxVerify <span className="text-red-400 font-bold">CANNOT</span> restore lost keys.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Download Key Button */}
                <button 
                  onClick={downloadKeyBackup}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20"
                >
                  <Icon name="download" />
                  Download Key Backup
                </button>
              </div>

              {/* Environment Badge */}
              <div className="mt-6 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full w-fit mx-auto">
                <div className="size-2 rounded-full bg-success animate-pulse"></div>
                <span className="text-xs text-green-400 font-bold">TESTNET ENVIRONMENT</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                <Link
                  to="/register/distributor"
                  className="flex-1 px-6 py-3 rounded-lg border border-gray-700 text-gray-300 font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Icon name="arrow_back" />
                  Back
                </Link>
                <button 
                  onClick={() => navigate('/distributor/batch-management')}
                  className="flex-[2] px-6 py-3 rounded-lg bg-success text-white font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                >
                  Complete Setup
                  <Icon name="check_circle" />
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default CryptographicVaultPage;
