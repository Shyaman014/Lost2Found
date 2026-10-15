import React, { useContext, useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import socketService from '../services/socketService';

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // State for popovers & menus
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Refs for click outside handling
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    setNotifOpen(false);
    setProfileOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setProfileOpen(false);
        setMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Fetch notifications and setup real-time socket
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        setLoadingNotifs(true);
        const res = await notificationService.getNotifications(false, 1, 10);
        if (isMounted && res?.success && res.data) {
          setNotifications(res.data.notifications || []);
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        if (isMounted) setLoadingNotifs(false);
      }
    };

    fetchNotifications();

    // Setup socket connection and listener
    socketService.connect();

    const handleNewNotification = (newNotif) => {
      if (!isMounted) return;
      setNotifications((prev) => [newNotif, ...prev.slice(0, 9)]);
      setUnreadCount((c) => c + 1);
    };

    socketService.onNotification(handleNewNotification);

    return () => {
      isMounted = false;
      socketService.offNotification(handleNewNotification);
    };
  }, [isAuthenticated]);

  const handleLogout = async () => {
    setProfileOpen(false);
    setMobileOpen(false);
    await logout();
    navigate('/');
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif._id);
    }
    setNotifOpen(false);

    if (notif.relatedItem) {
      navigate(`/items/${notif.relatedItem}`);
    } else if (notif.relatedConversation) {
      navigate(`/messages/${notif.relatedConversation}`);
    } else if (notif.relatedClaim) {
      navigate('/my-claims');
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const navLinkClasses = ({ isActive }) =>
    `inline-flex items-center text-xs lg:text-sm font-medium px-2 lg:px-3 py-1.5 rounded-lg transition-all duration-150 ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
    }`;

  const reportLostClasses = ({ isActive }) =>
    `inline-flex items-center gap-1.5 text-xs lg:text-sm font-medium px-2 lg:px-3 py-1.5 rounded-lg transition-all duration-150 ${
      isActive
        ? 'bg-rose-50 text-rose-700 font-semibold border border-rose-200/60 shadow-xs'
        : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/60'
    }`;

  const reportFoundClasses = ({ isActive }) =>
    `inline-flex items-center gap-1.5 text-xs lg:text-sm font-medium px-2 lg:px-3 py-1.5 rounded-lg transition-all duration-150 ${
      isActive
        ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60 shadow-xs'
        : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/60'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">

          {/* ── Brand Logo ── */}
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
            <img
              src="/logo.jpg"
              alt="Lost2Found"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover shadow-xs border border-slate-200 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                Lost<span className="text-indigo-600">2</span>Found
              </span>
              <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 tracking-wider uppercase">
                Campus SaaS
              </span>
            </div>
          </Link>

          {/* ── Desktop Main Navigation ── */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {/* 1. Home */}
            <NavLink to="/" end className={navLinkClasses}>
              Home
            </NavLink>

            {/* 2. Items */}
            <NavLink to="/items" className={navLinkClasses}>
              Items
            </NavLink>

            {/* 3. Separate Report Lost Item */}
            <NavLink to="/report-lost" className={reportLostClasses}>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span className="whitespace-nowrap">Report Lost</span>
            </NavLink>

            {/* 4. Separate Report Found Item */}
            <NavLink to="/report-found" className={reportFoundClasses}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="whitespace-nowrap">Report Found</span>
            </NavLink>

            {/* 5. Messages (Only shown when authenticated) */}
            {isAuthenticated && (
              <NavLink to="/messages" className={navLinkClasses}>
                Messages
              </NavLink>
            )}
          </nav>

          {/* ── Right Navigation & Profile Area ── */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {isAuthenticated ? (
              <>
                {/* 🔔 Notifications Popover */}
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifOpen(!notifOpen);
                      setProfileOpen(false);
                    }}
                    className={`relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer ${
                      notifOpen ? 'bg-slate-100 text-slate-900' : ''
                    }`}
                    aria-label="View notifications"
                    aria-expanded={notifOpen}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>

                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Panel */}
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-100 ring-1 ring-slate-900/5 anim-scale-in z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllAsRead}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Notification list */}
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {loadingNotifs && notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm text-slate-400">
                            Loading notifications...
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <p className="text-sm font-semibold text-slate-700">All caught up!</p>
                            <p className="text-xs text-slate-400 mt-0.5">No notifications right now.</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n._id}
                              onClick={() => handleNotificationClick(n)}
                              className={`p-3.5 transition-colors cursor-pointer flex gap-3 text-left ${
                                n.isRead ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/40 hover:bg-indigo-50/70'
                              }`}
                            >
                              <div className="w-2 h-2 rounded-full mt-1.5 shrink-0">
                                {!n.isRead && <span className="block w-2 h-2 rounded-full bg-indigo-600" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <p className="text-xs font-bold text-slate-900 truncate">
                                    {n.title || 'Notification'}
                                  </p>
                                  <span className="text-[11px] text-slate-400 shrink-0">
                                    {formatTimeAgo(n.createdAt)}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                  {n.message}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-center">
                        <Link
                          to="/my-items"
                          onClick={() => setNotifOpen(false)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          Manage my items &amp; claims →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Menu */}
                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(!profileOpen);
                      setNotifOpen(false);
                    }}
                    className={`flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer ${
                      profileOpen ? 'ring-2 ring-indigo-500/20 border-indigo-400 bg-slate-50' : ''
                    }`}
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                  >
                    {currentUser?.profileImage ? (
                      <img
                        src={currentUser.profileImage}
                        alt={currentUser.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs">
                        {currentUser?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className="hidden sm:inline text-xs font-semibold text-slate-700 max-w-[90px] truncate">
                      {currentUser?.name?.split(' ')[0] || 'Account'}
                    </span>
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Profile Dropdown */}
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl bg-white shadow-xl border border-slate-100 ring-1 ring-slate-900/5 anim-scale-in z-50 p-1.5">
                      {/* User Info Header */}
                      <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {currentUser?.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {currentUser?.email}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          {currentUser?.role === 'admin' ? (
                            <span className="bg-purple-100 text-purple-700 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                              Administrator
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                              Student
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Menu Links */}
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </Link>

                      <Link
                        to="/my-items"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        My Items
                      </Link>

                      <Link
                        to="/my-claims"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        My Claims
                      </Link>

                      {/* Admin Dashboard: ONLY if admin */}
                      {currentUser?.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-purple-700 bg-purple-50/60 hover:bg-purple-100/70 transition-colors mt-0.5"
                        >
                          <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Admin Dashboard
                        </Link>
                      )}

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-xs sm:text-sm py-2 px-3.5 shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* ── Mobile Menu Hamburger ── */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
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
      </div>

      {/* ── Mobile Menu Drawer ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 space-y-1.5 anim-fade-down shadow-lg">
          <NavLink
            to="/"
            end
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg text-sm font-medium ${
                isActive ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/items"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg text-sm font-medium ${
                isActive ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`
            }
          >
            Items
          </NavLink>

          {/* Separate Direct Report Links in Mobile */}
          <NavLink
            to="/report-lost"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-rose-50 text-rose-700 font-bold' : 'text-rose-600 hover:bg-rose-50'
              }`
            }
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Report Lost Item
          </NavLink>

          <NavLink
            to="/report-found"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-emerald-600 hover:bg-emerald-50'
              }`
            }
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Report Found Item
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink
                to="/messages"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                Messages
              </NavLink>

              <div className="pt-2 border-t border-slate-100 space-y-1">
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Account
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Profile
                </Link>
                <Link
                  to="/my-items"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  My Items
                </Link>
                <Link
                  to="/my-claims"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  My Claims
                </Link>

                {currentUser?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100"
                  >
                    Admin Dashboard
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="btn-secondary text-center text-sm"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="btn-primary text-center text-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
