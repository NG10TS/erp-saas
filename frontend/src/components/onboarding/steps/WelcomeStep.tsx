// src/components/onboarding/steps/WelcomeStep.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Clock, Sparkles, Shield, ArrowRight } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

const features = [
  { icon: Clock, title: "2 minutos", description: "Configura tu negocio rápidamente" },
  { icon: Sparkles, title: "Fácil de usar", description: "Interfaz intuitiva y moderna" },
  { icon: Shield, title: "100% seguro", description: "Tus datos están protegidos" },
];

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <div className="text-center py-12 px-6 md:py-16 md:px-12">
      {/* Animated rocket icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
        className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-500/25"
      >
        <Rocket className="w-12 h-12 text-white" />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
      >
        ¡Bienvenido a tu ERP!
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-lg text-gray-600 mb-10 max-w-md mx-auto leading-relaxed"
      >
        Te guiaremos paso a paso para que tengas tu primera venta en menos de 2 minutos.
      </motion.p>

      {/* Features grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-3 gap-4 mb-10 max-w-lg mx-auto"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="flex flex-col items-center p-4 rounded-xl bg-gray-50"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center mb-2">
              <feature.icon className="w-5 h-5 text-primary-600" />
            </div>
            <p className="font-semibold text-sm text-gray-900">{feature.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <button
          onClick={onNext}
          className="group inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all transform hover:scale-105"
        >
          <span>Comenzar ahora</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>

      {/* Time estimate */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-6 text-sm text-gray-400"
      >
        Solo te tomará unos minutos completar la configuración
      </motion.p>
    </div>
  );
};