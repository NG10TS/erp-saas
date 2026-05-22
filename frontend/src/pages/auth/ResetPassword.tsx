import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/slices/authSlice';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { EyeIcon, EyeSlashIcon, KeyIcon } from '@heroicons/react/24/outline';

const resetSchema = z.object({
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
});

type ResetFormData = z.infer<typeof resetSchema>;

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormData) => {
    if (!token) return;
    await resetPassword(token, data.password);
    setSubmitted(true);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Enlace inválido</h2>
          <p className="text-gray-500 mb-6">
            El enlace de recuperación es inválido o ha expirado.
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700"
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyIcon className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Contraseña actualizada</h2>
          <p className="text-gray-500 mb-6">
            Tu contraseña ha sido restablecida correctamente.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700"
          >
            Iniciar sesión
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl shadow-lg mb-4">
            <span className="text-white text-2xl font-bold">E</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva contraseña</h1>
          <p className="text-gray-500 mt-2">Ingresa tu nueva contraseña</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5 text-gray-400" /> : <EyeIcon className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Input
              {...register('confirm_password')}
              label="Confirmar contraseña"
              type={showPassword ? 'text' : 'password'}
              error={errors.confirm_password?.message}
            />

            <Button type="submit" loading={isLoading} fullWidth>
              Restablecer contraseña
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700">
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};