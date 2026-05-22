import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/api/userService';
import type { UserRole } from '@/types/auth';
import type { PermissionKey } from '@/types/permissions';

type PermissionMap = {
  navigation: string[];
  routes: string[];
};

const ROLE_ACCESS: Record<UserRole, PermissionMap> = {
  owner: {
    navigation: ['dashboard', 'sales', 'products', 'customers', 'invoices', 'whatsapp', 'settings', 'categories', 'employees'],
    routes: ['dashboard', 'sales', 'products', 'customers', 'invoices', 'whatsapp', 'settings', 'categories', 'employees'],
  },
  admin: {
    navigation: ['dashboard', 'sales', 'products', 'customers', 'invoices', 'whatsapp', 'settings', 'categories', 'employees'],
    routes: ['dashboard', 'sales', 'products', 'customers', 'invoices', 'whatsapp', 'settings', 'categories', 'employees'],
  },
  manager: {
    navigation: ['dashboard', 'sales', 'products', 'customers', 'invoices', 'whatsapp', 'categories'],
    routes: ['dashboard', 'sales', 'products', 'customers', 'invoices', 'whatsapp', 'categories'],
  },
  seller: {
    navigation: ['dashboard', 'sales', 'products', 'customers', 'whatsapp'],
    routes: ['dashboard', 'sales', 'products', 'customers', 'whatsapp'],
  },
  viewer: {
    navigation: ['dashboard', 'sales', 'products', 'invoices'],
    routes: ['dashboard', 'sales', 'products', 'invoices'],
  },
  accountant: {
    navigation: ['dashboard', 'sales', 'invoices'],
    routes: ['dashboard', 'sales', 'invoices'],
  },
  SUPERADMIN: {
    navigation: ['dashboard', 'businesses', 'metrics', 'audit-logs', 'super-admins'],
    routes: ['dashboard', 'businesses', 'metrics', 'audit-logs', 'super-admins'],
  },
};

export const usePermissions = () => {
  const { user, hasRole } = useAuth();

  // Fetch schema para permisos granulares
  const { data: schema } = useQuery({
    queryKey: ['permissionsSchema'],
    queryFn: () => userService.getPermissionsSchema().catch(() => ({})),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const access = user
    ? ROLE_ACCESS[user.role] ?? { navigation: [], routes: [] }
    : { navigation: [], routes: [] };

  const canAccessNavigation = (key: string) => access.navigation.includes(key);
  const canAccessRoute = (key: string) => access.routes.includes(key);
  const canAccessRoles = (roles: UserRole[]) => !!user && roles.includes(user.role);

  // Verificar permisos específicos
  const hasPermission = (permission: PermissionKey): boolean => {
    // Los super admins tienen todos los permisos
    if (user?.role === 'SUPERADMIN') return true;

    // Los owners tienen todos los permisos de su negocio
    if (user?.role === 'owner') return true;

    // Para otros roles, verificar según esquema (en backend se valida)
    return true;
  };

  return {
    user,
    hasRole,
    canAccessNavigation,
    canAccessRoute,
    canAccessRoles,
    hasPermission,
    permissionSchema: schema || {},
  };
};
