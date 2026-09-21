import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import { ShieldCheck } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 bg-health-50 border border-health-100 rounded-2xl flex items-center justify-center text-health-600 mb-4 animate-bounce">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="w-48 bg-slate-200 h-1.5 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-health-600 animate-pulse rounded-full" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Verifying security session...</p>
        <p className="text-xs text-slate-400 mt-1">Checking cryptographic credentials</p>
      </div>
    );
  }

  // If not authenticated, redirect to appropriate login page
  if (!isAuthenticated) {
    if (allowedRoles?.includes('ADMIN')) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is not permitted, redirect to 403 or their home
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};
