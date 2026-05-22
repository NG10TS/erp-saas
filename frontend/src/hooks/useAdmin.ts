import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/api/adminService';
import { useToast } from '@/hooks/useToast';
import { handleError } from '@/utils/error-handler';
import type { ChangeOwnerRequest, SetBusinessStatusRequest, AssignSubscriptionRequest } from '@/types/permissions';

export const useAdmin = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Fetch all businesses
  const useBusinesses = (params?: { skip?: number; limit?: number; search?: string }) => {
    return useQuery({
      queryKey: ['adminBusinesses', params],
      queryFn: () => adminService.getBusinesses(params),
    });
  };

  // Fetch business detail
  const useBusinessDetail = (businessId: string) => {
    return useQuery({
      queryKey: ['businessDetail', businessId],
      queryFn: () => adminService.getBusinessDetail(businessId),
      enabled: !!businessId,
    });
  };

  // Fetch business users
  const useBusinessUsers = (businessId: string, params?: { skip?: number; limit?: number }) => {
    return useQuery({
      queryKey: ['businessUsersAdmin', businessId, params],
      queryFn: () => adminService.getBusinessUsers(businessId, params),
      enabled: !!businessId,
    });
  };

  // Change owner mutation
  const useChangeOwner = () => {
    return useMutation({
      mutationFn: ({ businessId, data }: { businessId: string; data: ChangeOwnerRequest }) =>
        adminService.changeOwner(businessId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['adminBusinesses'] });
        toast.success('Propietario actualizado');
      },
      onError: (error: any) => {
        handleError(error);
      },
    });
  };

  // Set business status mutation
  const useSetBusinessStatus = () => {
    return useMutation({
      mutationFn: ({ businessId, data }: { businessId: string; data: SetBusinessStatusRequest }) =>
        adminService.setBusinessStatus(businessId, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['adminBusinesses'] });
        const action = variables.data.is_active ? 'activado' : 'suspendido';
        toast.success(`Negocio ${action}`);
      },
      onError: (error: any) => {
        handleError(error);
      },
    });
  };

  // Assign subscription mutation
  const useAssignSubscription = () => {
    return useMutation({
      mutationFn: ({ businessId, data }: { businessId: string; data: AssignSubscriptionRequest }) =>
        adminService.assignSubscription(businessId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['adminBusinesses'] });
        toast.success('Suscripción asignada');
      },
      onError: (error: any) => {
        handleError(error);
      },
    });
  };

  // Fetch global metrics
  const useMetrics = () => {
    return useQuery({
      queryKey: ['adminMetrics'],
      queryFn: () => adminService.getMetrics(),
      refetchInterval: 30000, // Auto-refresh every 30 seconds
    });
  };

  // Fetch global audit logs
  const useGlobalAuditLogs = (params?: { skip?: number; limit?: number; business_id?: string; action?: string }) => {
    return useQuery({
      queryKey: ['globalAuditLogs', params],
      queryFn: () => adminService.getGlobalAuditLogs(params),
    });
  };

  // Fetch super admins
  const useSuperAdmins = (params?: { skip?: number; limit?: number }) => {
    return useQuery({
      queryKey: ['superAdmins', params],
      queryFn: () => adminService.getSuperAdmins(params),
    });
  };

  // Create super admin mutation
  const useCreateSuperAdmin = () => {
    return useMutation({
      mutationFn: (data: Parameters<typeof adminService.createSuperAdmin>[0]) =>
        adminService.createSuperAdmin(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['superAdmins'] });
        toast.success('Super admin creado');
      },
      onError: (error: any) => {
        handleError(error);
      },
    });
  };

  return {
    useBusinesses,
    useBusinessDetail,
    useBusinessUsers,
    useChangeOwner,
    useSetBusinessStatus,
    useAssignSubscription,
    useMetrics,
    useGlobalAuditLogs,
    useSuperAdmins,
    useCreateSuperAdmin,
  };
};
