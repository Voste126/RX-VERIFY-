import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// We assume there's a useAuth hook or similar state management providing
// the currently authenticated user's details and roles
import { useAuth } from '../hooks/useAuth'; 

interface ProtectedRouteProps {
  allowedRoles: string[];
}

/**
 * Enhanced ProtectedRoute to prevent unauthorized access to dashboards.
 * OWASP A01: Broken Access Control & A07: Identification and Authentication Failures
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    // Show a spinner or loading state while verifying JWT/Session
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }
  
  // 1. Check if user is authenticated (valid JWT)
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  // 2. Check Role-Based Access Control (RBAC)
  if (!allowedRoles.includes(user.role)) {
    // Determine fallback route based on the user's actual role
    switch (user.role) {
      case 'Pharmacist':
        return <Navigate to="/pharmacist/dashboard" replace />;
      case 'Distributor':
        return <Navigate to="/distributor/dashboard" replace />;
      case 'Patient':
        return <Navigate to="/patient/dashboard" replace />;
      case 'Admin':
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/" replace />; // Fallback to home
    }
  }

  // User is authenticated and has the required role. Render child routes.
  return <Outlet />;
};

export default ProtectedRoute;
