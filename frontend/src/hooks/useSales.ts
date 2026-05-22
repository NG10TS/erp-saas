// src/hooks/useSales.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '@/services/api/sales';
import { SaleCreate } from '@/types/sale';
import toast from 'react-hot-toast';

// ============================================
// QUERY HOOKS
// ============================================

export const useSales = (params?: any) => {
  return useQuery({
    queryKey: ['sales', params],
    queryFn: () => salesApi.getSales(params),
  });
};

export const useSale = (id: string) => {
  return useQuery({
    queryKey: ['sale', id],
    queryFn: () => salesApi.getSale(id),
    enabled: !!id,
  });
};

export const useTodayStats = () => {
  return useQuery({
    queryKey: ['today-stats'],
    queryFn: () => salesApi.getTodayStats(),
  });
};

export const useRecentActivity = (limit: number = 10) => {
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: () => salesApi.getRecentActivity(limit),
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

export const useCreateSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SaleCreate) => salesApi.createSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Venta registrada exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al registrar venta';
      handleError(error);
    },
  });
};

export const useUpdateSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => salesApi.updateSale(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale', variables.id] });
      toast.success('Venta actualizada exitosamente');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useConfirmSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => salesApi.confirmSale(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale', id] });
      toast.success('Venta confirmada exitosamente');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useCompleteSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => salesApi.completeSale(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale', id] });
      toast.success('Venta completada exitosamente');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useCancelSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => salesApi.cancelSale(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale', id] });
      toast.success('Venta cancelada exitosamente');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useSendSaleWhatsApp = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => salesApi.sendWhatsApp(id),
    onSuccess: (_, id) => {
      toast.success('Mensaje enviado exitosamente');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};
export const useProcessSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => salesApi.processSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Venta en procesamiento');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

// ============================================
// HOOK PRINCIPAL PARA ONBOARDING
// ============================================

export const useSaleActions = () => {
  const queryClient = useQueryClient();
  
  const createSale = useMutation({
    mutationFn: async (data: SaleCreate) => {
      console.log('📡 [createSale] Enviando:', data);
      const response = await salesApi.createSale(data);
      console.log('✅ [createSale] Respuesta:', response);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Venta registrada exitosamente');
    },
    onError: (error: any) => {
      console.error('❌ [createSale] Error:', error);
      const message = error.response?.data?.detail || 'Error al registrar venta';
      handleError(error);
    },
  });

  return {
    createSale: createSale.mutateAsync,
    isCreating: createSale.isPending,
  };
};