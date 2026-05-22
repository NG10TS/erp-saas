import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Receipt, Package, BarChart3, Users } from 'lucide-react';

const steps = [
  { icon: MessageSquare, title: '1. Cliente escribe por WhatsApp', desc: 'El cliente envía "quiero 2 camisas" a tu número de negocio.' },
  { icon: Receipt, title: '2. ERP detecta intención de compra', desc: 'El sistema identifica productos, cantidad y precio.' },
  { icon: Package, title: '3. Confirma stock en tiempo real', desc: 'Verifica disponibilidad y reserva el inventario.' },
  { icon: BarChart3, title: '4. Genera factura electrónica', desc: 'Crea XML, firma digital y envía al SRI automáticamente.' },
  { icon: Users, title: '5. Notifica al cliente y al vendedor', desc: 'El cliente recibe factura PDF y tú el reporte de venta.' },
];

const SolutionSteps: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Cómo funciona ERP Conversacional Ecuador</h2>
          <p className="text-slate-600 mt-2 max-w-2xl mx-auto">Desde el primer mensaje hasta la factura electrónica, todo automático.</p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-6">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 hover:border-emerald-200 group"
            >
              <div className="bg-emerald-50 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition">
                <step.icon className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{step.title}</h3>
              <p className="text-slate-500 text-sm">{step.desc}</p>
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 transform -translate-y-1/2 text-emerald-300">
                  →
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionSteps;