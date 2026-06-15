import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './components/LandingPage'
import JoinNetworkPage from './components/JoinNetworkPage'
import LoginPage from './components/LoginPage'
import PatientRegistrationPage from './components/PatientRegistrationPage'
import PharmacistOnboardingPage from './components/PharmacistOnboardingPage'
import DistributorRegistrationPage from './components/DistributorRegistrationPage'
import CryptographicVaultPage from './components/CryptographicVaultPage'
import QRCodeDisplayPage from './components/QRCodeDisplayPage'
import PharmacistInventoryDashboard from './components/PharmacistInventoryDashboard'
import DistributorDashboard from './components/DistributorDashboard'
import DistributorOrderDashboard from './components/DistributorOrderDashboard'
import PatientDashboard from './components/PatientDashboard'
import AdminDashboard from './components/AdminDashboard'
import PatientScanResult from './components/PatientScanResult'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/join" element={<JoinNetworkPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register/patient" element={<PatientRegistrationPage />} />
        <Route path="/register/pharmacist" element={<PharmacistOnboardingPage />} />
        <Route path="/register/distributor" element={<DistributorRegistrationPage />} />
        
        {/* Protected Distributor Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Distributor']} />}>
          <Route path="/register/distributor/vault" element={<CryptographicVaultPage />} />
          <Route path="/distributor/dashboard" element={<DistributorDashboard />} />
          <Route path="/distributor/orders" element={<DistributorOrderDashboard />} />
          <Route path="/distributor/qr-codes/:manifestId" element={<QRCodeDisplayPage />} />
        </Route>
        
        {/* Protected Pharmacist Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Pharmacist']} />}>
          <Route path="/pharmacist/dashboard" element={<PharmacistInventoryDashboard />} />
        </Route>
        
        {/* Protected Patient Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Patient']} />}>
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/scan/:uuid" element={<PatientScanResult />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
