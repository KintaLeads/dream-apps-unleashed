
import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Modified to allow all access without authentication check
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  return <>{children}</>;
};

export default ProtectedRoute;
