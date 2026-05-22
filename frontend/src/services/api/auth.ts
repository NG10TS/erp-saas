// src/services/api/auth.ts
import { publicApi } from '@/lib/api-client';  // 🔥 Importar desde api-client
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest 
} from '@/types/auth';

export const authApi = {
  // ✅ REGISTRO - Usar publicApi (sin token)
  register: async (data: RegisterRequest): Promise<any> => {
    const response = await publicApi.post('/auth/register', data);
    return response.data;
  },
  
  // ✅ LOGIN - Usar publicApi (sin token)
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await publicApi.post('/auth/login', data);
    return response.data;
  },
  
  // ✅ REFRESH - Usar publicApi (sin token)
  refreshToken: async (refreshToken: string): Promise<{ access_token: string }> => {
    const response = await publicApi.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },
  
  // ✅ FORGOT PASSWORD - Usar publicApi
  forgotPassword: async (data: ForgotPasswordRequest): Promise<{ message: string }> => {
    const response = await publicApi.post('/auth/forgot-password', data);
    return response.data;
  },
  
  // ✅ RESET PASSWORD - Usar publicApi
  resetPassword: async (data: ResetPasswordRequest): Promise<{ message: string }> => {
    const response = await publicApi.post('/auth/reset-password', data);
    return response.data;
  },
  
  // ✅ VERIFY EMAIL - Usar publicApi
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await publicApi.get(`/auth/verify-email?token=${token}`);
    return response.data;
  },
  
  // ✅ RESEND VERIFICATION - Usar publicApi
  resendVerification: async (email: string): Promise<{ message: string }> => {
    const response = await publicApi.post('/auth/resend-verification', { email });
    return response.data;
  },
  
  // 🔒 CAMBIAR CONTRASEÑA - Usar apiClient (requiere token)
  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    const { apiClient } = await import('@/lib/api-client');
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  },
  
  // 🔒 LOGOUT - Usar apiClient (requiere token)
  logout: async (): Promise<void> => {
    try {
      const { apiClient } = await import('@/lib/api-client');
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.warn('Logout error:', error);
    }
  },
};