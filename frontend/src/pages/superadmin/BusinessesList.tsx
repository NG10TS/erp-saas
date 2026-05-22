import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Power } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useAdmin } from '@/hooks/useAdmin';
import type { Business } from '@/types/permissions';

export const BusinessesList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    businessId?: string;
    action?: 'suspend' | 'activate';
  }>({ open: false });

  const { useBusinesses, useSetBusinessStatus } = useAdmin();

  const { data: businesses = [], isLoading } = useBusinesses({
    skip: (page - 1) * limit,
    limit,
    search: searchTerm,
  });

  const { mutate: setBusinessStatus, isPending } = useSetBusinessStatus();

  const filteredBusinesses = businesses.filter(
    (b) =>
      b.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.ruc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleStatus = (businessId: string, isActive: boolean) => {
    setConfirmDialog({
      open: true,
      businessId,
      action: isActive ? 'suspend' : 'activate',
    });
  };

  const handleConfirmDialog = () => {
    const { businessId, action } = confirmDialog;
    if (!businessId || !action) return;

    const isActive = action === 'activate';
    setBusinessStatus({
      businessId,
      data: {
        is_active: isActive,
        reason: isActive ? undefined : 'Suspendido por super admin',
      },
    });
    setConfirmDialog({ open: false });
  };

  const columns = [
    {
      key: 'business_name' as const,
      label: 'Nombre del negocio',
      sortable: true,
    },
    {
      key: 'ruc' as const,
      label: 'RUC',
      sortable: true,
    },
    {
      key: 'email' as const,
      label: 'Email',
    },
    {
      key: 'subscription_plan' as const,
      label: 'Plan',
      render: (plan: string) => (
        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium capitalize">
          {plan}
        </span>
      ),
    },
    {
      key: 'is_active' as const,
      label: 'Estado',
      render: (isActive: boolean) => (
        <StatusBadge
          status={isActive ? 'active' : 'suspended'}
          size="sm"
        />
      ),
    },
    {
      key: 'created_at' as const,
      label: 'Fecha de registro',
      render: (date: string) => new Date(date).toLocaleDateString('es-ES'),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Negocios</h1>
        <p className="text-slate-600 mt-1">Gestiona todos los negocios en la plataforma</p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar por nombre, RUC o email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
      />

      {/* Table */}
      <DataTable
        data={filteredBusinesses}
        columns={columns}
        loading={isLoading}
        pagination={{
          page,
          limit,
          total: businesses.length,
          onPageChange: setPage,
          onLimitChange: setLimit,
        }}
        actions={(row: Business) => (
          <div className="flex gap-2">
            {/* View Details */}
            <button
              onClick={() => navigate(`/superadmin/businesses/${row.id}`)}
              title="Ver detalles"
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Toggle Status */}
            <button
              onClick={() => handleToggleStatus(row.id, row.is_active)}
              title={row.is_active ? 'Suspender' : 'Activar'}
              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={
          confirmDialog.action === 'suspend'
            ? 'Suspender negocio'
            : 'Activar negocio'
        }
        message={
          confirmDialog.action === 'suspend'
            ? '¿Estás seguro de que deseas suspender este negocio?'
            : '¿Estás seguro de que deseas activar este negocio?'
        }
        confirmText={confirmDialog.action === 'suspend' ? 'Suspender' : 'Activar'}
        variant={confirmDialog.action === 'suspend' ? 'danger' : 'info'}
        loading={isPending}
        onConfirm={handleConfirmDialog}
        onCancel={() => setConfirmDialog({ open: false })}
      />
    </motion.div>
  );
};
