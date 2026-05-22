import React from 'react';
import { useForm } from 'react-hook-form';
import {
  useCreateCategory,
  useUpdateCategory,
} from '@/hooks/useCategories';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';

export const CategoryForm = ({ category, onClose }: any) => {
  const { register, handleSubmit } = useForm({
    defaultValues: category || {},
  });

  const create = useCreateCategory();
  const update = useUpdateCategory();

  const onSubmit = async (data: any) => {
    if (category) {
      await update.mutateAsync({ id: category.id, data });
    } else {
      await create.mutateAsync(data);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input {...register('name')} label="Nombre" />

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          Guardar
        </Button>
      </div>
    </form>
  );
};