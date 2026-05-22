import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { Customer, CustomerCreate, CustomerUpdate } from '@/types/customer';
import { validatePhone, validateCedula, validateRUC } from '@/utils/validators';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import { useToast } from '@/hooks/useToast';

const customerSchema = z.object({
  phone_number: z.string()
    .min(10, 'Teléfono requerido')
    .refine((val) => validatePhone(val), 'Teléfono inválido'),
  name: z.string().optional(),
  identification: z.string()
    .optional()
    .refine((val) => !val || validateCedula(val) || validateRUC(val), 'Cédula o RUC inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  initialData?: Customer;
  onSubmit?: () => void;
  onCancel?: () => void;
  onSelect?: (customer: Customer) => void;
  isModal?: boolean;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  initialData,
  onSubmit: onSubmitCallback,
  onCancel,
  onSelect,
  isModal = false,
}) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      phone_number: '',
      name: '',
      identification: '',
      email: '',
      address: '',
      city: '',
      province: '',
      notes: '',
      tags: '',
    },
  });

  const identification = watch('identification');
  const phoneNumber = watch('phone_number');

  useEffect(() => {
    if (initialData) {
      setValue('phone_number', initialData.phone_number);
      setValue('name', initialData.name || '');
      setValue('identification', initialData.identification || '');
      setValue('email', initialData.email || '');
      setValue('address', initialData.address || '');
      setValue('city', initialData.city || '');
      setValue('province', initialData.province || '');
      setValue('notes', initialData.notes || '');
      setValue('tags', initialData.tags?.join(', ') || '');
    }
  }, [initialData, setValue]);

  const handleFormSubmit = async (data: CustomerFormData) => {
    setIsLoading(true);
    const baseCustomerData = {
      ...data,
      phone_number: data.phone_number,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t) : [],
    };

    try {
      let result;
      if (initialData) {
        const customerData: CustomerUpdate = baseCustomerData;
        result = await updateCustomer.mutateAsync({ id: initialData.id, data: customerData });
      } else {
        const customerData: CustomerCreate = baseCustomerData;
        result = await createCustomer.mutateAsync(customerData);
      }
      
      if (onSelect) {
        onSelect(result);
      }
      if (onSubmitCallback) {
        onSubmitCallback();
      }
      toast.success(initialData ? 'Cliente actualizado' : 'Cliente creado');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al guardar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        {...register('phone_number')}
        label="Teléfono *"
        placeholder="0999999999"
        error={errors.phone_number?.message}
        helper={phoneNumber ? `${phoneNumber.length}/10 dígitos` : 'Ingresa un número ecuatoriano de 10 dígitos'}
        maxLength={10}
        required
      />
      <Input
        {...register('name')}
        label="Nombre completo"
        placeholder="Juan Pérez"
        error={errors.name?.message}
      />
      <Input
        {...register('identification')}
        label="Cédula / RUC"
        placeholder="1234567890"
        error={errors.identification?.message}
        helper={
          identification
            ? identification.length === 10
              ? 'Formato de cédula detectado'
              : identification.length === 13
                ? 'Formato de RUC detectado'
                : 'La identificación debe tener 10 o 13 dígitos'
            : 'Opcional: cédula o RUC del cliente'
        }
        maxLength={13}
      />
      {identification && identification.length > 0 && (
        <p className="text-xs text-gray-500 -mt-2">
          {identification.length === 10 ? '📄 Formato de cédula detectado' : 
           identification.length === 13 ? '📄 Formato de RUC detectado' : ''}
        </p>
      )}
      <Input
        {...register('email')}
        label="Email"
        type="email"
        placeholder="cliente@ejemplo.com"
        error={errors.email?.message}
      />
      <Input
        {...register('address')}
        label="Dirección"
        placeholder="Av. Principal 123"
        error={errors.address?.message}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          {...register('city')}
          label="Ciudad"
          placeholder="Quito"
          error={errors.city?.message}
        />
        <Input
          {...register('province')}
          label="Provincia"
          placeholder="Pichincha"
          error={errors.province?.message}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notas
        </label>
        <textarea
          {...register('notes')}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder="Información adicional..."
        />
      </div>
      <Input
        {...register('tags')}
        label="Etiquetas (separadas por comas)"
        placeholder="VIP, frecuente, mayorista"
        error={errors.tags?.message}
      />
      
      <div className={`flex ${isModal ? 'justify-end' : 'justify-between'} space-x-3 pt-4`}>
        {onCancel && (
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          loading={isLoading}
        >
          {initialData ? 'Actualizar Cliente' : 'Crear Cliente'}
        </Button>
      </div>
    </form>
  );
};
