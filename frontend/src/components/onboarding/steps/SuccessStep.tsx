// src/components/onboarding/steps/SuccessStep.tsx
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { PartyPopper, CheckCircle2, Building2, Package, Users, Receipt, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '@/store/slices/onboardingSlice';

interface SuccessStepProps {
  onComplete: () => void;
}

const completedItems = [
  { icon: Building2, title: "Negocio configurado", description: "Listo para facturar", color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { icon: Package, title: "Producto creado", description: "Inventario activo", color: "text-purple-500", bgColor: "bg-purple-500/10" },
  { icon: Users, title: "Cliente registrado", description: "Base de datos lista", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  { icon: Receipt, title: "Primera venta", description: "Stock actualizado", color: "text-amber-500", bgColor: "bg-amber-500/10" },
];

export const SuccessStep: React.FC<SuccessStepProps> = ({ onComplete }) => {
  const { sale, product } = useOnboardingStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Confetti animation mejorada
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const itemQuantity = sale?.items?.[0]?.cantidad ?? 0;
  const totalAmount = sale?.total || ((product?.precio_venta ?? 0) * itemQuantity);

  return (
    <div className="text-center py-12 px-6 md:py-16 md:px-12">
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.8, bounce: 0.5 }}
        className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30"
      >
        <PartyPopper className="w-12 h-12 text-white" />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
      >
        ¡Felicidades!
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-lg text-gray-600 mb-10 max-w-md mx-auto"
      >
        Has completado tu primera venta exitosamente. Tu negocio está listo para operar.
      </motion.p>

      {/* Completed items checklist */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-50 rounded-2xl p-6 max-w-md mx-auto mb-8 border border-gray-100"
      >
        <div className="space-y-4">
          {completedItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className={`w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Sale summary */}
      {sale && product && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-4 max-w-md mx-auto mb-8 border border-primary-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span className="text-sm text-gray-600">Tu primera venta:</span>
            </div>
            <span className="font-bold text-primary-600">
              {new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(totalAmount)}
            </span>
          </div>
        </motion.div>
      )}

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <button
          onClick={() => navigate('/app/dashboard')}
          className="group inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all transform hover:scale-105"
        >
          <span>Ir al Dashboard</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>

      {/* Additional info */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="mt-8 text-sm text-gray-400"
      >
        Ahora puedes gestionar tu negocio desde el panel de control
      </motion.p>
    </div>
  );
};
