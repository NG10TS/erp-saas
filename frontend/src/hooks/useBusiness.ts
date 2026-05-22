// src/hooks/useBusiness.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessApi } from '@/services/api/business';
import { BusinessUpdate } from '@/types/business';
import { useAuthStore } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';

// ============================================
// QUERY HOOKS
// ============================================

export const useGetBusiness = () => {
  return useQuery({
    queryKey: ['business'],
    queryFn: () => businessApi.getMyBusiness(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUsageStats = () => {
  return useQuery({
    queryKey: ['usage-stats'],
    queryFn: () => businessApi.getUsageStats(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCertificateInfo = () => {
  return useQuery({
    queryKey: ['certificate-info'],
    queryFn: () => businessApi.getCertificateInfo(),
    staleTime: 60 * 60 * 1000,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

export const useUpdateBusiness = () => {
  const queryClient = useQueryClient();
  const { refreshBusiness } = useAuthStore();
  
  return useMutation({
    mutationFn: (data: BusinessUpdate) => businessApi.updateBusiness(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['business'] });
      refreshBusiness();
      toast.success('Información actualizada');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al actualizar';
      handleError(error);
    },
  });
};

export const useUploadLogo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file: File) => businessApi.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] });
      toast.success('Logo actualizado');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useSriConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => businessApi.updateSriConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] });
      toast.success('Configuración SRI actualizada');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useUploadCertificate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => businessApi.uploadCertificate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] });
      toast.success('Certificado cargado');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useWhatsAppConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => businessApi.updateWhatsAppConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] });
      toast.success('Configuración WhatsApp actualizada');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useTestSriConnection = () => {
  return useMutation({
    mutationFn: () => businessApi.testSriConnection(),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Conexión SRI exitosa');
      } else {
        handleError(error);
      }
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

// ============================================
// BUSINESS ACTIONS HOOK (para onboarding)
// ============================================

export const useBusinessActions = () => {
  const queryClient = useQueryClient();
  const { business: currentBusiness, refreshBusiness } = useAuthStore();

  // ✅ DECLARAR getMyBusiness AQUÍ
  const getMyBusiness = async () => {
    try {
      const response = await businessApi.getMyBusiness();
      if (response) {
        await refreshBusiness();
      }
      return response ?? null;
    } catch (error) {
      console.error('[BusinessActions] Error fetching:', error);
      return null;
    }
  };

  const createBusiness = useMutation({
    mutationFn: (data: any) => businessApi.createBusiness(data),
    onSuccess: async () => {
      await refreshBusiness();
      queryClient.invalidateQueries({ queryKey: ['business'] });
    },
    onError: (error: any) => {
      console.error('[BusinessActions] Create error:', error);
    },
  });

  const updateBusiness = useMutation({
    mutationFn: async (data: BusinessUpdate) => {
      console.log('📡 [updateBusiness] Enviando:', data);
      const response = await businessApi.updateBusiness(data);
      console.log('✅ [updateBusiness] Respuesta recibida:', response);
      return response;
    },
    onSuccess: (response) => {
      console.log('🎉 [updateBusiness] onSuccess:', response);
      try {
        queryClient.invalidateQueries({ queryKey: ['business'] });
        if (refreshBusiness && typeof refreshBusiness === 'function') {
          refreshBusiness();
        }
        toast.success('Información actualizada');
      } catch (err) {
        console.error('❌ [updateBusiness] Error en onSuccess:', err);
      }
    },
    onError: (error: any) => {
      console.error('❌ [updateBusiness] onError:', error);
      if (error.response?.status !== 200) {
        const message = error.response?.data?.detail || 'Error al actualizar';
        handleError(error);
      }
    },
  });

  return {
    getMyBusiness,
    createBusiness: createBusiness.mutateAsync,
    updateBusiness: updateBusiness.mutateAsync,
    isLoading: createBusiness.isPending || updateBusiness.isPending,
    currentBusiness,
  };
};

// ============================================
// MAIN BUSINESS HOOK (compatibilidad)
// ============================================

export const useBusiness = () => {
  const actions = useBusinessActions();
  return {
    getMyBusiness: actions.getMyBusiness,
    createBusiness: actions.createBusiness,
    updateBusiness: actions.updateBusiness,
    isLoading: actions.isLoading,
    currentBusiness: actions.currentBusiness,
  };
};
