import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { distributorService, type CreateMedicineData } from '../services/distributor';

const MedicineRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [strength, setStrength] = useState('');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [manufacturerName, setManufacturerName] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      const medicineData: CreateMedicineData = {
        name,
        category,
        active_ingredient: activeIngredient,
        strength,
        dosage_form: dosageForm,
        manufacturer_name: manufacturerName,
      };

      await distributorService.createMedicine(medicineData);
      setSuccess(true);
      
      // Navigate to dashboard after success
      setTimeout(() => {
        navigate('/distributor/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('Medicine registration error:', err);
      const errorData = err.response?.data;
      if (typeof errorData === 'object') {
        const firstError = Object.values(errorData)[0];
        setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
      } else {
        setError(errorData || 'Failed to register medicine. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="flex items-center gap-6">
          <div className="px-3 py-1.5 rounded-full bg-[#1A2628] border border-[#1f707a]/20 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#40CC40] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#40CC40]"></span>
            </span>
            <span className="text-[10px] font-mono text-[#1f707a] font-bold tracking-wider">SECURE</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex items-center text-sm font-medium text-gray-500 mb-6">
            <button onClick={() => navigate('/distributor/dashboard')} className="hover:text-[#1f707a] transition-colors">
              Dashboard
            </button>
            <span className="mx-2 text-gray-700">/</span>
            <span className="text-white font-['Space_Grotesk']">Register Medicine</span>
          </nav>

          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-['Space_Grotesk'] font-bold text-white tracking-tight mb-2">
              Register New Medicine
            </h2>
            <p className="text-gray-400 max-w-2xl">
              Add a new pharmaceutical medicine to your inventory. All fields are required to ensure accurate tracking and verification.
            </p>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit} className="bg-[#161B1E] border border-[#2E3638] rounded-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            {/* Success Message */}
            {success && (
              <div className="bg-[#40CC40]/10 border border-[#40CC40]/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <Icon name="check_circle" className="text-[#40CC40]" />
                  <p className="text-[#40CC40] text-sm font-medium">Medicine registered successfully! Redirecting...</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-[#FF453A]/10 border border-[#FF453A]/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <Icon name="error" className="text-[#FF453A]" />
                  <p className="text-[#FF453A] text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0E1113] border border-[#2E3638] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#1f707a] focus:ring-1 focus:ring-[#1f707a] transition-colors"
                  placeholder="e.g., Paracetamol Tablets"
                  required
                />
              </div>

              {/* Active Ingredient */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Active Ingredient *
                </label>
                <input
                  type="text"
                  value={activeIngredient}
                  onChange={(e) => setActiveIngredient(e.target.value)}
                  className="w-full bg-[#0E1113] border border-[#2E3638] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#1f707a] focus:ring-1 focus:ring-[#1f707a] transition-colors"
                  placeholder="e.g., Paracetamol"
                  required
                />
              </div>

              {/* Strength */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Strength *
                </label>
                <input
                  type="text"
                  value={strength}
                  onChange={(e) => setStrength(e.target.value)}
                  className="w-full bg-[#0E1113] border border-[#2E3638] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#1f707a] focus:ring-1 focus:ring-[#1f707a] transition-colors"
                  placeholder="e.g., 500mg"
                  required
                />
              </div>

              {/* Dosage Form */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Dosage Form *
                </label>
                <select
                  value={dosageForm}
                  onChange={(e) => setDosageForm(e.target.value)}
                  className="w-full bg-[#0E1113] border border-[#2E3638] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#1f707a] focus:ring-1 focus:ring-[#1f707a] transition-colors"
                  required
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Suspension">Suspension</option>
                  <option value="Cream">Cream</option>
                  <option value="Ointment">Ointment</option>
                  <option value="Drops">Drops</option>
                  <option value="Inhaler">Inhaler</option>
                </select>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Category *
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0E1113] border border-[#2E3638] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#1f707a] focus:ring-1 focus:ring-[#1f707a] transition-colors"
                  placeholder="e.g., Analgesic, Antibiotic"
                  required
                />
              </div>

              {/* Manufacturer Name */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Manufacturer Name *
                </label>
                <input
                  type="text"
                  value={manufacturerName}
                  onChange={(e) => setManufacturerName(e.target.value)}
                  className="w-full bg-[#0E1113] border border-[#2E3638] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#1f707a] focus:ring-1 focus:ring-[#1f707a] transition-colors"
                  placeholder="e.g., Universal Corporation Ltd"
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 mt-6 border-t border-[#2E3638]">
              <button
                type="button"
                onClick={() => navigate('/distributor/dashboard')}
                className="px-6 py-3 rounded-lg border border-[#2E3638] text-gray-300 hover:text-white hover:border-gray-500 transition-all text-sm font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || success}
                className="px-8 py-3 rounded-lg bg-[#1f707a] hover:bg-[#2a8a96] text-white text-sm font-bold shadow-[0_0_20px_-5px_rgba(31,112,122,0.5)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
              >
                {isLoading ? (
                  <>
                    <Icon name="hourglass_empty" className="animate-spin" />
                    Registering...
                  </>
                ) : success ? (
                  <>
                    <Icon name="check_circle" />
                    Registered
                  </>
                ) : (
                  <>
                    <Icon name="add_circle" />
                    Register Medicine
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-6 bg-[#1f707a]/10 border border-[#1f707a]/30 rounded-lg p-4 flex gap-3 items-start">
            <Icon name="info" className="text-[#1f707a] text-xl mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[#1f707a] mb-1">Important Information</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Ensure all information is accurate. Once registered, this medicine will be available for lot manifest creation and will appear in the pharmacy verification system.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MedicineRegistrationPage;
