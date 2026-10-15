import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-100">
          
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.jpg" alt="Lost2Found" className="w-7 h-7 rounded-lg object-cover shadow-xs border border-slate-200" />
              <span className="text-lg font-bold text-slate-900 tracking-tight">
                Lost<span className="text-indigo-600">2</span>Found
              </span>
            </Link>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
              The modern, AI-powered campus lost and found platform. Reconnect students with misplaced possessions rapidly, transparently, and safely.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/items" className="hover:text-indigo-600 transition-colors">
                  Browse Items
                </Link>
              </li>
              <li>
                <Link to="/report-lost" className="hover:text-rose-600 transition-colors">
                  Report Lost
                </Link>
              </li>
              <li>
                <Link to="/report-found" className="hover:text-emerald-600 transition-colors">
                  Report Found
                </Link>
              </li>
              <li>
                <Link to="/messages" className="hover:text-indigo-600 transition-colors">
                  Messages
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & System */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Gemini AI Smart Matching</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <span>Real-Time Notifications</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span>Verified Campus Only</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} Lost2Found Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Secure College Campus Network</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
