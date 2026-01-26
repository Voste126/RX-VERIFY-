import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import JoinNetworkPage from './components/JoinNetworkPage'
import PatientRegistrationPage from './components/PatientRegistrationPage'
import PharmacistOnboardingPage from './components/PharmacistOnboardingPage'
import DistributorRegistrationPage from './components/DistributorRegistrationPage'
import CryptographicVaultPage from './components/CryptographicVaultPage'

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
      </Routes>
    </Router>
  )
}

export default App
