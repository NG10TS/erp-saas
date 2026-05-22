import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappApi } from '@/services/api/whatsapp';
import { SendMessageRequest, SendTemplateRequest, WhatsAppTemplateCreate } from '@/types/whatsapp';
import toast from 'react-hot-toast';

export const useWhatsAppMessages = (customerId?: string) => {
  return useQuery({
    queryKey: ['whatsapp-messages', customerId],
    queryFn: () => whatsappApi.getMessages(customerId),
    enabled: !!customerId,
    refetchInterval: 5000,
  });
};

export const useWhatsAppConversations = () => {
  return useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: () => whatsappApi.getConversations(),
    refetchInterval: 10000,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SendMessageRequest) => whatsappApi.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useSendTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SendTemplateRequest) => whatsappApi.sendTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
      toast.success('Plantilla enviada');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useWhatsAppTemplates = () => {
  return useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: () => whatsappApi.getTemplates(),
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: WhatsAppTemplateCreate) => whatsappApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast.success('Plantilla creada');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WhatsAppTemplateCreate }) =>
      whatsappApi.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast.success('Plantilla actualizada');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => whatsappApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast.success('Plantilla eliminada');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useWhatsAppStats = () => {
  return useQuery({
    queryKey: ['whatsapp-stats'],
    queryFn: () => whatsappApi.getStats(),
  });
};

export const useTestWebhook = () => {
  return useMutation({
    mutationFn: () => whatsappApi.testWebhook(),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Webhook funcionando correctamente');
      } else {
        handleError(error);
      }
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};