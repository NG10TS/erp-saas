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
  productName?: string;
}

export const StockAdjustmentForm: React.FC<StockAdjustmentFormProps> = ({
  onSubmit,
  isLoading,
  onCancel,
  productName,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<StockFormData>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      cantidad: 0,
      motivo: '',
      notas: '',
    },
  });

  const cantidad = watch('cantidad');
  const isPositive = cantidad > 0;
  const isNegative = cantidad < 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {productName && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-600">Producto: <span className="font-medium text-gray-900">{productName}</span></p>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cantidad *
        </label>
        <Input
          {...register('cantidad', { valueAsNumber: true })}
          type="number"
          placeholder="ej: 10 (entrada) o -5 (salida)"
          error={errors.cantidad?.message}
        />
        {cantidad !== 0 && (
          <p className={`text-xs mt-1 ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'}`}>
            {isPositive ? '✓ Se agregarán unidades al inventario' : isNegative ? '⚠ Se eliminarán unidades del inventario' : ''}
          </p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Motivo *
        </label>
        <select
          {...register('motivo')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Seleccionar motivo</option>
          <option value="Ajuste por inventario físico">Ajuste por inventario físico</option>
          <option value="Devolución de cliente">Devolución de cliente</option>
          <option value="Merma">Merma / Daño</option>
          <option value="Recepción de compra">Recepción de compra</option>
          <option value="Corrección de error">Corrección de error</option>
          <option value="Otro">Otro</option>
        </select>
        {errors.motivo && (
          <p className="mt-1 text-sm text-red-500">{errors.motivo.message}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notas (opcional)
        </label>
        <textarea
          {...register('notas')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder="Información adicional sobre este ajuste..."
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