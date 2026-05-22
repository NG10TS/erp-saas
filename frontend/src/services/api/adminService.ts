import apiClient from '@/lib/api-client';
import type { Business, User, AuditLog, GlobalMetrics, ChangeOwnerRequest, SetBusinessStatusRequest, AssignSubscriptionRequest } from '@/types/permissions';

export const adminService = {
  // Get all businesses
  getBusinesses: async (params?: { skip?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get('/admin/businesses', { params });
    return response.data as Business[];
  },

  // Get business detail
  getBusinessDetail: async (businessId: string) => {
    const response = await apiClient.get(`/admin/businesses/${businessId}`);
    return response.data as Business;
  },

  // Get business users
  getBusinessUsers: async (businessId: string, params?: { skip?: number; limit?: number }) => {
    const response = await apiClient.get(`/admin/businesses/${businessId}/users`, { params });
    return response.data as User[];
  },

  // Change business owner
  changeOwner: async (businessId: string, data: ChangeOwnerRequest) => {
    const response = await apiClient.patch(`/admin/businesses/${businessId}/change-owner?new_owner_id=${data.new_owner_id}`);
    return response.data as Business;
  },

  // Set business status (suspend/activate)
  setBusinessStatus: async (businessId: string, data: SetBusinessStatusRequest) => {
    const params = new URLSearchParams();
    params.append('is_active', String(data.is_active));
    if (data.reason) params.append('reason', data.reason);
    
    const response = await apiClient.patch(
      `/admin/businesses/${businessId}/status?${params.toString()}`
    );
    return response.data as Business;
  },

  // Assign subscription plan
  assignSubscription: async (businessId: string, data: AssignSubscriptionRequest) => {
    const response = await apiClient.put(`/admin/businesses/${businessId}/subscription`, data);
    return response.data as { message: string };
  },

  // Get global metrics
  getMetrics: async () => {
    const response = await apiClient.get('/admin/metrics');
    return response.data as GlobalMetrics;
  },

  // Get global audit logs
  getGlobalAuditLogs: async (params?: { skip?: number; limit?: number; business_id?: string; action?: string }) => {
    const response = await apiClient.get('/admin/audit-logs', { params });
    return response.data as AuditLog[];
  },

  // Get all super admins
  getSuperAdmins: async (params?: { skip?: number; limit?: number }) => {
    const response = await apiClient.get('/admin/super-admins', { params });
    return response.data as User[];
  },

  // Create new super admin
  createSuperAdmin: async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => {
    const params = new URLSearchParams();
    params.append('email', data.email);
    params.append('password', data.password);
    params.append('first_name', data.first_name);
    params.append('last_name', data.last_name);
    
    const response = await apiClient.post(`/admin/super-admins?${params.toString()}`);
    return response.data as User;
  },
};
