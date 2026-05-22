import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon,
  ShoppingBagIcon,
  CalendarIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { customersApi } from '@/services/api/customers';
import { salesApi } from '@/services/api/sales';
import { Button } from '@/components/common/Button/Button';
import { Loading } from '@/components/common/Loading/Loading';
import { Modal } from '@/components/common/Modal/Modal';
import { formatCurrency, formatDate, formatDateTime, formatPhone } from '@/utils/formatters';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { useBlockCustomer, useUnblockCustomer, useDeleteCustomer } from '@/hooks/useCustomers';
import toast from 'react-hot-toast';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getCustomer(id!),
    enabled: !!id,
  });

  const { data: purchases, isLoading: isLoadingPurchases } = useQuery({
    queryKey: ['customer-purchases', id],
    queryFn: () => customersApi.getCustomerPurchases(id!),
    enabled: !!id,
  });

  const blockCustomer = useBlockCustomer();
  const unblockCustomer = useUnblockCustomer();
  const deleteCustomer = useDeleteCustomer();

  const handleUpdate = () => {
    setShowEditModal(false);
    queryClient.invalidateQueries({ queryKey: ['customer', id] });
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    toast.success('Cliente actualizado exitosamente');
  };

  const handleBlock = async () => {
    await blockCustomer.mutateAsync({ id: id!, reason: blockReason });
    setShowBlockModal(false);
    queryClient.invalidateQueries({ queryKey: ['customer', id] });
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    toast.success('Cliente bloqueado');
  };

  const handleUnblock = async () => {
    await unblockCustomer.mutateAsync(id!);
    queryClient.invalidateQueries({ queryKey: ['customer', id] });
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    toast.success('Cliente desbloqueado');
  };

  const handleDelete = async () => {
    await deleteCustomer.mutateAsync(id!);
    navigate('/app/customers');
    toast.success('Cliente eliminado');
  };

  // Función para mostrar el estado del cliente
  const getCustomerStatusBadge = () => {
    if (customer?.is_blocked) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
          <XCircleIcon className="w-3.5 h-3.5" />
          Bloqueado
        </span>
      );
    }
    if (customer?.is_active === false) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
          Inactivo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
        <CheckCircleIcon className="w-3.5 h-3.5" />
        Activo
      </span>
    );
  };

  if (isLoadingCustomer) {
    return (
      <div className="flex justify-center py-12">
        <Loading />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cliente no encontrado</p>
        <Link to="/app/customers" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
          Volver a clientes
        </Link>
      </div>
    );
  }

  const isBlocked = customer.is_blocked;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/app/customers" className="p-2 text-gray-400 hover:text-gray-600">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name || 'Cliente sin nombre'}</h1>
            <div className="flex items-center gap-3 mt-1">
              {getCustomerStatusBadge()}
              <p className="text-gray-500">Cliente desde {formatDate(customer.created_at)}</p>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            icon={<PencilIcon className="w-4 h-4" />}
            onClick={() => setShowEditModal(true)}
          >
            Editar
          </Button>
          {isBlocked ? (
            <Button
              variant="success"
              icon={<CheckCircleIcon className="w-4 h-4" />}
              onClick={handleUnblock}
              loading={unblockCustomer.isPending}
            >
              Desbloquear
            </Button>
          ) : (
            <Button
              variant="danger"
              icon={<XCircleIcon className="w-4 h-4" />}
              onClick={() => setShowBlockModal(true)}
            >
              Bloquear
            </Button>
          )}
          <Button
            variant="danger"
            icon={<TrashIcon className="w-4 h-4" />}
            onClick={() => setShowDeleteModal(true)}
          >
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserCircleIcon className="w-5 h-5 mr-2 text-gray-400" />
              Información de Contacto
            </h2>
            <div className="space-y-3">
              <div className="flex items-center text-gray-600">
                <PhoneIcon className="w-4 h-4 mr-3 text-gray-400" />
                <span>{formatPhone(customer.phone_number)}</span>
              </div>
              {customer.email && (
                <div className="flex items-center text-gray-600">
                  <EnvelopeIcon className="w-4 h-4 mr-3 text-gray-400" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start text-gray-600">
                  <MapPinIcon className="w-4 h-4 mr-3 text-gray-400 mt-0.5" />
                  <span>{customer.address}</span>
                </div>
              )}
              {customer.identification && (
                <div className="flex items-center text-gray-600 pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500 mr-2">
                    {customer.identification.length === 10 ? 'Cédula:' : 'RUC:'}
                  </span>
                  <span className="font-mono text-sm">{customer.identification}</span>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total compras</span>
                <span className="text-2xl font-bold text-gray-900">{customer.total_purchases}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total gastado</span>
                <span className="text-xl font-semibold text-primary-600">
                  {formatCurrency(customer.total_spent)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Ticket promedio</span>
                <span className="text-gray-700">{formatCurrency(customer.average_purchase)}</span>
              </div>
              {customer.first_purchase_date && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Primera compra</span>
                  <span className="text-gray-600">{formatDate(customer.first_purchase_date)}</span>
                </div>
              )}
              {customer.last_purchase_date && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Última compra</span>
                  <span className="text-gray-600">{formatDate(customer.last_purchase_date)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Notas</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}

          {/* Tags */}
          {customer.tags && customer.tags.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Etiquetas</h2>
              <div className="flex flex-wrap gap-2">
                {customer.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Purchase History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <ShoppingBagIcon className="w-5 h-5 mr-2 text-gray-400" />
                Historial de Compras
              </h2>
            </div>
            {isLoadingPurchases ? (
              <div className="flex justify-center py-12">
                <Loading />
              </div>
            ) : purchases && purchases.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        N° Venta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pago
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchases.map((sale: any) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sale.numero_venta}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(sale.fecha_venta)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(sale.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            sale.estado === 'completed' ? 'bg-green-100 text-green-800' :
                            sale.estado === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {sale.estado === 'completed' ? 'Completada' :
                             sale.estado === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={sale.estado_pago === 'paid' ? 'text-green-600' : 'text-yellow-600'}>
                            {sale.estado_pago === 'paid' ? 'Pagado' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/app/sales/${sale.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Ver
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <ShoppingBagIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">Este cliente no tiene compras registradas</p>
                <p className="text-sm text-gray-400 mb-4">Registra su primera venta para comenzar</p>
                <Link
                  to="/app/sales/new"
                  state={{ preselectedCustomer: customer }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Registrar primera venta
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Cliente"
      >
        <CustomerForm
          initialData={customer}
          onSubmit={handleUpdate}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* Block Modal */}
      <Modal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        title="Bloquear Cliente"
        description="El cliente no podrá realizar compras mientras esté bloqueado"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo del bloqueo
            </label>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="ej: Impago, Comportamiento inapropiado, etc."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowBlockModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleBlock}
              loading={blockCustomer.isPending}
              disabled={!blockReason.trim()}
            >
              Bloquear Cliente
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Cliente"
        description={`¿Estás seguro de que deseas eliminar a "${customer.name || 'este cliente'}"? Esta acción no se puede deshacer.`}
      >
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={deleteCustomer.isPending}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
};