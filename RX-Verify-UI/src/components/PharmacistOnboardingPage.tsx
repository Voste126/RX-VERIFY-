import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';

const PharmacistOnboardingPage: React.FC = () => {
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
                <p className="text-sm font-semibold text-primary uppercase tracking-wider">Step 2 of 2</p>
                <h2 className="text-lg font-bold mt-1">Professional Verification</h2>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500 dark:text-gray-400">Next: Review & Submit</p>
              </div>
            </div>
            {/* Progress Bar Visual */}
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
              <div className="h-full bg-success w-1/2"></div>
              <div className="h-full bg-primary w-1/2 animate-pulse"></div>
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
                  Please provide your current pharmacy details and state license number for real-time verification.
                </p>
              </div>

              {/* Form */}
              <form className="flex flex-col gap-8" onSubmit={(e) => e.preventDefault()}>
                {/* Pharmacy Information Section */}
                <div className="flex flex-col gap-5">
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
                      required
                      type="text"
                    />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                        NPI Number (Optional)
                      </span>
                      <input
                        className="w-full border-b-2 border-gray-200 dark:border-gray-700 bg-transparent pb-3 focus:border-primary outline-none transition-colors"
                        placeholder="10-digit NPI"
                        type="text"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                        Pharmacy Phone
                      </span>
                      <input
                        className="w-full border-b-2 border-gray-200 dark:border-gray-700 bg-transparent pb-3 focus:border-primary outline-none transition-colors"
                        placeholder="(555) 000-0000"
                        type="tel"
                      />
                    </label>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-100 dark:bg-gray-700 w-full"></div>

                {/* License Information Section */}
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="badge" className="text-gray-400 text-xl" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                      License Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                        State of Licensure
                      </span>
                      <div className="relative">
                        <select
                          className="w-full border-b-2 border-gray-200 dark:border-gray-700 bg-transparent pb-3 focus:border-primary outline-none transition-colors appearance-none pr-8"
                          required
                        >
                          <option value="">Select State</option>
                          <option value="CA">California</option>
                          <option value="NY">New York</option>
                          <option value="TX">Texas</option>
                          <option value="FL">Florida</option>
                          <option value="IL">Illinois</option>
                        </select>
                        <div className="pointer-events-none absolute right-0 bottom-3 text-gray-500">
                          <Icon name="expand_more" />
                        </div>
                      </div>
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                        Pharmacist License Number
                      </span>
                      <input
                        className="w-full border-b-2 border-gray-200 dark:border-gray-700 bg-transparent pb-3 focus:border-primary outline-none transition-colors font-mono tracking-wide"
                        placeholder="RPH-12345678"
                        required
                        type="text"
                      />
                      <p className="text-xs text-gray-400 mt-1">Enter exactly as it appears on your license card.</p>
                    </label>
                  </div>

                  {/* Upload */}
                  <div className="mt-2 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Icon name="upload_file" className="text-gray-400 text-3xl mb-2" />
                    <p className="text-sm font-medium text-primary">Upload License Copy (Optional)</p>
                    <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG, PDF up to 5MB</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                  <Link
                    to="/join"
                    className="flex-1 px-6 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 group"
                  >
                    <Icon name="arrow_back" className="text-lg group-hover:-translate-x-1 transition-transform" />
                    Back
                  </Link>
                  <button className="flex-[2] px-6 py-3 rounded-lg bg-primary text-white font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2">
                    <span>Submit for Verification</span>
                    <Icon name="check_circle" className="text-lg" />
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

          {/* Step 1 Summary */}
          <div className="flex justify-center">
            <button className="text-sm text-gray-500 hover:text-primary flex items-center gap-1 transition-colors">
              <Icon name="edit" className="text-base" />
              Edit Step 1: Account Details
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PharmacistOnboardingPage;
