// frontend/src/pages/onboarding/BusinessSetup.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const businessSchema = z.object({
  ruc: z.string().length(13, 'El RUC debe tener 13 dígitos').regex(/^\d+$/, 'Solo números'),
  business_name: z.string().min(3, 'Nombre requerido'),
  commercial_name: z.string().optional(),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Teléfono inválido'),
  address: z.string().optional(),
});

type BusinessFormData = z.infer<typeof businessSchema>;

export const BusinessSetup: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [hasToken, setHasToken] = useState(true);
  
  // Solo verificar token, sin hacer llamadas a la API
    useEffect(() => {
    console.log('🔍 BusinessSetup - URL completa:', window.location.href);
    console.log('🔍 BusinessSetup - Search params:', window.location.search);
    
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    console.log('🔍 BusinessSetup - Token encontrado:', token);
    
    if (token) {
        console.log('✅ Guardando token en localStorage');
        localStorage.setItem('access_token', token);
    } else {
        console.log('❌ No hay token en la URL');
    }
    }, []);
  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    mode: 'onChange'
  });
  
  const onSubmit = async (data: BusinessFormData) => {
    setIsLoading(true);
    try {
      await apiClient.post('/onboarding/business', {
        ruc: data.ruc,
        business_name: data.business_name,
        commercial_name: data.commercial_name || data.business_name,
        email: data.email,
        phone: data.phone,
        address: data.address || ''
      });
      
      toast.success('¡Negocio creado exitosamente!');
      window.location.href = '/app/dashboard';
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al crear el negocio');
      setIsLoading(false);
    }
  };
  
  if (!hasToken) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-8 text-white text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Configura tu negocio</h1>
            <p className="mt-2">Completa los datos para comenzar</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RUC *</label>
                <input
                  {...register('ruc')}
                  maxLength={13}
                  className={cn('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500', errors.ruc && 'border-red-500')}
                  placeholder="0999999999001"
                />
                {errors.ruc && <p className="text-sm text-red-500 mt-1">{errors.ruc.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social *</label>
                <input
                  {...register('business_name')}
                  className={cn('w-full px-4 py-2 border rounded-lg', errors.business_name && 'border-red-500')}
                  placeholder="Mi Empresa S.A."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email del negocio *</label>
                <input
                  {...register('email')}
                  type="email"
                  className={cn('w-full px-4 py-2 border rounded-lg', errors.email && 'border-red-500')}
                  placeholder="contacto@miempresa.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                <input
                  {...register('phone')}
                  className={cn('w-full px-4 py-2 border rounded-lg', errors.phone && 'border-red-500')}
                  placeholder="0999999999"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  {...register('address')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Quito, Ecuador"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !isValid}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Crear negocio'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default BusinessSetup;