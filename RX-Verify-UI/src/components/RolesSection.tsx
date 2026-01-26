import React from 'react';
import Icon from './Icon';

const RolesSection: React.FC = () => {
  return (
    <section className="py-20 bg-[#0f1623]" id="roles">
      <div className="layout-container max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Empowering Every Role</h2>
          <p className="text-gray-400">Tailored interfaces for every stakeholder in the pharmaceutical ecosystem ensuring end-to-end safety.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Patient Card */}
          <div className="group relative p-8 glass-panel rounded-2xl hover:bg-white/5 transition-all duration-300 hover:-translate-y-2">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="size-14 rounded-xl bg-primary/20 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
              <Icon name="shield" className="text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Patients</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Instant Authenticity Checks. Verify your medication in seconds using our consumer mobile app.
            </p>
          </div>
          {/* Pharmacist Card */}
          <div className="group relative p-8 glass-panel rounded-2xl hover:bg-white/5 transition-all duration-300 hover:-translate-y-2">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-success/0 via-success to-success/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="size-14 rounded-xl bg-success/20 flex items-center justify-center text-success mb-6 group-hover:bg-success group-hover:text-white transition-colors">
              <Icon name="medical_services" className="text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Pharmacists</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Batch Validation Tools. Ensure inventory integrity before dispensing with bulk scanning capabilities.
            </p>
          </div>
          {/* Distributor Card */}
          <div className="group relative p-8 glass-panel rounded-2xl hover:bg-white/5 transition-all duration-300 hover:-translate-y-2">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-warning/0 via-warning to-warning/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="size-14 rounded-xl bg-warning/20 flex items-center justify-center text-warning mb-6 group-hover:bg-warning group-hover:text-black transition-colors">
              <Icon name="local_shipping" className="text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Distributors</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Chain of Custody Tracking. Real-time logistics monitoring and automated compliance reporting.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RolesSection;
