import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  min_stock: number;
}

interface LowStockAlertProps {
  products: LowStockProduct[];
  onRefresh: () => void;
  isLoading?: boolean;
}

export const LowStockAlert: React.FC<LowStockAlertProps> = ({ products, onRefresh, isLoading }) => {
  if (products.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <p className="text-green-700">✓ Todos los productos tienen stock suficiente</p>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-yellow-200 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-yellow-800">Stock Bajo</h3>
          <span className="bg-yellow-200 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
            {products.length} productos
          </span>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="text-yellow-600 hover:text-yellow-700 transition-colors"
        >
          <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="divide-y divide-yellow-100">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="px-6 py-4 flex justify-between items-center hover:bg-yellow-100/50 transition-colors"
          >
            <div>
              <p className="font-medium text-gray-900">{product.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                Stock actual: <span className="font-semibold text-red-600">{product.stock}</span> unidades
              </p>
              <p className="text-xs text-gray-400">Mínimo recomendado: {product.min_stock}</p>
            </div>
            <Link
              to={`/app/products/${product.id}`}
              className="px-4 py-2 bg-white border border-yellow-300 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-50 transition-colors"
            >
              Reponer stock
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};