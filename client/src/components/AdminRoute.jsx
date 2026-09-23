import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * AdminRoute — protects all /admin/* pages.
 * Not logged in  → /login
 * Student        → /unauthorized
 * Admin          → renders child route
 *
 * NOTE: This is only a UX convenience. Backend independently enforces admin role on every API call.
 */
const AdminRoute = () => {
  const { isAuthenticated, currentUser, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser?.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
