import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/services/api/users';
import { useAuthStore } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user, refreshBusiness } = useAuthStore();
  
  return useMutation({
    mutationFn: (data: { first_name: string; last_name: string; phone?: string }) =>
      usersApi.updateProfile(user!.id, data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['user', user!.id] });
      refreshBusiness();
      toast.success('Perfil actualizado');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });
};