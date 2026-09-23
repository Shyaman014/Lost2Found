import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Lost2Found. All rights reserved.
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Smart Lost & Found Platform for Colleges
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
