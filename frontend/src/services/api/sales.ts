import apiClient from '@/lib/api-client';
import { Sale, SaleCreate, SaleUpdate, SaleListResponse, SaleStatus } from '@/types/sale';

export const salesApi = {
  getSales: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    status?: SaleStatus;
    from_date?: string;
    to_date?: string;
    customer_id?: string;
  }): Promise<SaleListResponse[]> => {
    const response = await apiClient.get('/sales', { params });
    return response.data;
  },
  processSale: (id: string) => 
  apiClient.post(`/sales/${id}/process`),
  
  getSale: async (id: string): Promise<Sale> => {
    const response = await apiClient.get(`/sales/${id}`);
    return response.data;
  },
  
  createSale: async (data: SaleCreate): Promise<Sale> => {
    const response = await apiClient.post('/sales', data);
    return response.data;
  },
  
  updateSale: async (id: string, data: SaleUpdate): Promise<Sale> => {
    const response = await apiClient.put(`/sales/${id}`, data);
    return response.data;
  },
  
  confirmSale: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/sales/${id}/confirm`);
    return response.data;
  },
  
  completeSale: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/sales/${id}/complete`);
    return response.data;
  },
  
  cancelSale: async (id: string, reason?: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/sales/${id}/cancel`, { reason });
    return response.data;
  },
  
  getTodayStats: async (): Promise<{ date: string; total_sales: number; total_amount: number; by_payment_method: Array<{ method: string; count: number; amount: number }> }> => {
    const response = await apiClient.get('/sales/stats/today');
    return response.data;
  },
  
  getMonthlyStats: async (year: number, month: number): Promise<any> => {
    const response = await apiClient.get('/sales/stats/monthly', { params: { year, month } });
    return response.data;
  },
  
  getRecentActivity: async (limit: number = 10): Promise<Array<{ id: string; sale_number: string; customer_name: string; total: number; status: string; time: string }>> => {
    const response = await apiClient.get('/sales/recent/activity', { params: { limit } });
    return response.data;
  },
  
  sendWhatsApp: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/sales/${id}/send-whatsapp`);
    return response.data;
  },
};
