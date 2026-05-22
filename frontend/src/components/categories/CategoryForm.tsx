import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { XMarkIcon } from '@heroicons/react/24/outline';

const categorySchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .max(50, 'Máximo 50 caracteres'),
  description: z.string()
    .max(200, 'Máximo 200 caracteres')
    .optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  defaultValues?: CategoryFormData;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  defaultValues,
  onSubmit,
  isLoading,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: defaultValues || { name: '', description: '' },
  });

  const handleCancel = () => {
    reset();
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        {...register('name')}
        label="Nombre de la categoría"
        placeholder="Ej: Electrónicos, Ropa, Alimentos..."
        error={errors.name?.message}
        autoFocus
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
          placeholder="Describe brevemente esta categoría..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          loading={isLoading}
          disabled={isLoading}
        >
          {defaultValues ? 'Actualizar' : 'Crear categoría'}
        </Button>
      </div>
    </form>
  );
};