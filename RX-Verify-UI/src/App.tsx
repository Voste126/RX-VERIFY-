import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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
import PharmacistOrderDashboard from './components/PharmacistOrderDashboard'
import DistributorOrderDashboard from './components/DistributorOrderDashboard'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/join" element={<JoinNetworkPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register/patient" element={<PatientRegistrationPage />} />
        <Route path="/register/pharmacist" element={<PharmacistOnboardingPage />} />
        <Route path="/register/distributor" element={<DistributorRegistrationPage />} />
        <Route path="/register/distributor/vault" element={<CryptographicVaultPage />} />
        
        {/* Distributor Routes */}
        <Route path="/distributor/dashboard" element={<DistributorDashboard />} />
        <Route path="/distributor/orders" element={<DistributorOrderDashboard />} />
        <Route path="/distributor/qr-codes/:manifestId" element={<QRCodeDisplayPage />} />
        
        {/* Pharmacist Routes */}
        <Route path="/pharmacist/dashboard" element={<PharmacistInventoryDashboard />} />
        <Route path="/pharmacist/orders" element={<PharmacistOrderDashboard />} />
      </Routes>
    </Router>
  )
}

export default App

