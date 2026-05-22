import apiClient from '@/lib/api-client';
import { Product, ProductCreate, ProductUpdate, StockAdjustment, ProductListResponse } from '@/types/product';

export const productsApi = {
  getProducts: async (params?: {
    skip?: number;
    limit?: number;
    category?: string;
    is_active?: boolean;
    low_stock?: boolean;
    search?: string;
    include_deleted?: boolean;
  }): Promise<ProductListResponse[]> => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  restoreProduct: async (id: string): Promise<{ message: string; product_id: string; product_name: string }> => {
    const response = await apiClient.post(`/products/${id}/restore`);
    return response.data;
  },

  permanentDeleteProduct: async (id: string): Promise<{ message: string; product_id: string; permanent: boolean }> => {
    const response = await apiClient.delete(`/products/${id}/permanent`);
    return response.data;
  },

  getDeletedProducts: async (): Promise<{ count: number; products: Array<{ id: string; name: string; sku: string; deleted_at: string; can_be_restored: boolean }> }> => {
    const response = await apiClient.get('/products/deleted');
    return response.data;
  },


  getProduct: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },
  
  createProduct: async (data: ProductCreate): Promise<Product> => {
    const response = await apiClient.post('/products', data);
    return response.data;
  },
  
  updateProduct: async (id: string, data: ProductUpdate): Promise<Product> => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },
  
  deleteProduct: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },
  
  adjustStock: async (id: string, data: StockAdjustment): Promise<{ product_id: string; new_stock: number; message: string }> => {
    const response = await apiClient.post(`/products/${id}/stock`, data);
    return response.data;
  },
  
  toggleActive: async (id: string): Promise<{ product_id: string; is_active: boolean; message: string }> => {
    const response = await apiClient.post(`/products/${id}/toggle-active`);
    return response.data;
  },
  
  getLowStock: async (): Promise<{ count: number; products: Array<{ id: string; name: string; stock: number; min_stock: number }> }> => {
    const response = await apiClient.get('/products/stats/low-stock');
    return response.data;
  },
  
  getCategories: async (): Promise<{ categories: string[] }> => {
    const response = await apiClient.get('/products/categories/list');
    return response.data;
  },
  
  bulkImport: async (products: ProductCreate[]): Promise<{ imported: number; products: Product[] }> => {
    const response = await apiClient.post('/products/bulk-import', products);
    return response.data;
  },
};
