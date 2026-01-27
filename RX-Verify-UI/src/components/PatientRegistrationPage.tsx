import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { authService } from '../services/auth';

const PatientRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePasswordStrength = (pwd: string): { strength: number; label: string; color: string } => {
    if (pwd.length === 0) return { strength: 0, label: '', color: '' };
    if (pwd.length < 6) return { strength: 1, label: 'Weak', color: 'bg-red-500' };
    if (pwd.length < 10) return { strength: 2, label: 'Good strength', color: 'bg-success' };
    if (pwd.length < 14) return { strength: 3, label: 'Strong', color: 'bg-success' };
    return { strength: 4, label: 'Very strong', color: 'bg-success' };
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
      // Register patient
      await authService.registerPatient({
        username,
        email,
        password,
        password2: confirmPassword,
        first_name: firstName,
        last_name: lastName,
      });
      
      // Auto-login after successful registration
      await authService.login({ username, password });
      
      // Navigate to landing page (no patient dashboard exists yet)
      // TODO: Create patient dashboard and update this route
      navigate('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorData = err.response?.data;
      if (typeof errorData === 'object') {
        // Extract first error message from validation errors
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
    <div className="bg-background-light dark:bg-background-dark font-display text-text-main antialiased min-h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 bg-white dark:bg-[#1a1a2e] px-4 md:px-10 py-3 sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-4">
          <div className="size-6 text-primary">
            <Icon name="local_pharmacy" className="text-3xl" />
          </div>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">
            RxVerify Lite
          </h2>
        </Link>
        <div className="flex gap-4">
          <button className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-9 px-4 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-primary dark:text-blue-400 text-sm font-bold transition-colors duration-200">
            Help Center
          </button>
          <Link
            to="/join"
            className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-9 px-4 bg-primary hover:bg-blue-600 text-white text-sm font-bold transition-colors duration-200 shadow-sm"
          >
            Log In
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 w-full">
        <div className="w-full max-w-[480px] flex flex-col gap-6">
          {/* Page Heading */}
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">
              Create your Account
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-normal">
              Secure access to your pharmaceutical records.
            </p>
          </div>

          {/* Registration Card */}
          <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-lg border border-slate-200 dark:border-gray-800 p-6 md:p-8 flex flex-col gap-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Username Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-900 dark:text-slate-200 text-sm font-medium" htmlFor="username">
                Username
              </label>
              <input
                className="flex w-full rounded-lg text-slate-900 dark:text-white dark:bg-slate-900 border border-slate-300 dark:border-gray-700 focus:border-primary dark:focus:border-primary focus:ring-0 focus:shadow-[0_0_0_4px_rgba(0,85,255,0.1)] h-12 placeholder:text-slate-500 dark:placeholder:text-slate-600 px-4 text-base transition-all duration-200"
                id="username"
                placeholder="Enter your username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-900 dark:text-slate-200 text-sm font-medium" htmlFor="email">
                Email Address
              </label>
              <input
                className="flex w-full rounded-lg text-slate-900 dark:text-white dark:bg-slate-900 border border-slate-300 dark:border-gray-700 focus:border-primary dark:focus:border-primary focus:ring-0 focus:shadow-[0_0_0_4px_rgba(0,85,255,0.1)] h-12 placeholder:text-slate-500 dark:placeholder:text-slate-600 px-4 text-base transition-all duration-200"
                id="email"
                placeholder="name@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* First and Last Name Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-900 dark:text-slate-200 text-sm font-medium" htmlFor="firstName">
                  First Name
                </label>
                <input
                  className="flex w-full rounded-lg text-slate-900 dark:text-white dark:bg-slate-900 border border-slate-300 dark:border-gray-700 focus:border-primary dark:focus:border-primary focus:ring-0 focus:shadow-[0_0_0_4px_rgba(0,85,255,0.1)] h-12 placeholder:text-slate-500 dark:placeholder:text-slate-600 px-4 text-base transition-all duration-200"
                  id="firstName"
                  placeholder="John"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              {/* Last Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-900 dark:text-slate-200 text-sm font-medium" htmlFor="lastName">
                  Last Name
                </label>
                <input
                  className="flex w-full rounded-lg text-slate-900 dark:text-white dark:bg-slate-900 border border-slate-300 dark:border-gray-700 focus:border-primary dark:focus:border-primary focus:ring-0 focus:shadow-[0_0_0_4px_rgba(0,85,255,0.1)] h-12 placeholder:text-slate-500 dark:placeholder:text-slate-600 px-4 text-base transition-all duration-200"
                  id="lastName"
                  placeholder="Doe"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-900 dark:text-slate-200 text-sm font-medium" htmlFor="password">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  className="flex w-full rounded-lg text-slate-900 dark:text-white dark:bg-slate-900 border border-slate-300 dark:border-gray-700 focus:border-primary dark:focus:border-primary focus:ring-0 focus:shadow-[0_0_0_4px_rgba(0,85,255,0.1)] h-12 placeholder:text-slate-500 dark:placeholder:text-slate-600 pl-4 pr-12 text-base transition-all duration-200"
                  id="password"
                  placeholder="Create a password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="absolute right-4 text-slate-500 hover:text-primary transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-[20px]" />
                </button>
              </div>

              {/* Password Strength Meter */}
              {password.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  <div className="flex gap-1 h-1.5 w-full">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-full w-1/4 rounded-full ${
                          level <= passwordStrength.strength
                            ? passwordStrength.color
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${passwordStrength.strength >= 2 ? 'text-success' : 'text-red-500'}`}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-900 dark:text-slate-200 text-sm font-medium" htmlFor="confirm-password">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <input
                  className="flex w-full rounded-lg text-slate-900 dark:text-white dark:bg-slate-900 border border-slate-300 dark:border-gray-700 focus:border-primary dark:focus:border-primary focus:ring-0 focus:shadow-[0_0_0_4px_rgba(0,85,255,0.1)] h-12 placeholder:text-slate-500 dark:placeholder:text-slate-600 pl-4 pr-12 text-base transition-all duration-200"
                  id="confirm-password"
                  placeholder="Confirm your password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  className="absolute right-4 text-slate-500 hover:text-primary transition-colors"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon name={showConfirmPassword ? 'visibility_off' : 'visibility'} className="text-[20px]" />
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 mt-2">
              <div className="flex h-5 items-center">
                <input
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-slate-900"
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                />
              </div>
              <div className="text-sm leading-tight">
                <label className="font-normal text-slate-600 dark:text-slate-400" htmlFor="terms">
                  By creating an account, you agree to our{' '}
                  <a className="text-primary hover:text-blue-600 font-medium underline decoration-1 underline-offset-2" href="#">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a className="text-primary hover:text-blue-600 font-medium underline decoration-1 underline-offset-2" href="#">
                    Privacy Policy
                  </a>
                  .
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="flex w-full cursor-pointer items-center justify-center rounded-lg h-12 bg-primary hover:bg-blue-600 text-white text-base font-bold shadow-md transition-all duration-200 transform active:scale-[0.99] mt-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Icon name="hourglass_empty" className="mr-2 text-[20px] animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <Icon name="lock" className="mr-2 text-[20px] group-hover:animate-pulse" />
                  <span>Create Secure Account</span>
                </>
              )}
            </button>

            {/* Footer Links */}
            <div className="flex flex-col items-center gap-4 pt-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/join" className="text-primary hover:text-blue-600 font-bold transition-colors">
                  Log In
                </Link>
              </p>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-100 dark:border-slate-700">
                <Icon name="verified_user" className="text-slate-400 text-[16px]" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">HIPAA Compliant Security</span>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 dark:text-slate-500">
        <p>© 2024 RxVerify Lite. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default PatientRegistrationPage;
