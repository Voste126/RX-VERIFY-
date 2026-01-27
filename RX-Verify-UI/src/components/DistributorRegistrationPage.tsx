import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { authService } from '../services/auth';

const DistributorRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [companyName, setCompanyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePasswordStrength = (pwd: string): { strength: number; label: string } => {
    if (pwd.length === 0) return { strength: 0, label: '' };
    if (pwd.length < 8) return { strength: 1, label: 'Weak' };
    if (pwd.length < 12) return { strength: 2, label: 'Good' };
    return { strength: 3, label: 'Strong' };
  };

  const passwordStrength = calculatePasswordStrength(password);

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
      // Register distributor
      await authService.registerDistributor({
        username,
        email,
        password,
        password2: confirmPassword,
        first_name: firstName,
        last_name: lastName,
        company_name: companyName,
        license_number: licenseNumber,
      });
      
      // Auto-login after successful registration
      await authService.login({ username, password });
      
      // Navigate to cryptographic vault to receive keys
      // Distributor needs to get their Ed25519 keypair before accessing dashboard
      navigate('/register/distributor/vault');
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

      {/* Main Form Content */}
      <main className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-[580px]">
          {/* Title */}
          <div className="mb-8 text-center">
            <p className="text-sm text-blue-400 font-semibold uppercase tracking-wider mb-2">STEP 1 OF 2</p>
            <h1 className="text-4xl font-black mb-3">Create Distributor Account</h1>
            <p className="text-gray-400 text-lg">
              Enter your organization's details to begin the verification process.
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Distributor Name */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Distributor Company Name</label>
              <div className="relative">
                <input
                  className="w-full bg-[#151923] border border-gray-700 focus:border-primary rounded-lg px-4 pr-10 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. Acme Pharma Logistics LLC"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
                <Icon name="business" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
              </div>
            </div>

            {/* Distribution License Number */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Distribution License Number</label>
              <input
                className="w-full bg-[#151923] border border-gray-700 focus:border-primary rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. DL-12345-NY"
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
              />
            </div>

            {/* First and Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">First Name</label>
                <input
                  className="w-full bg-[#151923] border border-gray-700 focus:border-primary rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="John"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Last Name</label>
                <input
                  className="w-full bg-[#151923] border border-gray-700 focus:border-primary rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Doe"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            {/* Username and Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Username</label>
                <input
                  className="w-full bg-[#151923] border border-gray-700 focus:border-primary rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="admin_user"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Email Address</label>
                <input
                  className="w-full bg-[#151923] border border-gray-700 focus:border-primary rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="contact@domain.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Password</label>
                <input
                  className="w-full bg-[#151923] border border-gray-700 focus:border-primary rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {/* Password Strength */}
                {password.length > 0 && (
                  <div className="flex gap-1.5 mt-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full ${
                          level <= passwordStrength.strength ? 'bg-success' : 'bg-gray-700'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-success ml-2">{passwordStrength.label}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Confirm Password</label>
                <input
                  className="w-full bg-[#151923] border border-gray-700 focus:border-primary rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="••••••••"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* KYC Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
              <Icon name="info" className="text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-300 font-medium">Your account will require Level 2 KYC verification</p>
                <p className="text-gray-400 mt-1">Before you can operate on the mainnet.</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Link
                to="/join"
                className="flex-1 px-6 py-3 rounded-lg border border-gray-700 text-gray-300 font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center"
              >
                Back
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-[2] px-6 py-3 rounded-lg bg-primary text-white font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Icon name="hourglass_empty" className="animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <Icon name="arrow_forward" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default DistributorRegistrationPage;
