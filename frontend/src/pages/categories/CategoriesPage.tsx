import React, { useState } from 'react';
import { useCategories, useDeleteCategory } from '@/hooks/useCategories';
import { Button } from '@/components/common/Button/Button';
import { Modal } from '@/components/common/Modal/Modal';
import { CategoryForm } from './CategoryForm';

export const Categories: React.FC = () => {
  const { data: categories, isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const handleEdit = (cat: any) => {
    setSelected(cat);
    setOpen(true);
  };

  const handleCreate = () => {
    setSelected(null);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <Button onClick={handleCreate}>Nueva Categoría</Button>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        {isLoading ? (
          <p>Cargando...</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories?.map((cat: any) => (
                <tr key={cat.id}>
                  <td>{cat.name}</td>
                  <td className="space-x-2">
                    <Button onClick={() => handleEdit(cat)}>Editar</Button>
                    <Button
                      variant="outline"
                      onClick={() => deleteCategory.mutate(cat.id)}
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={selected ? 'Editar Categoría' : 'Nueva Categoría'}
      >
        <CategoryForm
          category={selected}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </div>
  );
};