import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';

const actions = [
  {
    name: 'Nueva Venta',
    href: '/app/sales/new',
    icon: ShoppingCartIcon,
    color: 'primary',
    bgColor: 'bg-primary-100',
    textColor: 'text-primary-700',
  },
  {
    name: 'Nuevo Producto',
    href: '/app/products/new',
    icon: CubeIcon,
    color: 'secondary',
    bgColor: 'bg-secondary-100',
    textColor: 'text-secondary-700',
  },
  {
    name: 'Facturar',
    href: '/app/invoices',
    icon: DocumentTextIcon,
    color: 'accent',
    bgColor: 'bg-accent-100',
    textColor: 'text-accent-700',
  },
  {
    name: 'WhatsApp',
    href: '/app/whatsapp',
    icon: ChatBubbleLeftRightIcon,
    color: 'success',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
  },
];

export const QuickActions: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={action.href}
              className="block group"
            >
              <div className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200">
                <div className={`w-12 h-12 ${action.bgColor} rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className={`w-6 h-6 ${action.textColor}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">{action.name}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};