import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-indigo-600 tracking-tight">Lost2Found</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">Home</Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/items" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">Items</Link>
                <Link to="/report-lost" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">Report Lost</Link>
                <Link to="/report-found" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">Report Found</Link>
                <Link to="/messages" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">Messages</Link>
                <Link to="/my-items" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">My Items</Link>
                <Link to="/my-claims" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">My Claims</Link>
                <Link to="/profile" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">Profile</Link>
                {currentUser?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-md text-sm font-semibold transition flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Admin Panel
                  </Link>
                )}
                <button onClick={handleLogout} className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-md text-sm font-medium transition">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">Login</Link>
                <Link to="/register" className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium transition">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
