import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { authService } from '../services/auth';

const PharmacistOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Register pharmacist
      await authService.registerPharmacist({
        username,
        email,
        password,
        password2: confirmPassword,
        first_name: firstName,
        last_name: lastName,
        pharmacy_name: pharmacyName,
        pharmacy_phone: phoneNumber,
        license_number: licenseNumber,
      });
      
      // Auto-login after successful registration
      await authService.login({ username, password });
      
      // Navigate to pharmacist dashboard
      navigate('/pharmacist/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorData = err.response?.data;
      if (typeof errorData === 'object') {
        // Extract first error message
        const firstError = Object.values(errorData)[0];
        setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
      } else {
        setError(errorData || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f6f6f8] dark:bg-[#101622] text-[#111318] dark:text-white font-display min-h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full bg-white dark:bg-[#1A202C] border-b border-[#f0f2f4] dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                <Icon name="local_pharmacy" className="text-2xl" />
              </div>
              <span className="text-xl font-bold tracking-tight">RxVerify Lite</span>
            </Link>
            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Icon name="lock" className="text-lg" />
                <span>Secure Registration</span>
              </div>
              <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>
              <button className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">
                Help Center
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-start pt-8 pb-12 px-4 sm:px-6">
        <div className="w-full max-w-[640px] flex flex-col gap-6">
          {/* Progress Stepper */}
          <div className="w-full">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-sm font-semibold text-primary uppercase tracking-wider">Registration</p>
                <h2 className="text-lg font-bold mt-1">Professional Verification</h2>
              </div>
            </div>
            {/* Progress Bar Visual */}
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
              <div className="h-full bg-primary w-full animate-pulse"></div>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white dark:bg-[#1A202C] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Status Badge */}
            <div className="bg-warning/15 border-l-4 border-warning p-4 flex items-start gap-3">
              <Icon name="warning" className="text-yellow-700 dark:text-yellow-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold">Account Pending License Verification</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Your account access is limited until your professional credentials have been verified by the state board.
                </p>
              </div>
            </div>

            <div className="p-8 pt-6">
              {/* Header */}
              <div className="mb-8 text-center sm:text-left">
                <h1 className="text-2xl font-bold mb-2">Pharmacist Registration</h1>
                <p className="text-gray-500 dark:text-gray-400">
                  Please provide your details and pharmacy licenseinformation for verification.
                </p>
              </div>

              {/* Form */}
              <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-300 text-sm font-medium">{error}</p>
                  </div>
                )}

                {/* Personal Information Section */}
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="person" className="text-gray-400 text-xl" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                      Personal Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                        First Name
                      </span>
                      <input
                        className="w-full border-b-2 border-gray-200 dark:border-gray-700 bg-transparent pb-3 focus:border-primary outline-none transition-colors"
                        placeholder="John"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                        Last Name
                      </span>
                      <input
                        className="w-full border-b-2 border-gray-200 dark:border-gray-700 bg-transparent pb-3 focus:border-primary outline-none transition-colors"
                        placeholder="Doe"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                      Username
                    </span>
                    <input
                      className="w-full border-b-2 border-gray-200 dark:border-gray-700 bg-transparent pb-3 focus:border-primary outline-none transition-colors"
                      placeholder="pharmacist_username"
                      required
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                      Email Address
                    </span>
                    <input
                      className="w-full border-b-2 border-gray-200 dark:border-gray-700 bg-transparent pb-3 focus:border-primary outline-none transition-colors"
                      placeholder="pharmacist@example.com"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                        Password
                      </span>
                      <div className="relative">
                        <input
                          className="w-full border-b-2 border-gray-200 dark:border-gray-700 bg-transparent pb-3 pr-10 focus:border-primary outline-none transition-colors"
                          placeholder="••••••••"
                          required
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-0 bottom-3 text-gray-400 hover:text-primary"
                        >
                          <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-lg" />
                        </button>
                      </div>
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                        Confirm Password
                      </span>
                      <div className="relative">
                        <input
                          className="w-full border-b-2 border-gray-200 dark:border-gray-700 bg-transparent pb-3 pr-10 focus:border-primary outline-none transition-colors"
                          placeholder="••••••••"
                          required
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-0 bottom-3 text-gray-400 hover:text-primary"
                        >
                          <Icon name={showConfirmPassword ? 'visibility_off' : 'visibility'} className="text-lg" />
                        </button>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Pharmacy Information Section */}
                <div className="flex flex-col gap-5 pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="store" className="text-gray-400 text-xl" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                      Pharmacy Details
                    </h3>
                  </div>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                      Legal Pharmacy Name
                    </span>
                    <input
                      className="w-full border-b-2 border-gray-200 dark:border-gray-700 bg-transparent pb-3 focus:border-primary outline-none transition-colors"
                      placeholder="e.g. Walgreens #1234 or City Apothecary"
                      type="text"
                      value={pharmacyName}
                      onChange={(e) => setPharmacyName(e.target.value)}
                    />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                        Pharmacy Contact Phone
                      </span>
                      <input
                        className="w-full border-b-2 border-gray-200 dark:border-gray-700 bg-transparent pb-3 focus:border-primary outline-none transition-colors"
                        placeholder="(555) 123-4567"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                        State Pharmacy License #
                      </span>
                      <input
                        className="w-full border-b-2 border-gray-200 dark:border-gray-700 bg-transparent pb-3 focus:border-primary outline-none transition-colors"
                        placeholder="e.g. RPH-12345-CA"
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                      />
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6">
                  <Link
                    to="/join"
                    className="flex-1 px-6 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 group"
                  >
                    <Icon name="arrow_back" className="text-lg group-hover:-translate-x-1 transition-transform" />
                    Back
                  </Link>
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="flex-[2] px-6 py-3 rounded-lg bg-primary text-white font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Icon name="hourglass_empty" className="text-lg animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <Icon name="check_circle" className="text-lg" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Trust Footer inside card */}
            <div className="bg-gray-50 dark:bg-gray-900/50 px-8 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center sm:justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Icon name="verified_user" className="text-green-500 text-lg" />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Bank-level encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="gavel" className="text-blue-500 text-lg" />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">HIPAA Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PharmacistOnboardingPage;
