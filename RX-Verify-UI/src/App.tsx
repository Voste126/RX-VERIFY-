import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import JoinNetworkPage from './components/JoinNetworkPage'
import PatientRegistrationPage from './components/PatientRegistrationPage'
import PharmacistOnboardingPage from './components/PharmacistOnboardingPage'
import DistributorRegistrationPage from './components/DistributorRegistrationPage'
import CryptographicVaultPage from './components/CryptographicVaultPage'
import DistributorDashboard from './components/DistributorDashboard'
import DistributorBatchManagement from './components/DistributorBatchManagement'
import MedicineRegistrationPage from './components/MedicineRegistrationPage'
import NewLotManifest from './components/NewLotManifest'
import QRCodeDisplayPage from './components/QRCodeDisplayPage'
import PharmacistInventoryDashboard from './components/PharmacistInventoryDashboard'
import DistributorEntityRegistration from './components/DistributorEntityRegistration'
import DistributorDashboardTabs from './components/DistributorDashboardTabs'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/join" element={<JoinNetworkPage />} />
        <Route path="/register/patient" element={<PatientRegistrationPage />} />
        <Route path="/register/pharmacist" element={<PharmacistOnboardingPage />} />
        <Route path="/register/distributor" element={<DistributorRegistrationPage />} />
        <Route path="/register/distributor/vault" element={<CryptographicVaultPage />} />
        
        {/* Distributor Routes */}
        <Route path="/distributor/entity/register" element={<DistributorEntityRegistration />} />
        <Route path="/distributor/dashboard-tabs" element={<DistributorDashboardTabs />} />
        <Route path="/distributor/dashboard" element={<DistributorDashboard />} />
        <Route path="/distributor/medicines/new" element={<MedicineRegistrationPage />} />
        <Route path="/distributor/batch-management" element={<DistributorBatchManagement />} />
        <Route path="/distributor/new-manifest" element={<NewLotManifest />} />
        <Route path="/distributor/qr-codes/:manifestId" element={<QRCodeDisplayPage />} />
        
        {/* Pharmacist Routes */}
        <Route path="/pharmacist/dashboard" element={<PharmacistInventoryDashboard />} />
      </Routes>
    </Router>
  )
}

export default App
