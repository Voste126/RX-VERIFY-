import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from './Icon';

const CryptographicVaultPage: React.FC = () => {
  const navigate = useNavigate();
  const [publicKey] = useState('0x7a419280c4d564f7a8b9cd1f2f54edd6d7849f9');
  const [privateKey] = useState('0x4f8e2a1b9c3d5e7f6a8b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e');
  const [showPrivateKey, setShowPrivateKey] = useState(false);

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
                  onClick={() => navigator.clipboard.writeText(publicKey)}
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
                      onClick={() => navigator.clipboard.writeText(privateKey)}
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
                    If you lose your private key, your funds and account access are <span className="text-red-400 font-bold">IRRETRIEVABLE</span>. 
                    RxVerify cannot restore lost keys.
                  </p>
                </div>
              </div>
            </div>

            {/* Download Key Button */}
            <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20">
              <Icon name="download" />
              Download Key Backup
            </button>

            {/* Generate New Identity */}
            <button className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20">
              <Icon name="autorenew" />
              Generate New Identity
            </button>

            {/* Consensus Timer */}
            <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-700">
              <Icon name="schedule" className="text-gray-500 text-lg" />
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-white">01 : 42 : 12</div>
                <div className="text-xs text-gray-500 mt-1">Consensus Active</div>
              </div>
            </div>
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
        </div>
      </main>
    </div>
  );
};

export default CryptographicVaultPage;
