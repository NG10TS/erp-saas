import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, CategoryCreate, CategoryUpdate } from '@/services/api/categories';
import { toast } from '@/components/common/Toast/Toast';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoryCreate) => categoriesApi.createCategory(data),
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(`Categoría "${newCategory.name}" creada exitosamente`);
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryUpdate }) =>
      categoriesApi.updateCategory(id, data),
    onSuccess: (updatedCategory) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(`Categoría "${updatedCategory.name}" actualizada`);
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoría eliminada exitosamente');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};