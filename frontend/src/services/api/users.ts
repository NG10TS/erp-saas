import apiClient from '@/lib/api-client';
import type { User, UserUpdate, UserCreate } from '@/types/user';

export const usersApi = {
  getUsers: async (params?: { skip?: number; limit?: number }): Promise<User[]> => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },
  
  getUser: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },
  
  createUser: async (data: UserCreate): Promise<User> => {
    const response = await apiClient.post('/users', data);
    return response.data;
  },
  
  updateUser: async (id: string, data: UserUpdate): Promise<User> => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },
  
  updateProfile: async (id: string, data: { first_name: string; last_name: string; phone?: string }): Promise<User> => {
    const response = await apiClient.put(`/users/${id}/profile`, data);
    return response.data;
  },
  
  deleteUser: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
  
  activateUser: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/users/${id}/activate`);
    return response.data;
  },
  
  deactivateUser: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/users/${id}/deactivate`);
    return response.data;
  },
};
