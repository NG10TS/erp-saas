import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

type StatusType = 'active' | 'inactive' | 'suspended' | 'pending';
type Size = 'sm' | 'md' | 'lg';

interface StatusBadgeProps {
  status: StatusType;
  size?: Size;
  className?: string;
}

const statusConfig: Record<StatusType, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  active: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    icon: <CheckCircle className="w-4 h-4" />,
    label: 'Activo',
  },
  inactive: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    icon: <XCircle className="w-4 h-4" />,
    label: 'Inactivo',
  },
  suspended: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: <AlertCircle className="w-4 h-4" />,
    label: 'Suspendido',
  },
  pending: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    icon: <Clock className="w-4 h-4" />,
    label: 'Pendiente',
  },
};

const sizeConfig: Record<Size, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const config = statusConfig[status];
  const sizeClass = sizeConfig[size];

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full font-medium ${config.bg} ${config.text} ${sizeClass} ${className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
};
