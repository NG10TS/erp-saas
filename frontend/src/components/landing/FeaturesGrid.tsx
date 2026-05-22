import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, FileText, PackageSearch, UsersRound, LayoutDashboard, ShieldCheck } from 'lucide-react';

const features = [
  { icon: MessageCircle, title: 'Ventas por WhatsApp', description: 'Recibe pedidos, responde automáticamente y conviértelos en facturas electrónicas.', color: 'emerald' },
  { icon: FileText, title: 'Facturación SRI', description: 'XML, firma digital, envío SOAP y PDF RIDE. Ambiente pruebas y producción.', color: 'emerald' },
  { icon: PackageSearch, title: 'Inventario en tiempo real', description: 'Controla stock, alertas de bajo inventario y evita sobreventas.', color: 'emerald' },
  { icon: UsersRound, title: 'Múltiples usuarios', description: 'Roles: Owner, Admin, Seller. Permisos granulares para cada empleado.', color: 'emerald' },
  { icon: LayoutDashboard, title: 'Dashboard y reportes', description: 'Estadísticas de ventas, productos más vendidos, exportación a Excel.', color: 'emerald' },
  { icon: ShieldCheck, title: 'Seguro y multi-tenant', description: 'Datos aislados por negocio, JWT, backups automáticos diarios.', color: 'emerald' },
];

const FeaturesGrid: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Todo lo que tu negocio necesita</h2>
          <p className="text-slate-600 mt-2">Integración completa con WhatsApp y el SRI</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group hover:border-emerald-300"
            >
              <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition">
                <feature.icon className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{feature.title}</h3>
              <p className="text-slate-500">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;