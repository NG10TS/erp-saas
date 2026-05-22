import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const plans = [
  { name: 'Micro', priceMonthly: 29, priceYearly: 290, users: 1, features: ['100 facturas/mes', 'Inventario básico', 'Soporte email'], popular: false },
  { name: 'Startup', priceMonthly: 79, priceYearly: 790, users: 5, features: ['1,000 facturas/mes', 'Inventario avanzado', 'Dashboard', 'Soporte prioritario'], popular: true },
  { name: 'Business', priceMonthly: 199, priceYearly: 1990, users: 15, features: ['5,000 facturas/mes', 'Múltiples vendedores', 'API', 'Soporte 24/7'], popular: false },
  { name: 'Enterprise', priceMonthly: 499, priceYearly: 4990, users: 'Ilimitado', features: ['Facturas ilimitadas', 'Dedicado', 'SLA', 'Implementación personalizada'], popular: false },
];

const Pricing: React.FC = () => {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="precios" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-slate-900"
          >
            Planes para cada etapa de tu negocio
          </motion.h2>
          <div className="mt-4 inline-flex items-center gap-3 bg-slate-100 p-1 rounded-full">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${!annual ? 'bg-white shadow text-emerald-700' : 'text-slate-600'}`}
            >
              Mensual
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${annual ? 'bg-white shadow text-emerald-700' : 'text-slate-600'}`}
            >
              Anual <span className="text-emerald-600 text-xs">(2 meses gratis)</span>
            </button>
          </div>
        </div>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, idx) => {
            const price = annual ? plan.priceYearly : plan.priceMonthly;
            const period = annual ? '/año' : '/mes';
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className={`relative rounded-2xl p-6 border transition-all duration-300 ${plan.popular ? 'border-emerald-400 shadow-xl bg-gradient-to-b from-white to-emerald-50' : 'border-slate-200 shadow-sm hover:shadow-md'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Más popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-900">${price}</span>
                  <span className="text-slate-500 ml-1">{period}</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">Hasta {plan.users} usuarios</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500" /> {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`mt-8 block text-center py-2 rounded-lg font-semibold transition ${plan.popular ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
                >
                  Comenzar
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;