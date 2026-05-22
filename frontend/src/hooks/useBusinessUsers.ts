import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/api/userService';
import { useToast } from '@/hooks/useToast';
import type { User } from '@/types/permissions';
import { handleError } from '@/utils/error-handler';

export const useBusinessUsers = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  // ─── Queries ────────────────────────────────────────────

  const useUsers = (params?: { skip?: number; limit?: number; role?: string }) => {
    return useQuery({
      queryKey: ['businessUsers', params],
      queryFn: () => userService.getUsers(params),
    });
  };

  const useUser = (userId: string) => {
    return useQuery({
      queryKey: ['businessUser', userId],
      queryFn: () => userService.getUser(userId),
    });
  };

  const useAuditLogs = (params?: { skip?: number; limit?: number; action?: string; entity_type?: string }) => {
    return useQuery({
      queryKey: ['auditLogs', params],
      queryFn: () => userService.getAuditLogs(params),
    });
  };

  const usePermissionsSchema = () => {
    return useQuery({
      queryKey: ['permissionsSchema'],
      queryFn: () => userService.getPermissionsSchema(),
    });
  };

  const useUserPermissions = (userId: string) => {
    return useQuery({
      queryKey: ['user-permissions', userId],
      queryFn: () => userService.getUserPermissions(userId),
      enabled: !!userId,
    });
  };

  // ─── Mutations ──────────────────────────────────────────

  const useCreateUser = () => {
    return useMutation({
      mutationFn: (data: Parameters<typeof userService.createUser>[0]) =>
        userService.createUser(data),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['businessUsers'] });
        toast.success('Empleado creado exitosamente');
        return data;
      },
      onError: (error) => handleError(error, 'Error al crear empleado'),
    });
  };

  const useUpdateRole = () => {
    return useMutation({
      mutationFn: ({ userId, role }: { userId: string; role: string }) =>
        userService.updateRole(userId, role),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['businessUsers'] });
        toast.success('Rol actualizado');
      },
      onError: (error) => handleError(error, 'Error al actualizar rol'),
    });
  };

  const useToggleStatus = () => {
    return useMutation({
      mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
        userService.toggleStatus(userId, isActive),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['businessUsers'] });
        toast.success(variables.isActive ? 'Empleado activado' : 'Empleado desactivado');
      },
      onError: (error) => handleError(error, 'Error al actualizar estado'),
    });
  };

  const useAssignPermissions = () => {
    return useMutation({
      mutationFn: ({ userId, permissions }: { userId: string; permissions: Record<string, boolean> }) =>
        userService.assignPermissions(userId, permissions),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['businessUsers'] });
        toast.success('Permisos asignados');
      },
      onError: (error) => handleError(error, 'Error al asignar permisos'),
    });
  };

  const useDeleteUser = () => {
    return useMutation({
      mutationFn: (userId: string) => userService.deleteUser(userId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['businessUsers'] });
        toast.success('Empleado eliminado');
      },
      onError: (error) => handleError(error, 'Error al eliminar empleado'),
    });
  };

  return {
    useUsers,
    useUser,
    useCreateUser,
    useUpdateRole,
    useToggleStatus,
    useAssignPermissions,
    useDeleteUser,
    useAuditLogs,
    usePermissionsSchema,
    useUserPermissions,
  };
};