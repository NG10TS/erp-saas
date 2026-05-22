// src/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/services/api/products';
import { ProductCreate, ProductUpdate, StockAdjustment } from '@/types/product';
import toast from 'react-hot-toast';

// ============================================
// QUERY HOOKS
// ============================================

export const useProducts = (params?: {
  skip?: number;
  limit?: number;
  category?: string;
  is_active?: boolean;
  low_stock?: boolean;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productsApi.getProducts(params),
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getProduct(id),
    enabled: !!id,
  });
};

export const useLowStockProducts = () => {
  return useQuery({
    queryKey: ['low-stock-products'],
    queryFn: () => productsApi.getLowStock(),
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ProductCreate) => productsApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto creado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al crear producto';
      handleError(error);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductUpdate }) =>
      productsApi.updateProduct(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      toast.success('Producto actualizado exitosamente');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto eliminado exitosamente');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useAdjustStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StockAdjustment }) =>
      productsApi.adjustStock(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      toast.success('Stock actualizado exitosamente');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

// ============================================
// HOOK PRINCIPAL PARA ONBOARDING
// ============================================

export const useProductActions = () => {
  const queryClient = useQueryClient();
  
  const createProduct = useMutation({
    mutationFn: async (data: ProductCreate) => {
      console.log('📡 [createProduct] Enviando:', data);
      const response = await productsApi.createProduct(data);
      console.log('✅ [createProduct] Respuesta:', response);
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto creado exitosamente');
    },
    onError: (error: any) => {
      console.error('❌ [createProduct] Error:', error);
      const message = error.response?.data?.detail || 'Error al crear producto';
      handleError(error);
    },
  });

  return {
    createProduct: createProduct.mutateAsync,
    isCreating: createProduct.isPending,
  };
};

export const useRestoreProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => productsApi.restoreProduct(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast.success('Producto restaurado exitosamente');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const usePermanentDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => productsApi.permanentDeleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto eliminado permanentemente');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useDeletedProducts = () => {
  return useQuery({
    queryKey: ['deleted-products'],
    queryFn: () => productsApi.getDeletedProducts(),
  });
};