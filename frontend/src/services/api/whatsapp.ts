import apiClient from '@/lib/api-client';
import { 
  WhatsAppMessage, 
  SendMessageRequest, 
  SendTemplateRequest, 
  WhatsAppTemplate, 
  WhatsAppTemplateCreate,
  Conversation 
} from '@/types/whatsapp';

export const whatsappApi = {
  getMessages: async (customerId?: string): Promise<WhatsAppMessage[]> => {
    const response = await apiClient.get('/whatsapp/messages', {
      params: customerId ? { customer_id: customerId } : undefined,
    });
    return response.data;
  },
  
  sendMessage: async (data: SendMessageRequest): Promise<{ message: string }> => {
    const response = await apiClient.post('/whatsapp/messages/send', data);
    return response.data;
  },
  
  sendTemplate: async (data: SendTemplateRequest): Promise<{ message: string }> => {
    const response = await apiClient.post('/whatsapp/messages/template', data);
    return response.data;
  },
  
  getTemplates: async (): Promise<WhatsAppTemplate[]> => {
    const response = await apiClient.get('/whatsapp/templates');
    return response.data;
  },
  
  createTemplate: async (data: WhatsAppTemplateCreate): Promise<WhatsAppTemplate> => {
    const response = await apiClient.post('/whatsapp/templates', data);
    return response.data;
  },
  
  updateTemplate: async (id: string, data: WhatsAppTemplateCreate): Promise<WhatsAppTemplate> => {
    const response = await apiClient.put(`/whatsapp/templates/${id}`, data);
    return response.data;
  },
  
  deleteTemplate: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/whatsapp/templates/${id}`);
    return response.data;
  },
  
  getConversations: async (): Promise<Conversation[]> => {
    const response = await apiClient.get('/whatsapp/conversations');
    return response.data;
  },
  
  getStats: async (): Promise<any> => {
    const response = await apiClient.get('/whatsapp/stats');
    return response.data;
  },
  
  testWebhook: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/whatsapp/webhook/test');
    return response.data;
  },
};
