import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import HeroSection from './HeroSection';
import RolesSection from './RolesSection';
import TechnologySection from './TechnologySection';
import TrustScoreSection from './TrustScoreSection';
import Footer from './Footer';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
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
    </div>
  );
};

export default LandingPage;
