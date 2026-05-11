import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types/domain';
import { LoadingDots } from '@/components/feedback/LoadingDots';
import { MB } from '@/constants/tokens';
import { UnauthorizedState } from './UnauthorizedState';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, status } = useAuthStore();
  const location = useLocation();

  if (status === 'loading' || status === 'idle') {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: MB.bg2,
      }}>
        <LoadingDots />
      </div>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <UnauthorizedState />;
  }

  return <>{children}</>;
};
