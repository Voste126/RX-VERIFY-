import React from 'react';
import Icon from './Icon';

const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-dark border-t border-white/5 pt-16 pb-8">
      <div className="layout-container max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="size-6 text-primary">
                <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"></path>
                </svg>
              </div>
              <span className="text-white font-bold text-lg">RxVerify Lite</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Securing the pharmaceutical supply chain one block at a time.
            </p>
            <div className="flex gap-4">
              <a className="text-gray-400 hover:text-white transition-colors" href="#">
                <Icon name="public" />
              </a>
              <a className="text-gray-400 hover:text-white transition-colors" href="#">
                <Icon name="chat" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Platform</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a className="hover:text-primary transition-colors" href="#technology">Technology</a></li>
              <li><a className="hover:text-primary transition-colors" href="#trust">Trust Score</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Integrations</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Mobile App</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Developers</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a className="hover:text-primary transition-colors" href="#">Documentation</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">API Reference</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Status</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">GitHub</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a className="hover:text-primary transition-colors" href="#">About</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Partners</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">© 2023 RxVerify Inc. All rights reserved.</p>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="size-2 bg-success rounded-full"></span>
            <span>All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
