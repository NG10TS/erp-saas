import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAdmin } from '@/hooks/useAdmin';
import type { User } from '@/types/permissions';

export const BusinessDetail: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState('');
  const [planData, setPlanData] = useState({ plan_name: '', days_valid: 30 });

  const {
    useBusinessDetail,
    useBusinessUsers,
    useChangeOwner,
    useAssignSubscription,
  } = useAdmin();

  const { data: business, isLoading: businessLoading } = useBusinessDetail(businessId!);
  const { data: users = [], isLoading: usersLoading } = useBusinessUsers(
    businessId!,
    { skip: (page - 1) * limit, limit }
  );
  const { mutate: changeOwner, isPending: isChangingOwner } = useChangeOwner();
  const { mutate: assignSubscription, isPending: isAssigningSubscription } =
    useAssignSubscription();

  const handleChangeOwner = () => {
    if (!businessId || !newOwnerId) return;
    changeOwner({ businessId, data: { new_owner_id: newOwnerId } });
    setShowOwnerModal(false);
    setNewOwnerId('');
  };

  const handleAssignSubscription = () => {
    if (!businessId || !planData.plan_name) return;
    assignSubscription({
      businessId,
      data: {
        plan_name: planData.plan_name as any,
        days_valid: planData.days_valid,
      },
    });
    setShowSubscriptionModal(false);
    setPlanData({ plan_name: '', days_valid: 30 });
  };

  if (businessLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin text-emerald-600">⏳</div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Negocio no encontrado</p>
        <button
          onClick={() => navigate('/superadmin/businesses')}
          className="mt-4 text-emerald-600 hover:text-emerald-700"
        >
          Volver a negocios
        </button>
      </div>
    );
  }

  const userColumns = [
    { key: 'email' as const, label: 'Email', sortable: true },
    {
      key: 'first_name' as const,
      label: 'Nombre',
      render: (_, row: User) => `${row.first_name} ${row.last_name}`,
    },
    {
      key: 'role' as const,
      label: 'Rol',
      render: (role: string) => (
        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium capitalize">
          {role}
        </span>
      ),
    },
    {
      key: 'is_active' as const,
      label: 'Estado',
      render: (isActive: boolean) => (
        <StatusBadge status={isActive ? 'active' : 'inactive'} size="sm" />
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/superadmin/businesses')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{business.business_name}</h1>
          <p className="text-slate-600 mt-1">RUC: {business.ruc}</p>
        </div>
      </div>

      {/* Business Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status */}
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-slate-600 mb-2">Estado</p>
          <StatusBadge
            status={business.is_active ? 'active' : 'suspended'}
            size="md"
          />
        </div>

        {/* Subscription */}
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-slate-600 mb-2">Plan actual</p>
          <div className="space-y-1">
            <p className="font-semibold capitalize text-slate-900">
              {business.subscription_plan}
            </p>
            <p className="text-xs text-slate-500">
              Hasta: {business.subscription_end_date
                ? new Date(business.subscription_end_date).toLocaleDateString('es-ES')
                : 'Sin fecha'}
            </p>
          </div>
          <button
            onClick={() => setShowSubscriptionModal(true)}
            className="mt-3 w-full px-3 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
          >
            Cambiar plan
          </button>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-slate-600 mb-2">Contacto</p>
          <div className="space-y-1">
            <p className="text-sm text-slate-900">{business.email}</p>
            <p className="text-sm text-slate-900">{business.phone}</p>
          </div>
        </div>
      </div>

      {/* Owner Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900">Propietario</h2>
          <button
            onClick={() => setShowOwnerModal(true)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            Cambiar
          </button>
        </div>
        <p className="text-slate-700">ID: {business.owner_id}</p>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Usuarios del negocio</h2>
        <DataTable
          data={users}
          columns={userColumns}
          loading={usersLoading}
          pagination={{
            page,
            limit,
            total: users.length,
            onPageChange: setPage,
            onLimitChange: setLimit,
          }}
        />
      </div>

      {/* Change Owner Modal */}
      {showOwnerModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowOwnerModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Cambiar propietario
            </h2>
            <select
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg mb-4"
            >
              <option value="">Selecciona un usuario</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} ({user.email})
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setShowOwnerModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangeOwner}
                disabled={isChangingOwner || !newOwnerId}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isChangingOwner ? 'Cambiando...' : 'Cambiar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Assign Subscription Modal */}
      {showSubscriptionModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSubscriptionModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Asignar plan de suscripción
            </h2>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Plan
                </label>
                <select
                  value={planData.plan_name}
                  onChange={(e) =>
                    setPlanData({ ...planData, plan_name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="">Selecciona un plan</option>
                  <option value="Micro">Micro</option>
                  <option value="Startup">Startup</option>
                  <option value="Business">Business</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Días válidos
                </label>
                <input
                  type="number"
                  value={planData.days_valid}
                  onChange={(e) =>
                    setPlanData({
                      ...planData,
                      days_valid: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignSubscription}
                disabled={isAssigningSubscription || !planData.plan_name}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isAssigningSubscription ? 'Asignando...' : 'Asignar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};
