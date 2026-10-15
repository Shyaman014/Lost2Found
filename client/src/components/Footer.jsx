import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 py-12 sm:py-16 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-100">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3.5">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img src="/logo.jpg" alt="Lost2Found" className="w-8 h-8 rounded-xl object-cover shadow-xs border border-slate-200 group-hover:scale-105 transition-transform" />
              <div className="flex flex-col">
                <span className="text-lg font-black text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                  Lost<span className="text-indigo-600">2</span>Found
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Campus Intelligence
                </span>
              </div>
            </Link>
            <p className="text-slate-500 text-xs sm:text-sm max-w-sm leading-relaxed">
              The intelligent lost and found network for colleges. Connect students, locate misplaced items with Google Gemini AI, and coordinate safe handoffs.
            </p>

            {/* System Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Campus Systems Operational</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3.5">
              Explore
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 font-medium">
              <li>
                <Link to="/items" className="hover:text-indigo-600 transition-colors">
                  Browse Catalog
                </Link>
              </li>
              <li>
                <Link to="/report-lost" className="hover:text-rose-600 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Report Lost Item
                </Link>
              </li>
              <li>
                <Link to="/report-found" className="hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Report Found Item
                </Link>
              </li>
              <li>
                <Link to="/messages" className="hover:text-indigo-600 transition-colors">
                  Messages &amp; Chats
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Standards */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3.5">
              Security &amp; Tech
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-500 font-medium">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>Google Gemini 1.5 Text Similarity</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>HttpOnly Secure Cookies</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>Real-Time WebSockets</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>Verified Campus Network</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} Lost2Found Platform. Built for University Campus Communities.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-600 cursor-pointer transition-colors">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-600 cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
