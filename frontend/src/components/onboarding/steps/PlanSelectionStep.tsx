// src/components/onboarding/steps/PlanSelectionStep.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Building2, Leaf, ArrowRight, ArrowLeft } from 'lucide-react';
import { useOnboardingStore } from '@/store/slices/onboardingSlice';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const PLANS = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    description: 'Perfecto para empezar',
    features: ['1 usuario', '50 productos', '50 facturas/mes'],
    icon: Leaf,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    description: 'Para negocios en crecimiento',
    features: ['5 usuarios', '500 productos', '500 facturas/mes'],
    popular: true,
    icon: Zap,
  },
  {
    id: 'business',
    name: 'Business',
    price: 99,
    description: 'Escala sin límites',
    features: ['Usuarios ilimitados', 'Productos ilimitados', 'Facturas ilimitadas'],
    icon: Building2,
  },
];

export const PlanSelectionStep: React.FC<Props> = ({ onNext, onBack }) => {
  const { selectedPlan, setSelectedPlan } = useOnboardingStore();
  const [localPlan, setLocalPlan] = useState(selectedPlan || 'free');

  const handleContinue = () => {
    setSelectedPlan(localPlan);
    onNext();
  };

  return (
    <div className="py-10 px-6 md:px-12">
      <motion.div className="text-center mb-10" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Elige tu plan</h2>
        <p className="text-gray-500 mt-2">Puedes cambiar de plan en cualquier momento desde Configuración.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isSelected = localPlan === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setLocalPlan(plan.id as 'free' | 'pro' | 'business')}
              className={`relative w-full text-left rounded-2xl border-2 p-6 transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold rounded-full shadow-md whitespace-nowrap">
                  ⭐ Más popular
                </span>
              )}

              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold text-gray-900">${plan.price}</span>
                  {plan.price > 0 && <span className="text-sm text-gray-500">/mes</span>}
                </div>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              </div>

              <ul className="space-y-2.5">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-400 mb-8">
        Los planes de pago requieren tarjeta de crédito. Sin cargos durante los primeros 14 días.
      </p>

      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Atrás
        </button>
        <button
          onClick={handleContinue}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors text-sm shadow-sm"
        >
          Continuar <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};