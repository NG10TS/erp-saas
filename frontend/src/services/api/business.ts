// frontend/src/services/api/business.ts
import apiClient from '@/lib/api-client';
import { Business, BusinessUpdate } from '@/types/business';

export const businessApi = {
  // Get current business
  getMyBusiness: async (): Promise<Business> => {
    const response = await apiClient.get('/business/me');
    return response.data;
  },
  
  // Create business (for registration/onboarding)
  createBusiness: async (data: any): Promise<Business> => {
    const response = await apiClient.post('/business', data);
    return response.data;
  },
  
  // Update business
  updateBusiness: async (data: BusinessUpdate): Promise<Business> => {
    const response = await apiClient.put('/business/me', data);
    return response.data;
  },
  
  // Upload logo
  uploadLogo: async (file: File): Promise<{ logo_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/business/me/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  // SRI Configuration
  updateSriConfig: async (data: any): Promise<{ message: string }> => {
    const response = await apiClient.post('/business/me/sri-config', data);
    return response.data;
  },
  
  // Certificate upload - CORREGIDO
  uploadCertificate: async (file: File, password: string) => {
    const formData = new FormData();
    formData.append('certificate', file);
    formData.append('password', password);
    
    return apiClient.post('/business/me/upload-certificate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // WhatsApp Configuration
  updateWhatsAppConfig: async (data: any): Promise<{ message: string }> => {
    const response = await apiClient.post('/business/me/whatsapp-config', data);
    return response.data;
  },
  
  // Statistics
  getUsageStats: async (): Promise<any> => {
    const response = await apiClient.get('/business/me/usage-stats');
    return response.data;
  },
  
  // Certificate info
  getCertificateInfo: async (): Promise<any> => {
    const response = await apiClient.get('/business/me/certificate-info');
    return response.data;
  },
  
  // Test SRI connection
  testSriConnection: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/business/me/test-sri-connection');
    return response.data;
  },
};