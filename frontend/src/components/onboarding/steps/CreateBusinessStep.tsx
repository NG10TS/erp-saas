// src/components/onboarding/steps/CreateBusinessStep.tsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useOnboardingStore } from '@/store/slices/onboardingSlice';
import { useBusiness } from '@/hooks/useBusiness';
import { useAuthStore } from '@/store/slices/authSlice';

const businessSchema = z.object({
  business_name: z.string().min(3, 'El nombre es requerido'),
  ruc: z.string()
    .min(10, 'RUC/Cédula debe tener al menos 10 dígitos')
    .max(13, 'RUC/Cédula no puede tener más de 13 dígitos')
    .regex(/^[0-9]+$/, 'Solo números permitidos')
    .superRefine((value, ctx) => {
      const length = value.length;
      let isValid = false;
      let errorMessage = 'Formato de RUC/Cédula inválido.';
      
      if (length === 10) {
        // Validación de cédula (10 dígitos)
        if (!/^[0-9]{10}$/.test(value)) {
          errorMessage = 'Cédula inválida. Verifique los dígitos.';
        } else {
          const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
          let sum = 0;
          
          for (let i = 0; i < 9; i++) {
            let digit = parseInt(value[i]);
            let product = digit * coefficients[i];
            if (product >= 10) product -= 9;
            sum += product;
          }
          
          const mod = sum % 10;
          const checkDigit = mod === 0 ? 0 : 10 - mod;
          const actualCheckDigit = parseInt(value[9]);
          isValid = checkDigit === actualCheckDigit;
          
          if (!isValid) {
            errorMessage = 'Cédula inválida. Verifique los dígitos.';
          }
        }
      } else if (length === 13) {
        // Validación de RUC (13 dígitos)
        if (!/^[0-9]{13}$/.test(value)) {
          errorMessage = 'RUC inválido. Verifique los dígitos o código de establecimiento.';
        } else {
          // Validar los primeros 10 dígitos como cédula
          const cedulaPart = value.substring(0, 10);
          const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
          let sum = 0;
          
          for (let i = 0; i < 9; i++) {
            let digit = parseInt(cedulaPart[i]);
            let product = digit * coefficients[i];
            if (product >= 10) product -= 9;
            sum += product;
          }
          
          const mod = sum % 10;
          const checkDigit = mod === 0 ? 0 : 10 - mod;
          const actualCheckDigit = parseInt(cedulaPart[9]);
          
          if (checkDigit !== actualCheckDigit) {
            errorMessage = 'RUC inválido. Verifique los dígitos o código de establecimiento.';
          } else {
            // Validar código de establecimiento (últimos 3 dígitos)
            const establishmentCode = parseInt(value.substring(10, 13));
            isValid = establishmentCode >= 1 && establishmentCode <= 999;
            
            if (!isValid) {
              errorMessage = 'RUC inválido. El código de establecimiento debe estar entre 001 y 999.';
            }
          }
        }
      }
      
      if (!isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: errorMessage,
        });
      }
    }),
  phone: z.string().min(9, 'Teléfono inválido'),
  email: z.string().email('Email inválido'),
  address: z.string().optional(),
});

type BusinessFormData = z.infer<typeof businessSchema>;

interface CreateBusinessStepProps {
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const CreateBusinessStep: React.FC<CreateBusinessStepProps> = ({
  onNext,
  onBack,
  isLoading: externalIsLoading,
  setIsLoading: setExternalIsLoading,
}) => {
  const { setBusiness, setBusinessCreated } = useOnboardingStore();
  const { updateBusiness, getMyBusiness, createBusiness, isLoading: hookIsLoading } = useBusiness();
  const { user, business: authBusiness } = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      business_name: '',
      ruc: '',
      phone: '',
      email: user?.email || '',
      address: '',
    },
  });

  // Cargar datos existentes del negocio
  useEffect(() => {
    const loadBusinessData = async () => {
      if (authBusiness) {
        setValue('business_name', authBusiness.business_name || '');
        setValue('ruc', authBusiness.ruc || '');
        setValue('phone', authBusiness.phone || '');
        setValue('email', authBusiness.email || user?.email || '');
        setValue('address', authBusiness.address || '');
      } else {
        try {
          const existingBusiness = await getMyBusiness();
          if (existingBusiness) {
            setValue('business_name', existingBusiness.business_name || '');
            setValue('ruc', existingBusiness.ruc || '');
            setValue('phone', existingBusiness.phone || '');
            setValue('email', existingBusiness.email || user?.email || '');
            setValue('address', existingBusiness.address || '');
          }
        } catch (error) {
          console.log('No existing business, user will create one');
        }
      }
    };
    loadBusinessData();
  }, [authBusiness, user, setValue, getMyBusiness]);

  const onSubmit = async (data: BusinessFormData) => {
    setExternalIsLoading(true);
    try {
      let result;
      if (authBusiness?.id) {
        result = await updateBusiness(data);
      } else {
        result = await createBusiness(data);
      }
      setBusiness(data);
      setBusinessCreated(true);
      toast.success('¡Negocio configurado exitosamente!');
      onNext();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Error al configurar el negocio';
      toast.error(errorMsg);
    } finally {
      setExternalIsLoading(false);
    }
  };

  const isLoading = externalIsLoading || hookIsLoading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configura tu negocio</h2>
        <p className="text-gray-600">Estos datos serán usados en tus facturas electrónicas</p>
      </div>

      <div className="space-y-4">
        {/* Nombre del negocio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del negocio *</label>
          <input
            {...register('business_name')}
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Ej: Tienda de Don Juan"
            autoFocus
          />
          {errors.business_name && <p className="text-red-500 text-sm mt-1">{errors.business_name.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* RUC/Cédula */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RUC/Cédula *</label>
            <input
              {...register('ruc')}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Ej: 1712345678001"
            />
            {errors.ruc && <p className="text-red-500 text-sm mt-1">{errors.ruc.message}</p>}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
            <input
              {...register('phone')}
              type="tel"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Ej: 0991234567"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            {...register('email')}
            type="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="ejemplo@negocio.com"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        {/* Dirección (opcional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección (opcional)</label>
          <input
            {...register('address')}
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Dirección del negocio"
          />
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
        >
          Atrás
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Configurando...' : 'Continuar →'}
        </button>
      </div>
    </form>
  );
};