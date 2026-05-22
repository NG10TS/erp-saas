// src/components/onboarding/steps/CreateCustomerStep.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { 
  UserIcon, 
  IdentificationIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { FormInput } from '@/components/common/FormInput';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useOnboardingStore } from '@/store/slices/onboardingSlice';

const customerSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre es demasiado largo')
    .regex(/^[a-zA-ZáéíóúñÑ\s]+$/, 'Solo letras y espacios'),
  identification: z.string()
    .min(10, 'Cédula/RUC inválido')
    .max(13, 'Cédula/RUC inválido')
    .regex(/^[0-9]+$/, 'Solo números permitidos'),
  phone: z.string()
    .min(10, 'Teléfono inválido')
    .max(15, 'Teléfono inválido')
    .regex(/^[0-9+]+$/, 'Formato inválido'),
  email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CreateCustomerStepProps {
  onNext: () => void;
  onBack: () => void;
}

export const CreateCustomerStep: React.FC<CreateCustomerStepProps> = ({
  onNext,
  onBack,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCustomer, isCreatingCustomer, errors: hookErrors } = useOnboarding();
  const { customer, setCustomer, setCustomerCreated } = useOnboardingStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields, isValid },
    watch,
    setValue,
    trigger,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    mode: 'onChange',
    defaultValues: {
      name: customer?.name || '',
      identification: customer?.identification || '',
      phone: customer?.phone_number || '',
      email: customer?.email || '',
      address: customer?.address || '',
    },
  });

  const watchedFields = watch();
  const allFieldsFilled = Object.values(watchedFields).every(
    field => field !== undefined && field !== ''
  );

  const onSubmit = async (data: CustomerFormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      await createCustomer({
        name: data.name,
        identification: data.identification,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address || undefined,
      });
      
      onNext();
      
    } catch (error) {
      console.error('Error in form submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || isCreatingCustomer;

  // Auto-save draft to localStorage
  useEffect(() => {
    const saveDraft = () => {
      const draft = {
        name: watchedFields.name,
        identification: watchedFields.identification,
        phone: watchedFields.phone,
        email: watchedFields.email,
        address: watchedFields.address,
        timestamp: Date.now(),
      };
      localStorage.setItem('customer-draft', JSON.stringify(draft));
    };
    
    const timer = setTimeout(saveDraft, 1000);
    return () => clearTimeout(timer);
  }, [watchedFields]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('customer-draft');
    if (draft && !customer?.id) {
      const { name, identification, phone, email, address } = JSON.parse(draft);
      if (name) setValue('name', name);
      if (identification) setValue('identification', identification);
      if (phone) setValue('phone', phone);
      if (email) setValue('email', email);
      if (address) setValue('address', address);
    }
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto">
      {/* Header con animación */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
        >
          <UserIcon className="w-10 h-10 text-white" />
        </motion.div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Registra tu primer cliente
        </h2>
        <p className="text-gray-600">
          Completa los datos de tu primer cliente. Este será tu primer contacto comercial.
        </p>
      </motion.div>

      {/* Formulario */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-5 bg-white rounded-xl shadow-sm border border-gray-100 p-6"
      >
        <FormInput
          label="Nombre completo"
          icon={UserIcon}
          error={errors.name?.message}
          required
          placeholder="Ej: María González"
          autoFocus
          {...register('name')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Cédula/RUC"
            icon={IdentificationIcon}
            error={errors.identification?.message}
            required
            placeholder="Ej: 1712345678"
            {...register('identification')}
          />

          <FormInput
            label="Teléfono"
            icon={PhoneIcon}
            error={errors.phone?.message}
            required
            placeholder="Ej: 0991234567"
            {...register('phone')}
          />
        </div>

        <FormInput
          label="Email"
          icon={EnvelopeIcon}
          error={errors.email?.message}
          type="email"
          placeholder="cliente@ejemplo.com"
          helper="Opcional, pero recomendado para facturación"
          {...register('email')}
        />

        <FormInput
          label="Dirección"
          icon={MapPinIcon}
          error={errors.address?.message}
          placeholder="Dirección del cliente"
          helper="Opcional"
          {...register('address')}
        />

        {/* Indicador de validación */}
        {allFieldsFilled && isValid && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="text-sm font-medium">
                ✅ Todos los datos están listos para continuar
              </span>
            </div>
          </motion.div>
        )}

        {/* Error global */}
        {hookErrors.customer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 text-red-800">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span className="text-sm font-medium">{hookErrors.customer}</span>
            </div>
          </motion.div>
        )}

        {/* Tip profesional */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mt-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-sm font-semibold text-blue-900">Tip profesional</p>
              <p className="text-sm text-blue-800">
                Puedes registrarte a ti mismo como cliente para probar el sistema. 
                Usa tus propios datos y luego podrás crear tu primer cliente real.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Botones de navegación */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-between mt-8 gap-4"
      >
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50"
          disabled={isLoading}
        >
          ← Atrás
        </button>
        
        <button
          type="submit"
          disabled={isLoading || !isValid}
          className="px-8 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registrando...
            </>
          ) : (
            'Continuar →'
          )}
        </button>
      </motion.div>
    </form>
  );
};
