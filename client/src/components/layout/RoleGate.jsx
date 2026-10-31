import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader } from '../common/Loader';

export const RoleGate = ({ allowedRoles = [] }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader message="Verifying session permissions..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect to their respective default home
    if (role === 'Customer') return <Navigate to="/portal/overview" replace />;
    if (role === 'Staff') return <Navigate to="/staff/overview" replace />;
    return <Navigate to="/admin/overview" replace />;
  }

  return <Outlet />;
};
