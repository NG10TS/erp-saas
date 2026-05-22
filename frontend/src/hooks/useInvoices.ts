import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '@/services/api/invoices';
import { InvoiceCreate } from '@/types/invoice';
import toast from 'react-hot-toast';

export const useInvoices = (params?: {
  skip?: number;
  limit?: number;
  status?: string;
  from_date?: string;
  to_date?: string;
}) => {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => invoicesApi.getInvoices(params),
  });
};

export const useInvoice = (id: string) => {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.getInvoice(id),
    enabled: !!id,
  });
};

export const useCreateInvoiceFromSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InvoiceCreate) => invoicesApi.createFromSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Factura creada');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useInvoicePDF = (id: string) => {
  return useQuery({
    queryKey: ['invoice-pdf', id],
    queryFn: () => invoicesApi.getInvoicePDF(id),
    enabled: !!id,
  });
};

export const useSriStatus = (id: string) => {
  return useQuery({
    queryKey: ['invoice-sri-status', id],
    queryFn: () => invoicesApi.getSriStatus(id),
    enabled: !!id,
    refetchInterval: (query) => {
      if (query.state.data?.status === 'pending') return 10000;
      return false;
    },
  });
};

export const useRetrySriSubmission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => invoicesApi.retrySriSubmission(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoice-sri-status', id] });
      toast.success('Reintentando envío al SRI');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const usePendingSriInvoices = () => {
  return useQuery({
    queryKey: ['pending-sri-invoices'],
    queryFn: () => invoicesApi.getPendingSRI(),
  });
};
