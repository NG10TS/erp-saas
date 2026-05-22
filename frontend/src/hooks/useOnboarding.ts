// src/hooks/useOnboarding.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOnboardingStore } from '@/store/slices/onboardingSlice';
import { customersApi } from '@/services/api/customers';
import { productsApi } from '@/services/api/products';
import { salesApi } from '@/services/api/sales';
import toast from 'react-hot-toast';

interface RetryConfig {
  maxRetries: number;
  delay: number;
  backoff: boolean;
}

export const useOnboarding = () => {
  const queryClient = useQueryClient();
  const store = useOnboardingStore();
  
  const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    config: RetryConfig = { maxRetries: 3, delay: 1000, backoff: true }
  ): Promise<T> => {
    let lastError: any;
    let delay = config.delay;
    
    for (let i = 0; i <= config.maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Check if it's a network error
        const isNetworkError = error.message === 'Network Error' || !error.response;
        
        if (i === config.maxRetries) break;
        
        if (isNetworkError) {
          console.log(`Network error, retrying... (${i + 1}/${config.maxRetries})`);
          toast.loading(`Reintentando conexión... (${i + 1}/${config.maxRetries})`, { id: 'retry-toast' });
        }
        
        if (config.backoff) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        }
      }
    }
    
    // Dismiss loading toast on final failure
    toast.dismiss('retry-toast');
    throw lastError;
  };
  
  const createCustomerWithRetry = useMutation({
    mutationFn: async (data: any) => {
      store.setIsSubmitting(true);
      store.clearErrors();
      
      try {
        // Validación local
        if (!data.name || !data.identification || !data.phone) {
          throw new Error('Todos los campos requeridos deben estar llenos');
        }
        
        const payload = {
          name: data.name,
          identification: data.identification,
          phone_number: data.phone,
          email: data.email || undefined,
          address: data.address || undefined,
        };
        
        // ✅ Retry automático en caso de fallo de red
        const response = await retryWithBackoff(() => 
          customersApi.createCustomer(payload)
        );
        
        // Guardar en store SOLO después de éxito
        store.setCustomer(response);
        store.setCustomerCreated(true);
        
        // Invalidar queries
        await queryClient.invalidateQueries({ queryKey: ['customers'] });
        
        // Dismiss any retry toast
        toast.dismiss('retry-toast');
        toast.success('✨ ¡Cliente registrado exitosamente!');
        return response;
        
      } catch (error: any) {
        console.error('Customer creation failed:', error);
        
        let errorMessage = 'Error al registrar cliente';
        if (error.response?.status === 409) {
          errorMessage = 'Este número de teléfono ya está registrado';
        } else if (error.response?.status === 422) {
          errorMessage = 'Datos inválidos. Verifica el formato.';
        } else if (error.message === 'Network Error' || !error.response) {
          errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
        }
        
        store.setError('customer', errorMessage);
        toast.error(errorMessage);
        throw error;
        
      } finally {
        store.setIsSubmitting(false);
      }
    },
  });
  
  const createProductWithRetry = useMutation({
    mutationFn: async (data: any) => {
      store.setIsSubmitting(true);
      store.clearErrors();
      
      try {
        const payload = {
          name: data.name,
          precio_venta: data.price,
          stock_actual: data.stock,
          description: data.description || '',
          control_stock: true,
        };
        
        const response = await retryWithBackoff(() => 
          productsApi.createProduct(payload)
        );
        
        store.setProduct(response);
        store.setProductCreated(true);
        await queryClient.invalidateQueries({ queryKey: ['products'] });
        
        // Dismiss any retry toast
        toast.dismiss('retry-toast');
        toast.success('✨ ¡Producto registrado exitosamente!');
        return response;
        
      } catch (error: any) {
        console.error('Product creation failed:', error);
        
        let errorMessage = 'Error al registrar producto';
        if (error.response?.status === 409) {
          errorMessage = 'Ya existe un producto con este nombre';
        } else if (error.response?.status === 422) {
          errorMessage = 'Datos inválidos. Verifica los valores.';
        } else if (error.message === 'Network Error' || !error.response) {
          errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
        }
        
        store.setError('product', errorMessage);
        toast.error(errorMessage);
        throw error;
        
      } finally {
        store.setIsSubmitting(false);
      }
    },
  });
  
  const createSaleWithRetry = useMutation({
    mutationFn: async (data: any) => {
      store.setIsSubmitting(true);
      store.clearErrors();
      
      try {
        // Verificar que existan en backend
        const [customerExists, productExists] = await Promise.all([
          customersApi.getCustomer(data.customer_id).catch(() => null),
          productsApi.getProduct(data.product_id).catch(() => null),
        ]);
        
        if (!customerExists) throw new Error('Cliente no encontrado en el sistema');
        if (!productExists) throw new Error('Producto no encontrado en el sistema');
        
        const payload = {
          customer_id: data.customer_id,
          items: [{
            product_id: data.product_id,
            cantidad: data.quantity,
            precio_unitario: data.unit_price,
          }],
          metodo_pago: 'cash' as const,
          notas: `Venta de onboarding - ${data.product_name}`,
        };
        
        const response = await retryWithBackoff(() => 
          salesApi.createSale(payload)
        );
        
        store.setSale(response);
        store.setSaleCreated(true);
        await queryClient.invalidateQueries({ queryKey: ['sales'] });
        
        // Dismiss any retry toast
        toast.dismiss('retry-toast');
        toast.success('🎉 ¡Primera venta registrada!');
        
        // Redirigir después de éxito
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
        
        return response;
        
      } catch (error: any) {
        console.error('Sale creation failed:', error);
        
        let errorMessage = 'Error al registrar venta';
        if (error.message === 'Cliente no encontrado en el sistema') {
          errorMessage = 'Cliente no encontrado. Completa el paso anterior.';
        } else if (error.message === 'Producto no encontrado en el sistema') {
          errorMessage = 'Producto no encontrado. Completa el paso anterior.';
        } else if (error.response?.status === 422) {
          errorMessage = 'Datos inválidos. Verifica la cantidad y precio.';
        } else if (error.message === 'Network Error' || !error.response) {
          errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
        }
        
        store.setError('sale', errorMessage);
        toast.error(errorMessage);
        throw error;
        
      } finally {
        store.setIsSubmitting(false);
      }
    },
  });
  
  return {
    createCustomer: createCustomerWithRetry.mutateAsync,
    createProduct: createProductWithRetry.mutateAsync,
    createSale: createSaleWithRetry.mutateAsync,
    isCreatingCustomer: createCustomerWithRetry.isPending,
    isCreatingProduct: createProductWithRetry.isPending,
    isCreatingSale: createSaleWithRetry.isPending,
    errors: store.errors,
    clearErrors: store.clearErrors,
  };
};
