import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import JoinNetworkPage from './components/JoinNetworkPage'
import PatientRegistrationPage from './components/PatientRegistrationPage'
import PharmacistOnboardingPage from './components/PharmacistOnboardingPage'
import DistributorRegistrationPage from './components/DistributorRegistrationPage'
import CryptographicVaultPage from './components/CryptographicVaultPage'
import DistributorBatchManagement from './components/DistributorBatchManagement'
import NewLotManifest from './components/NewLotManifest'
import PharmacistInventoryDashboard from './components/PharmacistInventoryDashboard'

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
        <Route path="/distributor/batch-management" element={<DistributorBatchManagement />} />
        <Route path="/distributor/new-manifest" element={<NewLotManifest />} />
        <Route path="/pharmacist/dashboard" element={<PharmacistInventoryDashboard />} />
      </Routes>
    </Router>
  )
}

export default App
