import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Notebook, Clock, DollarSign } from 'lucide-react';

const problems = [
  { icon: Notebook, title: 'Pedidos en cuaderno', desc: 'Se pierden notas, errores en cantidades y demoras en entregas.' },
  { icon: Clock, title: 'Facturación manual', desc: 'Horas perdidas llenando comprobantes y revisando el SRI.' },
  { icon: AlertCircle, title: 'Inventario desactualizado', desc: 'Vendes algo que ya no tienente, clientes insatisfechos.' },
  { icon: DollarSign, title: 'Pérdida de ventas', desc: 'No das seguimiento a clientes que te escriben por WhatsApp.' },
];

const ProblemSection: React.FC = () => {
  return (
    <section id="producto" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              ¿Todavía anotas tus pedidos en un cuaderno?
            </h2>
            <p className="text-lg text-slate-600 mb-6">
              Tu negocio pierde eficiencia, dinero y oportunidades cada vez que anotas un pedido a mano o usas Excel.
            </p>
            <div className="space-y-4">
              {problems.map((problem, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                  <div className="bg-emerald-100 p-2 rounded-lg group-hover:bg-emerald-200 transition">
                    <problem.icon className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{problem.title}</h3>
                    <p className="text-slate-500 text-sm">{problem.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right side: ilustración del caos */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="bg-slate-100 rounded-2xl p-6 shadow-inner">
              <div className="bg-white rounded-xl p-4 shadow-md">
                <div className="flex items-center gap-2 border-b pb-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                  <div className="h-2 w-24 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-2 w-1/2 bg-gray-200 rounded"></div>
                  <div className="h-2 w-full bg-red-200 rounded"></div>
                </div>
              </div>
              <div className="absolute top-4 right-4 text-6xl opacity-20">📝💥</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;