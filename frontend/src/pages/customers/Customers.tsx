import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  PlusIcon, MagnifyingGlassIcon, FunnelIcon, 
  UserIcon, EnvelopeIcon, PhoneIcon, 
  XCircleIcon, CheckCircleIcon, UsersIcon 
} from '@heroicons/react/24/outline';
import { customersApi } from '@/services/api/customers';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { CardGridSkeleton } from '@/components/common/Skeleton/Skeleton';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { Modal } from '@/components/common/Modal/Modal';
import { formatCurrency, formatDate, formatPhone } from '@/utils/formatters';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { useToast } from '@/hooks/useToast';

type CustomerStatus = 'all' | 'active' | 'inactive' | 'blocked';

export const Customers: React.FC = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    hasPurchases: false,
    status: 'all' as CustomerStatus,
    minSpent: '',
    dateFrom: '',
    dateTo: '',
  });

  const { data: customers, isLoading, refetch } = useQuery({
    queryKey: ['customers', search, filters],
    queryFn: async () => {
      console.log('🔍 Iniciando fetch de clientes...');
      try {
        const result = await customersApi.getCustomers({
          search: search || undefined,
          skip: 0,
          limit: 100,
        });
        console.log('✅ Clientes recibidos:', result?.length);
        return result;
      } catch (error) {
        console.error('❌ Error en fetch:', error);
        throw error;
      }
    },
  });

  // ✅ FILTRO PROFESIONAL
  const filteredCustomers = customers?.filter(customer => {
    // 1. Filtro por búsqueda (ya lo hace el backend, pero refuerzo)
    if (search && !customer.name?.toLowerCase().includes(search.toLowerCase()) &&
        !customer.phone_number?.includes(search) &&
        !customer.identification?.includes(search)) {
      return false;
    }

    // 2. Filtro por compras
    if (filters.hasPurchases && customer.total_purchases === 0) return false;

    // 3. Filtro por estado (profesional)
    switch (filters.status) {
      case 'active':
        if (!customer.is_active) return false;
        break;
      case 'inactive':
        if (customer.is_active !== false) return false;
        break;
      case 'blocked':
        if (!customer.is_blocked) return false;
        break;
      case 'all':
      default:
        // No filtrar por estado
        break;
    }

    // 4. Filtro por monto mínimo gastado
    if (filters.minSpent && customer.total_spent < parseFloat(filters.minSpent)) {
      return false;
    }

    // 5. Filtro por fecha de registro
    if (filters.dateFrom) {
      const customerDate = new Date(customer.created_at);
      const fromDate = new Date(filters.dateFrom);
      if (customerDate < fromDate) return false;
    }
    
    if (filters.dateTo) {
      const customerDate = new Date(customer.created_at);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59);
      if (customerDate > toDate) return false;
    }

    return true;
  });

  // Estadísticas para mostrar en el header
  const stats = {
    total: customers?.length || 0,
    active: customers?.filter(c => c.is_active).length || 0,
    blocked: customers?.filter(c => c.is_blocked).length || 0,
    withPurchases: customers?.filter(c => c.total_purchases > 0).length || 0,
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  const handleCustomerCreated = () => {
    setShowCreateModal(false);
    refetch();
    toast.success('Cliente creado exitosamente');
  };

  const clearFilters = () => {
    setFilters({
      hasPurchases: false,
      status: 'all',
      minSpent: '',
      dateFrom: '',
      dateTo: '',
    });
    setSearch('');
  };

  const getStatusBadge = (customer: any) => {
    if (customer.is_blocked) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
          <XCircleIcon className="w-3 h-3" /> Bloqueado
        </span>
      );
    }
    if (customer.is_active) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
          <CheckCircleIcon className="w-3 h-3" /> Activo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
        Inactivo
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 mt-1">Gestiona tu cartera de clientes</p>
        </div>
        <div className="flex gap-3">
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-xs text-gray-500">Activos</p>
              <p className="font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-xs text-gray-500">Bloqueados</p>
              <p className="font-bold text-red-600">{stats.blocked}</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-xs text-gray-500">Con compras</p>
              <p className="font-bold text-primary-600">{stats.withPurchases}</p>
            </div>
          </div>
          <Button
            icon={<PlusIcon className="w-5 h-5" />}
            onClick={() => setShowCreateModal(true)}
          >
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre, teléfono, email o identificación..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            icon={<FunnelIcon className="w-5 h-5" />}
          >
            Filtros {Object.values(filters).some(v => v && v !== 'all') && 
              <span className="ml-1 w-2 h-2 bg-primary-500 rounded-full" />
            }
          </Button>
          {(search || filters.status !== 'all' || filters.hasPurchases || filters.minSpent || filters.dateFrom || filters.dateTo) && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="text-gray-500"
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-gray-100"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Estado del cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as CustomerStatus })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Todos los clientes</option>
                  <option value="active">Solo activos</option>
                  <option value="inactive">Solo inactivos</option>
                  <option value="blocked">Solo bloqueados</option>
                </select>
              </div>

              {/* Monto mínimo gastado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto mínimo gastado
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={filters.minSpent}
                    onChange={(e) => setFilters({ ...filters, minSpent: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Fecha desde */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registrado desde
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Fecha hasta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registrado hasta
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Checkbox adicional */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.hasPurchases}
                  onChange={(e) => setFilters({ ...filters, hasPurchases: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  <UsersIcon className="w-4 h-4 inline mr-1" />
                  Solo clientes con al menos una compra
                </span>
              </label>
            </div>
          </motion.div>
        )}
      </div>

      {/* Customers Grid */}
      {isLoading ? (
        <CardGridSkeleton cards={6} />
      ) : filteredCustomers && filteredCustomers.length > 0 ? (
        <>
          <div className="text-sm text-gray-500">
            Mostrando {filteredCustomers.length} de {customers?.length || 0} clientes
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden"
              >
                <Link to={`/customers/${customer.id}`} className="block">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          customer.is_blocked ? 'bg-red-100' : 
                          customer.is_active ? 'bg-gradient-to-br from-primary-100 to-primary-200' : 
                          'bg-gray-100'
                        }`}>
                          <UserIcon className={`w-6 h-6 ${
                            customer.is_blocked ? 'text-red-600' : 
                            customer.is_active ? 'text-primary-600' : 
                            'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {customer.name || 'Cliente sin nombre'}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <PhoneIcon className="w-3 h-3 mr-1" />
                            {formatPhone(customer.phone_number)}
                          </div>
                          {customer.email && (
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <EnvelopeIcon className="w-3 h-3 mr-1" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(customer)}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Compras:</span>
                        <span className="font-medium text-gray-900">{customer.total_purchases}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-gray-500">Total gastado:</span>
                        <span className="font-medium text-primary-600">
                          {formatCurrency(customer.total_spent)}
                        </span>
                      </div>
                      {customer.last_purchase_date && (
                        <div className="flex justify-between text-sm mt-2">
                          <span className="text-gray-500">Última compra:</span>
                          <span className="text-gray-600">{formatDate(customer.last_purchase_date)}</span>
                        </div>
                      )}
                    </div>

                    {customer.identification && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                          {customer.identification.length === 10 ? 'Cédula' : 'RUC'}: {customer.identification}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title={search || filters.status !== 'all' || filters.hasPurchases ? "No hay clientes que coincidan con los filtros" : "No hay clientes"}
          description={search || filters.status !== 'all' || filters.hasPurchases ? 
            "Prueba con otros criterios de búsqueda o limpia los filtros" : 
            "Comienza agregando tus primeros clientes"}
          action={{
            label: search || filters.status !== 'all' || filters.hasPurchases ? "Limpiar filtros" : "Agregar Cliente",
            onClick: search || filters.status !== 'all' || filters.hasPurchases ? clearFilters : () => setShowCreateModal(true)
          }}
          icon={<div className="text-4xl">👥</div>}
        />
      )}

      {/* Create Customer Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nuevo Cliente"
        description="Ingresa los datos del cliente"
        size="lg"
      >
        <CustomerForm
          onSubmit={handleCustomerCreated}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  );
};
