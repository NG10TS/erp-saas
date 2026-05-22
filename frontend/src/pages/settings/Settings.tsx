import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  BuildingOfficeIcon, 
  DocumentTextIcon, 
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  BellIcon,
  CreditCardIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { businessApi } from '@/services/api/business';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { Loading } from '@/components/common/Loading/Loading';
import { Modal } from '@/components/common/Modal/Modal';
import { useAuthStore } from '@/store/slices/authSlice';
import { formatRUC, formatPhone } from '@/utils/formatters';
import toast from 'react-hot-toast';

type TabType = 'business' | 'sri' | 'whatsapp' | 'profile' | 'security' | 'notifications' | 'billing';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('business');
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState('');
  const queryClient = useQueryClient();
  const { business, user, refreshBusiness } = useAuthStore();

  const { data: businessData, isLoading } = useQuery({
    queryKey: ['business'],
    queryFn: () => businessApi.getMyBusiness(),
    enabled: !business,
  });

  const updateBusiness = useMutation({
    mutationFn: (data: any) => businessApi.updateBusiness(data),
    onSuccess: () => {
      refreshBusiness();
      queryClient.invalidateQueries({ queryKey: ['business'] });
      toast.success('Información actualizada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    },
  });

  const uploadCertificate = useMutation({
  mutationFn: ({ file, password }: { file: File; password: string }) => 
    businessApi.uploadCertificate(file, password),
    onSuccess: () => {
      setShowCertificateModal(false);
      setCertificateFile(null);
      setCertificatePassword('');
      queryClient.invalidateQueries({ queryKey: ['business'] });
      toast.success('Certificado cargado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al cargar certificado');
    },
  });

  const updateWhatsApp = useMutation({
    mutationFn: (data: any) => businessApi.updateWhatsAppConfig(data),
    onSuccess: () => {
      refreshBusiness();
      toast.success('Configuración de WhatsApp actualizada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar WhatsApp');
    },
  });

  const testSriConnection = useMutation({
    mutationFn: () => businessApi.testSriConnection(),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Conexión con SRI exitosa');
      } else {
        toast.error(data.message || 'Error de conexión con SRI');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al probar conexión');
    },
  });

  const currentBusiness = businessData || business;

  const tabs = [
    { id: 'business', label: 'Información del Negocio', icon: BuildingOfficeIcon },
    { id: 'sri', label: 'Facturación Electrónica', icon: DocumentTextIcon },
    { id: 'whatsapp', label: 'WhatsApp Business', icon: ChatBubbleLeftRightIcon },
    { id: 'profile', label: 'Mi Perfil', icon: UserCircleIcon },
    { id: 'security', label: 'Seguridad', icon: ShieldCheckIcon },
    { id: 'notifications', label: 'Notificaciones', icon: BellIcon },
    { id: 'billing', label: 'Facturación', icon: CreditCardIcon },
  ];

  const handleBusinessSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateBusiness.mutate({
      business_name: formData.get('business_name'),
      commercial_name: formData.get('commercial_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
    });
  };

  const handleWhatsAppSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateWhatsApp.mutate({
      whatsapp_business_phone: formData.get('whatsapp_business_phone'),
      whatsapp_business_id: formData.get('whatsapp_business_id'),
      whatsapp_access_token: formData.get('whatsapp_access_token'),
    });
  };

  const handleCertificateUpload = async () => {
    if (!certificateFile) {
      toast.error('Selecciona un archivo de certificado');
      return;
    }
    
    /*const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      uploadCertificate.mutate({
        certificate: base64,
        password: certificatePassword,
      });
    };
    reader.readAsDataURL(certificateFile);*/
    uploadCertificate.mutate({
    file: certificateFile,
    password: certificatePassword,
  });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 mt-1">Gestiona la configuración de tu negocio</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-primary-600' : 'text-gray-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* Business Info Tab */}
            {activeTab === 'business' && currentBusiness && (
              <form onSubmit={handleBusinessSubmit} className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Información del Negocio</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RUC
                    </label>
                    <input
                      type="text"
                      value={formatRUC(currentBusiness.ruc)}
                      disabled
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      name="email"
                      type="email"
                      defaultValue={currentBusiness.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Razón Social
                    </label>
                    <input
                      name="business_name"
                      defaultValue={currentBusiness.business_name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Comercial
                    </label>
                    <input
                      name="commercial_name"
                      defaultValue={currentBusiness.commercial_name || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      name="phone"
                      defaultValue={currentBusiness.phone || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      name="address"
                      defaultValue={currentBusiness.address || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <Button type="submit" loading={updateBusiness.isPending}>
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            )}

            {/* SRI Tab */}
            {activeTab === 'sri' && currentBusiness && (
              <div className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Facturación Electrónica SRI</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ambiente
                    </label>
                    <select
                      defaultValue={currentBusiness.sri_environment}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="test">Pruebas</option>
                      <option value="production">Producción</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Emisor
                    </label>
                    <select
                      defaultValue={currentBusiness.sri_emisor_type}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="01">Persona Natural</option>
                      <option value="02">Sociedad</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Certificado Digital</h3>
                  
                  {currentBusiness.sri_has_digital_certificate ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-800">✅ Certificado cargado</p>
                          {currentBusiness.digital_certificate_expires_at && (
                            <p className="text-xs text-green-600 mt-1">
                              Vence: {new Date(currentBusiness.digital_certificate_expires_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCertificateModal(true)}
                        >
                          Reemplazar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setShowCertificateModal(true)}
                      icon={<DocumentTextIcon className="w-4 h-4" />}
                    >
                      Cargar Certificado Digital
                    </Button>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    onClick={() => testSriConnection.mutate()}
                    loading={testSriConnection.isPending}
                  >
                    Probar Conexión SRI
                  </Button>
                </div>
              </div>
            )}

            {/* WhatsApp Tab */}
            {activeTab === 'whatsapp' && currentBusiness && (
              <form onSubmit={handleWhatsAppSubmit} className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">WhatsApp Business</h2>
                <p className="text-sm text-gray-500">
                  Configura tu número de WhatsApp Business para recibir pedidos y enviar facturas automáticamente.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Teléfono WhatsApp Business
                    </label>
                    <input
                      name="whatsapp_business_phone"
                      defaultValue={currentBusiness.whatsapp_business_phone || ''}
                      placeholder="+593999999999"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Formato internacional: +593999999999</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      WhatsApp Business ID
                    </label>
                    <input
                      name="whatsapp_business_id"
                      defaultValue={currentBusiness.whatsapp_business_id || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Token de Acceso Permanente
                    </label>
                    <input
                      name="whatsapp_access_token"
                      type="password"
                      defaultValue=""
                      placeholder="••••••••••••••••"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Webhook de WhatsApp</h4>
                  <p className="text-xs text-blue-700 mb-2">
                    Configura esta URL en tu aplicación de Meta Developers:
                  </p>
                  <code className="block bg-white p-2 rounded text-xs font-mono break-all">
                    https://tu-dominio.com/api/v1/webhooks/whatsapp
                  </code>
                  <p className="text-xs text-blue-700 mt-2">
                    Token de verificación: <strong>{currentBusiness.whatsapp_webhook_verified ? 'Configurado ✓' : 'Pendiente'}</strong>
                  </p>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <Button type="submit" loading={updateWhatsApp.isPending}>
                    Guardar Configuración
                  </Button>
                </div>
              </form>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && user && (
              <div className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Mi Perfil</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={user.first_name}
                      disabled
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={user.last_name}
                      disabled
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={formatPhone(user.phone || '')}
                      disabled
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rol
                    </label>
                    <input
                      type="text"
                      value={user.role === 'owner' ? 'Dueño' : user.role === 'admin' ? 'Administrador' : user.role}
                      disabled
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado de Verificación
                    </label>
                    <input
                      type="text"
                      value={user.is_verified ? 'Verificado' : 'Pendiente'}
                      disabled
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Seguridad</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña Actual
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Autenticación de Dos Factores (2FA)</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-700">Autenticación en dos pasos</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Añade una capa extra de seguridad a tu cuenta
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Configurar
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <Button variant="primary">
                    Cambiar Contraseña
                  </Button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">Notificaciones por Email</p>
                      <p className="text-sm text-gray-500">Recibe resúmenes de ventas y alertas</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">Alertas de Stock Bajo</p>
                      <p className="text-sm text-gray-500">Notificación cuando un producto está por agotarse</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">Resumen Diario de Ventas</p>
                      <p className="text-sm text-gray-500">Recibe un resumen al final del día</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-gray-900">Facturas Autorizadas</p>
                      <p className="text-sm text-gray-500">Notificación cuando una factura es autorizada por el SRI</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && currentBusiness && (
              <div className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Facturación y Suscripción</h2>
                
                <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Plan Actual</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {currentBusiness.subscription_plan === 'free' ? 'Gratuito' : 
                         currentBusiness.subscription_plan === 'basic' ? 'Básico' :
                         currentBusiness.subscription_plan === 'pro' ? 'Pro' : 'Empresarial'}
                      </p>
                    </div>
                    <Button variant="outline">
                      Cambiar Plan
                    </Button>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Productos</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {currentBusiness.current_products} / {currentBusiness.max_products}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Usuarios</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {currentBusiness.current_users} / {currentBusiness.max_users}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Facturas este mes</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {currentBusiness.current_invoices_month} / {currentBusiness.max_invoices_monthly}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Almacenamiento</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {currentBusiness.current_storage_mb} / {currentBusiness.max_storage_mb} MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Historial de Facturas</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">Factura #INV-2024-001</p>
                        <p className="text-xs text-gray-500">15 de enero, 2024</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-900">$29.00</span>
                        <button className="text-primary-600 hover:text-primary-700 text-sm">
                          Descargar
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">Factura #INV-2024-002</p>
                        <p className="text-xs text-gray-500">15 de febrero, 2024</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-900">$29.00</span>
                        <button className="text-primary-600 hover:text-primary-700 text-sm">
                          Descargar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <Button variant="outline">
                    Ver Historial Completo
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Certificate Upload Modal */}
      <Modal
        isOpen={showCertificateModal}
        onClose={() => {
          setShowCertificateModal(false);
          setCertificateFile(null);
          setCertificatePassword('');
        }}
        title="Cargar Certificado Digital"
        description="Selecciona el archivo .p12 de tu firma electrónica"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Archivo .p12
            </label>
            <input
              type="file"
              accept=".p12,.pfx"
              onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña del Certificado
            </label>
            <input
              type="password"
              value={certificatePassword}
              onChange={(e) => setCertificatePassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="••••••••"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCertificateModal(false);
                setCertificateFile(null);
                setCertificatePassword('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCertificateUpload}
              loading={uploadCertificate.isPending}
              disabled={!certificateFile}
            >
              Cargar Certificado
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};