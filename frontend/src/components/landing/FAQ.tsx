import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  { q: '¿Necesito certificado digital SRI?', a: 'Sí, nosotros te ayudamos a obtenerlo o puedes usar el tuyo. Incluimos asesoría en todos los planes.' },
  { q: '¿Cuánto cuesta la implementación?', a: 'La implementación es gratuita en planes anuales. En planes mensuales tiene un costo único de $49.' },
  { q: '¿Puedo probar gratis antes de comprar?', a: '¡Claro! Ofrecemos 14 días de prueba gratuita sin compromiso, con todas las funciones.' },
  { q: '¿Funciona con cualquier número de WhatsApp?', a: 'Sí, solo necesitas una cuenta de WhatsApp Business (gratuita). Nos integramos vía API oficial.' },
  { q: '¿Qué pasa si vendo más de lo que permite mi plan?', a: 'Puedes actualizar en cualquier momento. Te avisamos cuando te acerques al límite.' },
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Preguntas frecuentes</h2>
          <p className="text-slate-600 mt-2">Resolvemos tus dudas</p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="border border-slate-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex justify-between items-center p-5 text-left font-medium text-slate-800 hover:bg-slate-50 transition"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-emerald-600 transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-5 pb-5 text-slate-500 border-t border-slate-100"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;