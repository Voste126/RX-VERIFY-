import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, AlertTriangle, XOctagon, Loader2, ArrowLeft,
  ChevronDown, Flag, FileText, CheckCircle2, ChevronUp, MapPin
} from 'lucide-react';
import { api } from '../services/api';
import TrustGauge from './TrustGauge';

interface Breakdown {
  base: number;
  flag_deductions: number;
  receipt_additions: number;
  active_flags: string[];
  crypto_valid: boolean;
  trust_score: number;
}

interface ScanResult {
  lot_id: string;
  batch_number: string;
  medicine: {
    name: string;
    active_ingredient: string;
    strength: string;
    dosage_form: string;
  };
  distributor: string;
  expiry_date: string;
  trust_score: number;
  trust_status: string;
  is_authentic: boolean;
  verification_message: string;
  flags_count: number;
  score_breakdown?: Breakdown;
}

const PatientScanResult: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Reporting Issue State
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportIssueType, setReportIssueType] = useState('Quality Issue');
  const [reportDescription, setReportDescription] = useState('');
  const [reporting, setReporting] = useState(false);
  const [acquiringLocation, setAcquiringLocation] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    if (uuid) {
      verifyCode(uuid);
    } else {
      setError('Invalid QR Code');
      setLoading(false);
    }
  }, [uuid]);

  const verifyCode = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/manifests/${id}/verify-qr/`);
      setResult(response.data);
    } catch (err: any) {
      setError('Failed to verify medicine. The QR code may be invalid or the manifest does not exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uuid || !reportDescription.trim()) return;
    
    setAcquiringLocation(true);
    setReporting(true);
    
    let lat: number | undefined;
    let lng: number | undefined;

    try {
      // Create a promise to handle geolocation with timeout
      const getPosition = () => {
        return new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by your browser"));
          } else {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          }
        });
      };

      const position = await getPosition();
      lat = position.coords.latitude;
      lng = position.coords.longitude;
    } catch (err) {
      console.warn("Could not acquire location. Submitting flag without spatial data.", err);
      // Graceful fallback to null coords, will just submit without them
    } finally {
      setAcquiringLocation(false);
    }
    
    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await api.post('/flags/', {
        lot: uuid,
        issue_type: reportIssueType,
        description: reportDescription,
        severity: reportIssueType === 'Counterfeit Suspected' ? 'CRITICAL' : 'HIGH',
        reporter_type: 'Patient',
        ...(lat !== undefined && { latitude: lat }),
        ...(lng !== undefined && { longitude: lng })
      }, { headers });
      
      setReportSuccess(true);
      setShowReportForm(false);
      setReportDescription('');
      
      // Re-fetch to update TrustGauge
      await verifyCode(uuid);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to report issue. Please ensure you are logged in or try again.');
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center p-6 text-center font-display">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Verifying Integrity...</h2>
        <p className="text-gray-400">Analyzing cryptographic signature and supply chain history</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center p-6 font-display">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
          <XOctagon className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">Verification Failed</h2>
          <p className="text-red-200 text-sm mb-8">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Return to Safety
          </button>
        </div>
      </div>
    );
  }

  const isGreen = result.trust_score >= 90;
  const isYellow = result.trust_score >= 70 && result.trust_score < 90;
  const isRed = result.trust_score < 70;
  const bd = result.score_breakdown;

  // The "Stop/Go" Gate Border Class
  let gateBorderClass = "border-gray-800";
  if (isYellow) gateBorderClass = "border-yellow-500 shadow-[0_0_30px_rgba(255,214,10,0.15)] ring-2 ring-yellow-500/50";
  if (isRed) gateBorderClass = "border-red-500 shadow-[0_0_50px_rgba(213,0,0,0.3)] ring-4 ring-red-500 animate-pulse";

  return (
    <div className={`min-h-screen bg-[#0a0e1a] font-display transition-colors duration-500 ${isRed ? 'bg-red-950/20' : ''}`}>
      {/* Top Nav */}
      <div className="bg-[#151923]/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="font-bold text-white flex items-center gap-2 tracking-tight">
            <ShieldCheck className="w-5 h-5 text-primary" />
            RxVerify Lite
          </div>
          <div className="w-10"></div> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 pb-24 space-y-6">
        
        {/* The Hero Element */}
        <div className={`bg-[#151923] rounded-3xl p-8 flex flex-col items-center justify-center border-2 transition-all duration-700 ${gateBorderClass}`}>
          <div className="mb-6 relative">
            {/* TrustGauge takes center stage */}
            <TrustGauge score={result.trust_score} size={220} strokeWidth={18} />
          </div>

          <div className="text-center w-full">
            {isGreen && (
              <div className="bg-[#00C853]/10 border border-[#00C853]/30 rounded-2xl p-4 flex flex-col items-center gap-2 animate-in slide-in-from-bottom-4 fade-in duration-500">
                <CheckCircle2 className="w-10 h-10 text-[#00C853]" />
                <h2 className="text-2xl font-black text-[#00C853] uppercase tracking-wide">Safe to Consume</h2>
                <p className="text-[#00C853]/80 text-sm font-medium">Chain of custody is verified.</p>
              </div>
            )}
            
            {(isYellow || isRed) && (
              <div className={`${isRed ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'} border rounded-2xl p-4 flex flex-col items-center gap-2 animate-in slide-in-from-bottom-4 fade-in duration-500`}>
                <AlertTriangle className={`w-12 h-12 mb-1 ${isRed ? 'text-red-500' : 'text-yellow-500'}`} />
                <h2 className={`text-2xl font-black uppercase tracking-wide ${isRed ? 'text-red-500' : 'text-yellow-500'}`}>
                  Integrity Compromised
                </h2>
                <p className={`text-sm font-medium px-2 ${isRed ? 'text-red-400' : 'text-yellow-400'}`}>
                  {isRed ? 'CRITICAL: Do Not Consume! Return to pharmacy immediately.' : 'WARNING: Flags reported on this batch. Exercise caution.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Transparency Text (Math Breakdown) */}
        {bd && (
          <div className="bg-[#151923] border border-gray-800 rounded-2xl overflow-hidden">
            <button 
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-[15px]">Score Transparency</h3>
                  <p className="text-gray-400 text-xs mt-0.5">How we calculated this trust score</p>
                </div>
              </div>
              {showBreakdown ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
            </button>
            
            {showBreakdown && (
              <div className="p-5 pt-0 border-t border-gray-800/50 bg-[#0a0e1a]/50">
                <div className="space-y-3 mt-4 text-sm font-medium">
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Base Score</span>
                    <span>100.00</span>
                  </div>
                  
                  {!bd.crypto_valid ? (
                    <div className="flex justify-between items-center text-red-400 font-bold border-l-2 border-red-500 pl-3 py-1">
                      <span>Cryptographic Failure</span>
                      <span>Score set to 0</span>
                    </div>
                  ) : (
                    <>
                      {bd.flag_deductions < 0 && (
                        <div className="border-l-2 border-red-500 pl-3 py-1 space-y-1.5">
                          <div className="flex justify-between items-center text-red-400 font-bold">
                            <span>Crowd Flag Deductions</span>
                            <span>{bd.flag_deductions.toFixed(2)}</span>
                          </div>
                          {bd.active_flags.length > 0 && (
                            <p className="text-xs text-red-400/80 leading-relaxed font-normal">
                              Score reduced due to: {bd.active_flags.map((flag, i) => (
                                <span key={i} className="inline-block bg-red-500/20 px-1.5 rounded mx-0.5">{flag}</span>
                              ))}
                            </p>
                          )}
                        </div>
                      )}

                      {bd.receipt_additions > 0 && (
                        <div className="flex flex-col border-l-2 border-green-500 pl-3 py-1">
                          <div className="flex justify-between items-center text-green-400 font-bold">
                            <span>Verified Transit (+2 ea)</span>
                            <span>+{bd.receipt_additions.toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-green-400/80 font-normal mt-1">
                            Added points for verified pharmacist logs.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="pt-3 mt-3 border-t border-gray-700/50 flex justify-between items-center font-black text-white text-lg">
                    <span>Final Score</span>
                    <span className={isGreen ? 'text-green-400' : isYellow ? 'text-yellow-400' : 'text-red-400'}>
                      {bd.trust_score.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Medicine Details */}
        <div className="bg-[#151923] border border-gray-800 rounded-2xl p-5">
          <h3 className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-4">Product Details</h3>
          <div className="space-y-4">
            <div>
              <p className="text-white font-bold text-lg">{result.medicine.name}</p>
              <p className="text-gray-400 text-sm mt-0.5">{result.medicine.active_ingredient} · {result.medicine.strength}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800/50">
              <div>
                <span className="text-xs text-gray-500 block mb-1">Batch Number</span>
                <span className="text-sm font-mono text-gray-300 bg-white/5 py-1 px-2 rounded">{result.batch_number}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Expiry Date</span>
                <span className={`text-sm font-bold ${new Date(result.expiry_date) < new Date() ? 'text-red-400' : 'text-gray-300'}`}>
                  {new Date(result.expiry_date).toLocaleDateString()}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-gray-500 block mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> Distributor</span>
                <span className="text-sm text-gray-300">{result.distributor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Loop (Report Issue) */}
        {!showReportForm ? (
          <button 
            onClick={() => setShowReportForm(true)}
            className="w-full bg-[#151923] hover:bg-white/5 border border-gray-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 group"
          >
            <Flag className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
            Report Issue with Product
          </button>
        ) : (
          <div className="bg-[#151923] border border-orange-500/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,165,0,0.05)] animate-in fade-in zoom-in-95 duration-200">
            {reportSuccess ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-white font-bold text-lg mb-2">Report Submitted Successfully</h3>
                <p className="text-gray-400 text-sm mb-6">Thank you. The Trust Score has been updated universally to protect others.</p>
                <button 
                  onClick={() => setShowReportForm(false)}
                  className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-6 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleReportIssue}>
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  Report An Issue
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Issue Type</label>
                    <select 
                      value={reportIssueType}
                      onChange={(e) => setReportIssueType(e.target.value)}
                      className="w-full bg-[#0a0e1a] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-orange-500/50 appearance-none"
                    >
                      <option value="Quality Issue">Quality Issue</option>
                      <option value="Packaging Damage">Packaging Damage / Broken Seal</option>
                      <option value="Missing Seal">Missing Seal</option>
                      <option value="Counterfeit Suspected">Counterfeit Suspected</option>
                      <option value="Adverse Reaction">Adverse Patient Reaction</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                    <textarea 
                      required
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Please explicitly detail the concern..."
                      className="w-full bg-[#0a0e1a] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-orange-500/50 min-h-[100px]"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowReportForm(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={reporting || !reportDescription.trim()}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-sm flex justify-center items-center gap-2"
                  >
                    {reporting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {acquiringLocation ? "Acquiring Location..." : "Submitting..."}
                      </>
                    ) : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default PatientScanResult;
