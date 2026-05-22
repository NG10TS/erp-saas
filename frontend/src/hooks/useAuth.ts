import { useAuthStore } from '@/store/slices/authSlice';

export const useAuth = () => {
  const {
    user,
    business,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    changePassword,
    updateProfile,
  } = useAuthStore();

  const hasRole = (roles: string | string[]) => {
    if (!user) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role);
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;

    const rolePermissions: Record<string, string[]> = {
      owner: ['*'],
      admin: ['products.*', 'sales.*', 'customers.*', 'invoices.*', 'settings.view'],
      manager: ['products.view', 'sales.*', 'customers.view', 'invoices.view'],
      seller: ['sales.create', 'sales.view', 'products.view', 'customers.view'],
      viewer: ['sales.view', 'products.view', 'invoices.view'],
      accountant: ['invoices.*', 'sales.view', 'reports.view'],
    };

    const userPermissions = rolePermissions[user.role] || [];

    if (userPermissions.includes('*')) return true;

    return userPermissions.some(
      (p) => permission === p || permission.startsWith(p.replace('.*', ''))
    );
  };

  return {
    user,
    business,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    changePassword,
    updateProfile,
    hasRole,
    hasPermission,
  };
};

export const useUpdateProfile = () => {
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const isLoading = useAuthStore((state) => state.isLoading);

  return {
    mutateAsync: updateProfile,
    isPending: isLoading,
  };
};
