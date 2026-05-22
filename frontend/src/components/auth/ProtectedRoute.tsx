import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { Loading } from '@/components/common/Loading/Loading';
import { useAuthStore } from '@/store/slices/authSlice';
import { usePermissions } from '@/hooks/usePermissions';
import type { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  permissionKey?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  permissionKey,
}) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { canAccessRoles, canAccessRoute } = usePermissions();

  if (isLoading) {
    return <Loading fullScreen text="Cargando..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const roleAllowed = !allowedRoles || canAccessRoles(allowedRoles);
  const permissionAllowed = !permissionKey || canAccessRoute(permissionKey);

  if (!roleAllowed || !permissionAllowed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <ShieldExclamationIcon className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Acceso restringido</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            No tienes permiso para ver esta página con tu rol actual.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
