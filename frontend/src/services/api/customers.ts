// src/services/api/customers.ts
import apiClient from '@/lib/api-client';
import { Customer, CustomerCreate, CustomerUpdate } from '@/types/customer';

export const customersApi = {
  // GET
  getCustomers: async (params?: { skip?: number; limit?: number; search?: string }): Promise<Customer[]> => {
    const response = await apiClient.get('/customers', { params });
    return response.data;
  },
  
  getCustomer: async (id: string): Promise<Customer> => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },
  
  getTopCustomers: async (limit: number = 10): Promise<Customer[]> => {
    const response = await apiClient.get('/customers/stats/top', { params: { limit } });
    return response.data;
  },
  
  getCustomerPurchases: async (id: string, limit: number = 50): Promise<any> => {
    const response = await apiClient.get(`/customers/${id}/purchases`, { params: { limit } });
    return response.data;
  },
  
  getCustomerByPhone: async (phone: string): Promise<Customer> => {
    const response = await apiClient.get(`/customers/phone/${phone}`);
    return response.data;
  },
  
  getCustomerByIdentification: async (identification: string): Promise<Customer> => {
    const response = await apiClient.get(`/customers/identification/${identification}`);
    return response.data;
  },
  
  // POST
  createCustomer: async (data: CustomerCreate): Promise<Customer> => {
    const response = await apiClient.post('/customers', data);
    return response.data;
  },
  
  // PUT
  updateCustomer: async (id: string, data: CustomerUpdate): Promise<Customer> => {
    const response = await apiClient.put(`/customers/${id}`, data);
    return response.data;
  },
  
  // DELETE
  deleteCustomer: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/customers/${id}`);
    return response.data;
  },
  
  // POST - Actions
  blockCustomer: async (id: string, reason?: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/customers/${id}/block`, { reason });
    return response.data;
  },
  
  unblockCustomer: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/customers/${id}/unblock`);
    return response.data;
  },
};
