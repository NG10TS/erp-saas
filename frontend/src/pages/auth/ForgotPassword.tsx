import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/slices/authSlice';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const forgotSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { forgotPassword, isLoading } = useAuthStore();
  const [submitted, setSubmitted] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    const result = await forgotPassword(data.email);
    
    if (result.success) {
      setSubmitted(true);
    } else if (result.exists === false) {
      toast.error('No existe una cuenta con este email. ¿Quieres registrarte?');
      setTimeout(() => navigate('/register'), 2000);
    } else {
      toast.error('Error al procesar. Intenta nuevamente.');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <EnvelopeIcon className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Revisa tu correo</h2>
          <p className="text-gray-500 mb-6">
            Te hemos enviado un enlace para restablecer tu contraseña.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
          >
            Volver al inicio de sesión
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
          <h1 className="text-2xl font-bold text-gray-900">¿Olvidaste tu contraseña?</h1>
          <p className="text-gray-500 mt-2">
            Ingresa tu email y te enviaremos un enlace para restablecerla
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              {...register('email')}
              label="Email"
              type="email"
              placeholder="tu@email.com"
              error={errors.email?.message}
              icon={<EnvelopeIcon className="w-5 h-5" />}
            />

            <Button type="submit" loading={isLoading} fullWidth>
              Enviar enlace de recuperación
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700 block">
              Volver al inicio de sesión
            </Link>
            <Link to="/register" className="text-xs text-gray-400 hover:text-gray-600 block">
              ¿No tienes cuenta? Regístrate
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};