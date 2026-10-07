import React, { useContext, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    navigate('/');
  };

  const navLink = ({ isActive }) =>
    `relative text-sm font-medium px-1 py-1 transition-colors duration-200 group ${
      isActive ? 'text-white' : 'text-indigo-200 hover:text-white'
    }`;

  const mobileLink = ({ isActive }) =>
    `block text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${
      isActive ? 'bg-white/20 text-white' : 'text-indigo-100 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-8">

          {/* ── Logo ── */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">Lost2Found</span>
          </Link>

          {/* ── Desktop links — fills the middle space ── */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-2">
            <NavLink to="/" end className={navLink}>
              {({ isActive }) => (
                <>
                  Home
                  <span className={`absolute -bottom-0.5 left-0 h-0.5 bg-white rounded-full transition-all duration-200 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                </>
              )}
            </NavLink>

            {isAuthenticated && (
              <>
                <span className="text-indigo-400 select-none">·</span>
                <NavLink to="/items" className={navLink}>
                  {({ isActive }) => (
                    <>
                      Items
                      <span className={`absolute -bottom-0.5 left-0 h-0.5 bg-white rounded-full transition-all duration-200 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                    </>
                  )}
                </NavLink>

                <span className="text-indigo-400 select-none">·</span>
                <NavLink to="/report-lost" className={navLink}>
                  {({ isActive }) => (
                    <>
                      Report Lost
                      <span className={`absolute -bottom-0.5 left-0 h-0.5 bg-white rounded-full transition-all duration-200 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                    </>
                  )}
                </NavLink>

                <span className="text-indigo-400 select-none">·</span>
                <NavLink to="/report-found" className={navLink}>
                  {({ isActive }) => (
                    <>
                      Report Found
                      <span className={`absolute -bottom-0.5 left-0 h-0.5 bg-white rounded-full transition-all duration-200 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                    </>
                  )}
                </NavLink>

                <span className="text-indigo-400 select-none">·</span>
                <NavLink to="/messages" className={navLink}>
                  {({ isActive }) => (
                    <>
                      Messages
                      <span className={`absolute -bottom-0.5 left-0 h-0.5 bg-white rounded-full transition-all duration-200 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                    </>
                  )}
                </NavLink>

                {currentUser?.role === 'admin' && (
                  <>
                    <span className="text-indigo-400 select-none">·</span>
                    <NavLink to="/admin" className={navLink}>
                      {({ isActive }) => (
                        <>
                          Admin
                          <span className={`absolute -bottom-0.5 left-0 h-0.5 bg-white rounded-full transition-all duration-200 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                        </>
                      )}
                    </NavLink>
                  </>
                )}
              </>
            )}
          </div>

          {/* ── Right side ── */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {isAuthenticated ? (
              <>
                {/* Profile pill */}
                <NavLink
                  to="/profile"
                  className="flex items-center gap-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white px-3 py-1.5 rounded-full transition-all duration-200"
                >
                  {currentUser?.profileImage ? (
                    <img
                      src={currentUser.profileImage}
                      alt={currentUser.name}
                      className="w-6 h-6 rounded-full object-cover border border-white/40"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-white font-bold text-xs uppercase">
                      {currentUser?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-semibold">{currentUser?.name?.split(' ')[0]}</span>
                </NavLink>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-medium text-indigo-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full border border-white/10 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="text-sm font-medium text-indigo-100 hover:text-white transition-colors"
                >
                  Login
                </NavLink>
                <Link
                  to="/register"
                  className="bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-200 shadow-sm"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            className="md:hidden ml-auto p-2 rounded-lg text-indigo-100 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-indigo-700/95 backdrop-blur-sm px-4 py-3 space-y-1">
          <NavLink to="/" end className={mobileLink} onClick={() => setMobileOpen(false)}>Home</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/items"        className={mobileLink} onClick={() => setMobileOpen(false)}>Items</NavLink>
              <NavLink to="/report-lost"  className={mobileLink} onClick={() => setMobileOpen(false)}>Report Lost</NavLink>
              <NavLink to="/report-found" className={mobileLink} onClick={() => setMobileOpen(false)}>Report Found</NavLink>
              <NavLink to="/messages"     className={mobileLink} onClick={() => setMobileOpen(false)}>Messages</NavLink>
              <NavLink to="/my-items"     className={mobileLink} onClick={() => setMobileOpen(false)}>My Items</NavLink>
              <NavLink to="/my-claims"    className={mobileLink} onClick={() => setMobileOpen(false)}>My Claims</NavLink>
              <NavLink to="/profile"      className={mobileLink} onClick={() => setMobileOpen(false)}>Profile</NavLink>
              {currentUser?.role === 'admin' && (
                <NavLink to="/admin" className={mobileLink} onClick={() => setMobileOpen(false)}>Admin Dashboard</NavLink>
              )}
              <div className="pt-2 border-t border-white/10">
                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-300 hover:text-red-100 hover:bg-white/10 rounded-lg transition-colors">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/login"    className={mobileLink} onClick={() => setMobileOpen(false)}>Login</NavLink>
              <NavLink to="/register" className={mobileLink} onClick={() => setMobileOpen(false)}>Register</NavLink>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
