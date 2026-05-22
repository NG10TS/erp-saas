// frontend/src/services/api/reports.ts
import { apiClient } from '@/lib/api-client';

export interface ReportFilters {
  format?: 'excel' | 'pdf';
  from_date?: string;
  to_date?: string;
  status?: string;
  customer_id?: string;
  category_id?: string;
  low_stock_only?: boolean;
  sri_status?: string;
  year?: number;
  month?: number;
}

export const reportsApi = {
  downloadSalesReport: async (filters: ReportFilters) => {
    const response = await apiClient.get('/reports/sales', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  downloadInventoryReport: async (filters: ReportFilters) => {
    const response = await apiClient.get('/reports/inventory', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  downloadCustomersReport: async (filters: ReportFilters) => {
    const response = await apiClient.get('/reports/customers', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  downloadInvoicesReport: async (filters: ReportFilters) => {
    const response = await apiClient.get('/reports/invoices', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  downloadIvaReport: async (filters: ReportFilters) => {
    const response = await apiClient.get('/reports/iva', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
};