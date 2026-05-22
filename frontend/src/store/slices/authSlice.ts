import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/services/api/auth';
import { apiClient } from '@/lib/api-client';
import type { Business, RegisterRequest, User } from '@/types/auth';
import toast from 'react-hot-toast';

type ProfileUpdateData = {
  first_name: string;
  last_name: string;
  phone?: string;
};

interface AuthState {
  user: User | null;
  business: Business | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initializeAuth: () => void;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
}

const clearLocalAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('business_id');
  localStorage.removeItem('pending_verification_email');
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      business: null,
      isAuthenticated: false,
      isLoading: false,

      initializeAuth: () => {
        const token = localStorage.getItem('access_token');
        const storedData = localStorage.getItem('auth-storage');

        console.log('🔍 initializeAuth - token:', token ? 'Sí' : 'No');
        console.log('🔍 initializeAuth - storedData:', storedData ? 'Sí' : 'No');

        if (!token || !storedData) {
          clearLocalAuth();
          set({
            user: null,
            business: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        try {
          const parsed = JSON.parse(storedData);
          const { user, business, isAuthenticated } = parsed.state ?? {};

          if (user && business && isAuthenticated) {
            set({
              user,
              business,
              isAuthenticated: true,
              isLoading: false,
            });

            get().refreshBusiness().catch(() => {
              console.warn('Error refreshing business data');
              clearLocalAuth();
              set({
                user: null,
                business: null,
                isAuthenticated: false,
                isLoading: false,
              });
            });
          } else {
            throw new Error('Invalid stored data');
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          clearLocalAuth();
          set({
            user: null,
            business: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      login: async (username: string, password: string) => {
        set({ isLoading: true });

        try {
          const response = await authApi.login({ username, password });

          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          localStorage.setItem('business_id', response.business.id);

          set({
            user: response.user,
            business: response.business,
            isAuthenticated: true,
            isLoading: false,
          });

          toast.success('¡Bienvenido!');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.detail || 'Error al iniciar sesión');
          throw error;
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true });

        try {
          await authApi.register(data);

          localStorage.setItem('pending_verification_email', data.email);

          set({ isLoading: false });
          toast.success('¡Registro exitoso! Revisa tu correo para verificar tu cuenta.', {
            duration: 5000,
          });
        } catch (error: any) {
          set({ isLoading: false });

          const message =
            error.response?.data?.detail ||
            error.message ||
            'Error en el registro';

          toast.error(message);
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // ignore logout API errors
        } finally {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('business_id');
          localStorage.removeItem('auth-storage');

          set({
            user: null,
            business: null,
            isAuthenticated: false,
            isLoading: false,
          });

          toast.success('Sesión cerrada');
        }
      },

      refreshBusiness: async () => {
        const response = await apiClient.get<Business>('/business/me');

        set({ business: response.data });
        localStorage.setItem('business_id', response.data.id);
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true });

        try {
          await authApi.changePassword({
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: newPassword,
          });

          set({ isLoading: false });
          toast.success('Contraseña actualizada correctamente');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.detail || 'Error al cambiar contraseña');
          throw error;
        }
      },

      verifyEmail: async (token: string) => {
        set({ isLoading: true });

        try {
          await authApi.verifyEmail(token);
          localStorage.removeItem('pending_verification_email');
          set({ isLoading: false });
          toast.success('Email verificado correctamente. Ya puedes iniciar sesión.');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.detail || 'Error al verificar email');
          throw error;
        }
      },

      resendVerification: async (email: string) => {
        set({ isLoading: true });

        try {
          await authApi.resendVerification(email);
          set({ isLoading: false });
          toast.success('Email de verificación reenviado. Revisa tu bandeja de entrada.');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.detail || 'Error al reenviar verificación');
          throw error;
        }
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true });

        try {
            await authApi.forgotPassword({ email });
            set({ isLoading: false });
            return { success: true };
        } catch (error: any) {
            set({ isLoading: false });
            const status = error.response?.status;
            const detail = error.response?.data?.detail;
            
            if (status === 404) {
                // Usuario no existe
                return { 
                    success: false, 
                    exists: false,
                    message: detail || 'No existe una cuenta con este email.'
                };
            }
            
            return { 
                success: false, 
                exists: true,
                message: detail || 'Error al procesar la solicitud.'
            };
        }
    },

      resetPassword: async (token: string, newPassword: string) => {
        set({ isLoading: true });

        try {
          await authApi.resetPassword({
            token,
            new_password: newPassword,
            confirm_password: newPassword,
          });

          set({ isLoading: false });
          toast.success('Contraseña restablecida correctamente. Ya puedes iniciar sesión.');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.detail || 'Error al restablecer contraseña');
          throw error;
        }
      },

      updateProfile: async (data: ProfileUpdateData) => {
        const currentUser = get().user;

        if (!currentUser) {
          throw new Error('Usuario no autenticado');
        }

        set({ isLoading: true });

        try {
          const response = await apiClient.put<User>(`/users/${currentUser.id}/profile`, data);

          set({
            user: {
              ...currentUser,
              ...response.data,
            },
            isLoading: false,
          });

          toast.success('Perfil actualizado correctamente');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.response?.data?.detail || 'Error al actualizar perfil');
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      version: 1,
      partialize: (state) => ({
        user: state.user,
        business: state.business,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);