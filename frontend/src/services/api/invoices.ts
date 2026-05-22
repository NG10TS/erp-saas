import apiClient from '@/lib/api-client';
import { Invoice, InvoiceCreate, InvoiceListResponse, SriStatusResponse } from '@/types/invoice';

export const invoicesApi = {
  getInvoices: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    status?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<InvoiceListResponse[]> => {
    const response = await apiClient.get('/invoices', { params });
    return response.data;
  },
  
  getInvoice: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get(`/invoices/${id}`);
    return response.data;
  },
  createCreditNote: async (invoiceId: string, data: any) => {
    const response = await apiClient.post(`/invoices/${invoiceId}/credit-note`, data);
    return response.data;
  },
  createFromSale: async (data: InvoiceCreate): Promise<Invoice> => {
    const response = await apiClient.post('/invoices/from-sale', data);
    return response.data;
  },
  
  getInvoicePDF: async (id: string): Promise<{ pdf_url: string }> => {
    const response = await apiClient.get(`/invoices/${id}/pdf`);
    return response.data;
  },
  
  getSriStatus: async (id: string): Promise<SriStatusResponse> => {
    const response = await apiClient.get(`/invoices/${id}/sri-status`);
    return response.data;
  },
  
  retrySriSubmission: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/invoices/${id}/retry-sri`);
    return response.data;
  },
  
  getInvoiceXML: async (id: string): Promise<{ xml: string }> => {
    const response = await apiClient.get(`/invoices/${id}/xml`);
    return response.data;
  },
  
  getMonthlyStats: async (year: number, month: number): Promise<any> => {
    const response = await apiClient.get('/invoices/stats/monthly', { params: { year, month } });
    return response.data;
  },
  
  getPendingSRI: async (): Promise<{ count: number; invoices: Array<{ id: string; invoice_number: string; created_at: string; attempts: number }> }> => {
    const response = await apiClient.get('/invoices/pending/sri');
    return response.data;
  },
  
  sendWhatsApp: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/invoices/${id}/send-whatsapp`);
    return response.data;
  },
};
