import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { authService } from '../services/auth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if redirected from registration
  const isFromRegistration = location.state?.fromRegistration === true;
  const registrationRole = location.state?.role as string | undefined;

  const getRoleDashboardPath = (role: string): string => {
    switch (role) {
      case 'Distributor':
        return '/distributor/dashboard';
      case 'Pharmacist':
        return '/pharmacist/dashboard';
      case 'Patient':
        return '/patient/dashboard'; // You may need to create this route
      case 'Admin':
        return '/admin/dashboard'; // You may need to create this route
      default:
        return '/';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      // Login and get JWT token
      const response = await authService.login({ username, password });
      
      // Get the appropriate dashboard path based on user role
      const dashboardPath = getRoleDashboardPath(response.user.role);
      
      // Navigate to the appropriate dashboard
      navigate(dashboardPath);
    } catch (err: any) {
      const errorData = err.response?.data;
      if (typeof errorData === 'object') {
        // Extract first error message
        const firstError = Object.values(errorData)[0];
        setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
      } else {
        setError(errorData || 'Login failed. Please check your credentials and try again.');
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
            <p className="text-xs text-gray-400">Secure Authentication</p>
          </div>
        </Link>
      </header>

      {/* Main Login Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[480px]">
          {/* Title */}
          <div className="mb-8 text-center">
            {isFromRegistration && (
              <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 text-green-300">
                  <Icon name="check_circle" />
                  <p className="font-semibold">Registration Successful!</p>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  {registrationRole 
                    ? `Your ${registrationRole} account has been created. Please log in to continue.`
                    : 'Please log in to access your dashboard.'
                  }
                </p>
              </div>
            )}
            <h1 className="text-4xl font-black mb-3">Welcome Back</h1>
            <p className="text-gray-400 text-lg">
              Sign in to access the RxVerify Lite platform
            </p>
          </div>

          {/* Login Form */}
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Username */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Username</label>
              <div className="relative">
                <input
                  className="w-full bg-[#151923] border border-gray-700 focus:border-primary rounded-lg px-4 pr-10 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter your username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <Icon name="person" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <div className="relative">
                <input
                  className="w-full bg-[#151923] border border-gray-700 focus:border-primary rounded-lg px-4 pr-10 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Icon name="lock" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
              </div>
            </div>

            {/* JWT Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
              <Icon name="key" className="text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-300 font-medium">Secure JWT Authentication</p>
                <p className="text-gray-400 mt-1">Your session will be protected with industry-standard JWT tokens.</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 rounded-lg bg-primary text-white font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Icon name="hourglass_empty" className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Icon name="login" />
                    Sign In
                  </>
                )}
              </button>
              
              <div className="text-center text-sm text-gray-400">
                Don't have an account?{' '}
                <Link to="/join" className="text-primary hover:text-blue-400 font-semibold">
                  Register here
                </Link>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
