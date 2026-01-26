import React from 'react';
import Icon from './Icon';

const TerminalVisualization: React.FC = () => {
  return (
    <div className="bg-[#0b0e14] rounded-xl border border-gray-800 shadow-2xl overflow-hidden font-mono text-sm">
      <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border-b border-gray-800">
        <div className="flex gap-2">
          <div className="size-3 rounded-full bg-red-500"></div>
          <div className="size-3 rounded-full bg-yellow-500"></div>
          <div className="size-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-xs text-gray-500 ml-2">rxverify-node — bash — 80x24</div>
      </div>
      <div className="p-6 relative min-h-[280px] flex flex-col justify-between">
        <div className="text-gray-500 mb-4 opacity-50">
          &gt; initiating handshake...<br />
          &gt; connecting to peer 192.168.x.x<br />
          &gt; retrieving batch hash...
        </div>
        <div className="relative bg-black/40 p-4 rounded border border-white/5 mb-2">
          <div className="text-xs text-gray-600 mb-1">Incoming Hash String</div>
          <div className="text-primary break-all">
            7f8a9d0c1e2b3a4f5678901234567890abcdef1234567890abcdef12345678
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 p-3 bg-success/10 rounded border border-success/20">
          <div className="size-10 rounded-full bg-success flex items-center justify-center text-black shadow-[0_0_15px_rgba(0,200,83,0.5)]">
            <Icon name="check" className="font-bold" />
          </div>
          <div>
            <div className="text-white font-bold text-lg">Verification Successful</div>
            <div className="text-success text-xs">Signature matches issuer public key</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalVisualization;
