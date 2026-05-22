import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';

const stockSchema = z.object({
  cantidad: z.number().int().min(-999999).max(999999, 'Cantidad inválida'),
  motivo: z.string().min(3, 'Motivo requerido'),
  notas: z.string().optional(),
});

type StockFormData = z.infer<typeof stockSchema>;

interface StockAdjustmentFormProps {
  onSubmit: (data: StockFormData) => void;
  isLoading?: boolean;
  onCancel: () => void;
}

export const StockAdjustmentForm: React.FC<StockAdjustmentFormProps> = ({
  onSubmit,
  isLoading,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StockFormData>({
    resolver: zodResolver(stockSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...register('cantidad', { valueAsNumber: true })}
        label="Cantidad (positiva para entrada, negativa para salida)"
        type="number"
        placeholder="ej: 10 o -5"
        error={errors.cantidad?.message}
      />
      <Input
        {...register('motivo')}
        label="Motivo"
        placeholder="ej: Ajuste por inventario, Devolución, etc."
        error={errors.motivo?.message}
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notas (opcional)
        </label>
        <textarea
          {...register('notas')}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button type="submit" loading={isLoading}>
          Aplicar Cambio
        </Button>
      </div>
    </form>
  );
};