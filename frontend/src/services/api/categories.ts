import apiClient from '@/lib/api-client';

export interface Category {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface CategoryCreate {
  name: string;
  description?: string;
}

export interface CategoryUpdate {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export const categoriesApi = {
  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  getCategory: async (id: string): Promise<Category> => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },

  createCategory: async (data: CategoryCreate): Promise<Category> => {
    const response = await apiClient.post('/categories', data);
    return response.data;
  },

  updateCategory: async (id: string, data: CategoryUpdate): Promise<Category> => {
    const response = await apiClient.put(`/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};
