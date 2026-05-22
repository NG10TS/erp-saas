import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftIcon, CameraIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/slices/authSlice';


import { useUpdateProfile } from '@/hooks/useAuth';

import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { formatPhone } from '@/utils/formatters';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  first_name: z.string().min(2, 'Mínimo 2 caracteres'),
  last_name: z.string().min(2, 'Mínimo 2 caracteres'),
  phone: z.string().min(10, 'Teléfono inválido').optional(),
  email: z.string().email('Email inválido').readonly(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const Profile: React.FC = () => {
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync({
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
      });
      toast.success('Perfil actualizado');
    } catch (error) {
      toast.error('Error al actualizar perfil');
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center space-x-4 mb-6">
        <Link to="/app/settings" className="p-2 text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Avatar Section */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary-100 to-primary-200 flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserCircleIcon className="w-16 h-16 text-primary-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-1 bg-primary-600 rounded-full cursor-pointer hover:bg-primary-700 transition-colors">
                <CameraIcon className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {user?.first_name} {user?.last_name}
              </h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                Miembro desde {new Date(user?.created_at || '').toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              {...register('first_name')}
              label="Nombre"
              error={errors.first_name?.message}
            />
            <Input
              {...register('last_name')}
              label="Apellido"
              error={errors.last_name?.message}
            />
            <Input
              {...register('email')}
              label="Correo Electrónico"
              disabled
              className="bg-gray-50"
            />
            <Input
              {...register('phone')}
              label="Teléfono"
              placeholder="0999999999"
              error={errors.phone?.message}
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button type="submit" loading={updateProfile.isPending}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
