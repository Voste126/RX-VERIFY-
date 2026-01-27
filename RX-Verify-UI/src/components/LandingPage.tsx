import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import AuthModal from './AuthModal';
import HeroSection from './HeroSection';
import RolesSection from './RolesSection';
import TechnologySection from './TechnologySection';
import TrustScoreSection from './TrustScoreSection';
import Footer from './Footer';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleLoginClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleAuthenticate = () => {
    // Redirect to batch management dashboard after successful authentication
    navigate('/distributor/batch-management');
  };

  return (
    <div className="relative flex min-h-screen flex-col font-display">
      <Header onLoginClick={handleLoginClick} />
      <main className="flex-grow">
        <HeroSection />
        <RolesSection />
        <TechnologySection />
        <TrustScoreSection />
      </main>
      <Footer />
      <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseModal} onAuthenticate={handleAuthenticate} />
    </div>
  );
};

export default LandingPage;
