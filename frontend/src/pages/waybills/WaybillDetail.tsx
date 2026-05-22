import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  TruckIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  UserCircleIcon,
  MapPinIcon,
  CalendarDaysIcon,
  IdentificationIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentTextIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { waybillsApi } from '@/services/api/waybills';
import { Button } from '@/components/common/Button/Button';
import { Loading } from '@/components/common/Loading/Loading';
import { formatDateTime } from '@/utils/formatters';

// ─── Animaciones ───────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

// ─── Status Badge ──────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    authorized: { label: 'Autorizada', color: 'text-emerald-700', bgColor: 'bg-emerald-50', icon: <CheckCircleIcon className="w-5 h-5" /> },
    rejected: { label: 'Rechazada', color: 'text-red-700', bgColor: 'bg-red-50', icon: <XCircleIcon className="w-5 h-5" /> },
    pending: { label: 'Pendiente', color: 'text-amber-700', bgColor: 'bg-amber-50', icon: <ClockIcon className="w-5 h-5 animate-pulse" /> },
    draft: { label: 'Borrador', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: <DocumentTextIcon className="w-5 h-5" /> },
  };
  const config = configs[status] || configs.draft;
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}>
      {config.icon} {config.label}
    </span>
  );
};

// ─── Info Card ──────────────────────────────────────────────
const InfoCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">{icon}</div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
    </div>
    {children}
  </motion.div>
);

export const WaybillDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [showXml, setShowXml] = useState(false);

  const { data: waybill, isLoading } = useQuery({
    queryKey: ['waybill', id],
    queryFn: () => waybillsApi.getWaybill(id!),
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity }}>
        <TruckIcon className="w-12 h-12 text-blue-400" />
      </motion.div>
    </div>
  );

  if (!waybill) return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="text-xl font-semibold mb-2">Guía no encontrada</h2>
      <Link to="/app/waybills"><Button icon={<ArrowLeftIcon className="w-4 h-4" />}>Volver</Button></Link>
    </div>
  );

  return (
    <motion.div className="space-y-6" variants={staggerContainer} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/app/waybills" className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <TruckIcon className="w-6 h-6 text-blue-600" />
              </span>
              Guía #{waybill.sequential}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5 ml-13">
              {waybill.fecha_inicio ? formatDateTime(waybill.fecha_inicio) : ''}
            </p>
          </div>
        </div>
        <StatusBadge status={waybill.sri_status} />
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Datos de Traslado */}
          <InfoCard title="Datos de Traslado" icon={<MapPinIcon className="w-5 h-5 text-blue-600" />}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Motivo:</span><p className="font-medium">{waybill.motivo_traslado}</p></div>
              <div><span className="text-gray-500">Tipo Guía:</span><p className="font-medium">{waybill.tipo_guia}</p></div>
              <div className="col-span-2"><span className="text-gray-500">Partida:</span><p className="font-medium">{waybill.direccion_partida || '-'}</p></div>
              <div className="col-span-2"><span className="text-gray-500">Destino:</span><p className="font-medium">{waybill.direccion_destino || '-'}</p></div>
              {waybill.ruta && <div className="col-span-2"><span className="text-gray-500">Ruta:</span><p className="font-medium">{waybill.ruta}</p></div>}
            </div>
          </InfoCard>

          {/* Productos */}
          <InfoCard title="Productos" icon={<SparklesIcon className="w-5 h-5 text-blue-600" />}>
            <div className="space-y-2">
              {waybill.details?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center bg-gray-50 rounded-xl p-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{item.product_name}</p>
                    {item.product_sku && <p className="text-xs text-gray-400">SKU: {item.product_sku}</p>}
                  </div>
                  <span className="text-sm font-semibold">Cant: {item.quantity}</span>
                </div>
              ))}
            </div>
          </InfoCard>

          {/* Transporte */}
          <InfoCard title="Transporte" icon={<TruckIcon className="w-5 h-5 text-blue-600" />}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Tipo:</span><p className="font-medium">{waybill.tipo_transporte === '01' ? 'Propio' : 'Contratado'}</p></div>
              <div><span className="text-gray-500">Placa:</span><p className="font-medium">{waybill.placa || '-'}</p></div>
              <div><span className="text-gray-500">Transportista:</span><p className="font-medium">{waybill.transportista_nombre || '-'}</p></div>
              <div><span className="text-gray-500">RUC:</span><p className="font-medium">{waybill.transportista_ruc || '-'}</p></div>
            </div>
          </InfoCard>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Destinatario */}
          <InfoCard title="Destinatario" icon={<UserCircleIcon className="w-5 h-5 text-blue-600" />}>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-gray-900">{waybill.destinatario_name || 'N/A'}</p>
              {waybill.destinatario_identification && (
                <div className="flex items-center gap-2 text-gray-500"><IdentificationIcon className="w-4 h-4" />{waybill.destinatario_identification}</div>
              )}
              {waybill.destinatario_phone && (
                <div className="flex items-center gap-2 text-gray-500"><PhoneIcon className="w-4 h-4" />{waybill.destinatario_phone}</div>
              )}
              {waybill.destinatario_email && (
                <div className="flex items-center gap-2 text-gray-500"><EnvelopeIcon className="w-4 h-4" />{waybill.destinatario_email}</div>
              )}
              {waybill.destinatario_address && (
                <div className="flex items-start gap-2 text-gray-500"><MapPinIcon className="w-4 h-4 mt-0.5" />{waybill.destinatario_address}</div>
              )}
            </div>
          </InfoCard>

          {/* Fechas */}
          <InfoCard title="Fechas" icon={<CalendarDaysIcon className="w-5 h-5 text-blue-600" />}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Inicio:</span><span className="font-medium">{waybill.fecha_inicio ? formatDateTime(waybill.fecha_inicio) : '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Fin:</span><span className="font-medium">{waybill.fecha_fin ? formatDateTime(waybill.fecha_fin) : '-'}</span></div>
              {waybill.authorization_date && <div className="flex justify-between"><span className="text-gray-500">Autorización:</span><span className="font-medium">{formatDateTime(waybill.authorization_date)}</span></div>}
            </div>
          </InfoCard>
        </div>
      </div>

      {/* XML */}
      {waybill.xml_signed && (
        <motion.div variants={fadeInUp}>
          <InfoCard title="XML Firmado" icon={<DocumentTextIcon className="w-5 h-5 text-blue-600" />}>
            <button onClick={() => setShowXml(!showXml)} className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-3">
              {showXml ? 'Ocultar XML' : 'Ver XML'}
            </button>
            {showXml && (
              <motion.pre initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-50 rounded-xl p-4 overflow-x-auto text-xs max-h-96 overflow-y-auto">
                {waybill.xml_signed}
              </motion.pre>
            )}
          </InfoCard>
        </motion.div>
      )}
    </motion.div>
  );
};