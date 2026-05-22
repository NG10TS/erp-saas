import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Shield, Zap } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-200/30 via-transparent to-transparent"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap justify-center gap-3 mb-6"
          >
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium">
              <Zap className="w-3.5 h-3.5" /> Lanzamiento 2026
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
              <CheckCircle className="w-3.5 h-3.5" /> Integración SRI oficial
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-sm font-medium">
              <Shield className="w-3.5 h-3.5" /> WhatsApp Business Partner
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight max-w-4xl mx-auto"
          >
            Tu negocio en{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              WhatsApp
            </span>
            , factura automática
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto"
          >
            El primer ERP que permite a PYMES ecuatorianas gestionar ventas, inventario y facturación electrónica 100% desde WhatsApp.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/register"
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Probar gratis
            </Link>
            <a
              href="https://wa.me/593999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-slate-300 hover:border-emerald-400 text-slate-700 px-8 py-3 rounded-xl font-semibold shadow-sm hover:shadow transition-all duration-200"
            >
              Hablar con ventas
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 pt-6 border-t border-slate-200 max-w-md mx-auto"
          >
            <p className="text-slate-500 text-sm mb-3">Más de 50+ PYMES ecuatorianas ya confían</p>
            <div className="flex flex-wrap justify-center gap-8 opacity-70 grayscale">
              <img src="https://placehold.co/100x30?text=Logo+1" alt="Empresa" className="h-6" />
              <img src="https://placehold.co/100x30?text=Logo+2" alt="Empresa" className="h-6" />
              <img src="https://placehold.co/100x30?text=Logo+3" alt="Empresa" className="h-6" />
              <img src="https://placehold.co/100x30?text=Logo+4" alt="Empresa" className="h-6" />
            </div>
          </motion.div>
        </div>

        {/* Mockup video o animación Lottie (simulado con SVG decorativa) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 relative mx-auto max-w-3xl"
        >
          <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-700 px-4 py-2 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-slate-300 text-xs ml-2">Simulación de flujo - WhatsApp</span>
            </div>
            <div className="p-4 bg-white">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm font-bold">C</div>
                <div className="flex-1 bg-slate-100 rounded-lg p-3 max-w-[80%]">
                  <p className="text-slate-800">📦 2 camisas blancas, talla M</p>
                  <span className="text-xs text-slate-400">15:42</span>
                </div>
              </div>
              <div className="flex items-start gap-3 justify-end">
                <div className="flex-1 bg-emerald-100 rounded-lg p-3 max-w-[80%] text-right">
                  <p className="text-slate-800">✅ Pedido recibido. Total: $39.98<br/>Factura electrónica generada: #001-001-1234</p>
                  <span className="text-xs text-slate-400">15:43</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold">E</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;