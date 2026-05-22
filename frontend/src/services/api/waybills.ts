// frontend/src/services/api/waybills.ts
import { apiClient } from '@/lib/api-client';

export const waybillsApi = {
  getWaybills: async (params?: {
    status?: string;
    from_date?: string;
    to_date?: string;
    skip?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/waybills', { params });
    return response.data;
  },

  getWaybill: async (id: string) => {
    const response = await apiClient.get(`/waybills/${id}`);
    return response.data;
  },

  createWaybill: async (data: any) => {
    const response = await apiClient.post('/waybills', data);
    return response.data;
  },

  getWaybillPDF: async (id: string) => {
    const response = await apiClient.get(`/waybills/${id}/pdf`);
    return response.data;
  },
};