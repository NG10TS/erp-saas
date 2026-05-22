import apiClient from '@/lib/api-client';
import type { User, AuditLog, PermissionsSchemaResponse, PermissionKey } from '@/types/permissions';

export const userService = {
  // Get all business users
  getUsers: async (params?: { skip?: number; limit?: number; role?: string }) => {
    const response = await apiClient.get('/business/users', { params });
    return response.data as User[];
  },

  // Get single user
  getUser: async (userId: string) => {
    const response = await apiClient.get(`/business/users/${userId}`);
    return response.data as User;
  },

  // Create new employee
  createUser: async (data: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role: 'admin' | 'manager' | 'seller' | 'viewer' | 'accountant';
  }) => {
    const response = await apiClient.post('/business/users', data);
    return response.data as User & { password: string };
  },

  // Update user role
  updateRole: async (userId: string, role: string) => {
    const response = await apiClient.patch(`/business/users/${userId}/role`, { role });
    return response.data as User;
  },

  // Toggle user active status
  toggleStatus: async (userId: string, isActive: boolean) => {
    const response = await apiClient.patch(`/business/users/${userId}/status?is_active=${isActive}`);
    return response.data as User;
  },

  // Assign custom permissions to user
  assignPermissions: async (userId: string, permissions: Record<PermissionKey, boolean>) => {
    const response = await apiClient.put(`/business/users/${userId}/permissions`, { permissions });
    return response.data as User;
  },

  // Delete user (soft delete)
  deleteUser: async (userId: string) => {
    const response = await apiClient.delete(`/business/users/${userId}`);
    return response.data as { message: string };
  },

  // Get business audit logs
  getAuditLogs: async (params?: { skip?: number; limit?: number; action?: string; entity_type?: string }) => {
    const response = await apiClient.get('/business/audit-logs', { params });
    return response.data as AuditLog[];
  },

  // Get permissions schema
  getPermissionsSchema: async () => {
    const response = await apiClient.get('/business/permissions/schema');
    return response.data as PermissionsSchemaResponse;
  },
};
