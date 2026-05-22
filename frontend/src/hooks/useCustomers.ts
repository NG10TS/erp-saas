// src/hooks/useCustomers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/services/api/customers';
import { CustomerCreate, CustomerUpdate } from '@/types/customer';
import toast from 'react-hot-toast';

// ============================================
// QUERY HOOKS
// ============================================

export const useCustomers = (params?: { skip?: number; limit?: number; search?: string }) => {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customersApi.getCustomers(params),
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getCustomer(id),
    enabled: !!id,
  });
};

export const useTopCustomers = (limit: number = 10) => {
  return useQuery({
    queryKey: ['top-customers', limit],
    queryFn: () => customersApi.getTopCustomers(limit),
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CustomerCreate) => customersApi.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente creado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al crear cliente';
      handleError(error);
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerUpdate }) => 
      customersApi.updateCustomer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] });
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => customersApi.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente eliminado exitosamente');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useBlockCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
      customersApi.blockCustomer(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      toast.success('Cliente bloqueado exitosamente');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useUnblockCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => customersApi.unblockCustomer(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      toast.success('Cliente desbloqueado exitosamente');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useCustomerPurchases = (id: string, limit: number = 50) => {
  return useQuery({
    queryKey: ['customer-purchases', id, limit],
    queryFn: () => customersApi.getCustomerPurchases(id, limit),
    enabled: !!id,
  });
};

// ============================================
// HOOK PRINCIPAL PARA ONBOARDING
// ============================================

export const useCustomerActions = () => {
  const queryClient = useQueryClient();
  
  const createCustomer = useMutation({
    mutationFn: async (data: CustomerCreate) => {
      console.log('📡 [createCustomer] Enviando:', data);
      const response = await customersApi.createCustomer(data);
      console.log('✅ [createCustomer] Respuesta:', response);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente registrado exitosamente');
    },
    onError: (error: any) => {
      console.error('❌ [createCustomer] Error:', error);
      const message = error.response?.data?.detail || 'Error al registrar cliente';
      handleError(error);
    },
  });

  return {
    createCustomer: createCustomer.mutateAsync,
    isCreating: createCustomer.isPending,
  };
};