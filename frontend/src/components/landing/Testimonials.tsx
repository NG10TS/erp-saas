import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  { name: 'María Fernanda', role: 'Dueña de boutique', text: 'Antes perdía horas facturando. Ahora todo se hace automático desde WhatsApp. Mis ventas subieron 40%.', stars: 5, image: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { name: 'Carlos Zambrano', role: 'Gerente de restaurante', text: 'El control de inventario en tiempo real nos evitó desabastecernos en fin de semana. Excelente soporte.', stars: 5, image: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { name: 'Ana Lucía', role: 'Distribuidora de calzado', text: 'La facturación electrónica con el SRI nunca fue tan fácil. Mis 5 vendedores lo usan sin problema.', stars: 5, image: 'https://randomuser.me/api/portraits/women/45.jpg' },
];

const Testimonials: React.FC = () => {
  return (
    <section className="py-20 bg-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Lo que dicen nuestros clientes</h2>
          <p className="text-slate-600 mt-2">Más de 50 PYMES ecuatorianas ya facturan inteligente</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl p-6 shadow-md border border-slate-100"
            >
              <div className="flex items-center gap-4 mb-4">
                <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h4 className="font-bold text-slate-800">{t.name}</h4>
                  <p className="text-sm text-slate-500">{t.role}</p>
                </div>
              </div>
              <div className="flex mb-3">
                {[...Array(t.stars)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-600 italic">"{t.text}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;