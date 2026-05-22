import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Mail, Phone, MapPin, MessageCircle,
  ArrowUp,
  Heart } from 'lucide-react';
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';


const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative mt-20 overflow-hidden">
      {/* Fondo animado de gradiente en movimiento */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 animate-gradient"></div>
      
      {/* Patrón de puntos decorativo (sutil) */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

      {/* Contenido principal con glassmorphism */}
      <div className="relative z-10 backdrop-blur-sm bg-white/5 border-t border-white/10 pt-16 pb-8 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Grid principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            
            {/* Columna 1: Logo */}
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20 transition-all group-hover:shadow-emerald-500/40 group-hover:scale-105">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-white drop-shadow-md">
                  ERP<span className="text-emerald-300">Conversacional</span>
                </span>
              </Link>
              <p className="text-sm text-white/70 leading-relaxed">
                El primer ERP que transforma WhatsApp en tu canal de ventas y facturación automática para PYMES ecuatorianas.
              </p>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                <span className="text-xs text-white/80">100% ecuatoriano</span>
              </div>
            </div>

            {/* Columna 2: Producto */}
            <div>
              <h4 className="font-semibold text-white text-lg mb-4 relative inline-block">
                Producto
                <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-emerald-400 to-transparent rounded-full"></span>
              </h4>
              <ul className="space-y-3 text-sm">
                {['Características', 'Precios', 'Blog', 'Soporte 24/7'].map((item, idx) => (
                  <li key={idx}>
                    <a 
                      href={`#${item.toLowerCase().replace(/\s/g, '')}`}
                      className="text-white/70 hover:text-white transition-all duration-300 hover:translate-x-1 inline-flex items-center gap-1 group"
                    >
                      <span className="w-0 group-hover:w-1.5 h-1.5 bg-emerald-400 rounded-full transition-all duration-300"></span>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Columna 3: Legal */}
            <div>
              <h4 className="font-semibold text-white text-lg mb-4 relative inline-block">
                Legal
                <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-emerald-400 to-transparent rounded-full"></span>
              </h4>
              <ul className="space-y-3 text-sm">
                {[
                  { name: 'Términos de servicio', path: '/terms' },
                  { name: 'Política de privacidad', path: '/privacy' },
                  { name: 'Política de cookies', path: '/cookies' },
                  { name: 'Aviso legal', path: '/legal' }
                ].map((item, idx) => (
                  <li key={idx}>
                    <Link 
                      to={item.path}
                      className="text-white/70 hover:text-white transition-all duration-300 hover:translate-x-1 inline-flex items-center gap-1 group"
                    >
                      <span className="w-0 group-hover:w-1.5 h-1.5 bg-emerald-400 rounded-full transition-all duration-300"></span>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Columna 4: Contacto y redes */}
            <div>
              <h4 className="font-semibold text-white text-lg mb-4 relative inline-block">
                Contacto
                <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-emerald-400 to-transparent rounded-full"></span>
              </h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3 text-white/70 group">
                  <Mail className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform" />
                  <a href="mailto:hola@erpconversacional.ec" className="hover:text-white transition-colors">
                    hola@erpconversacional.ec
                  </a>
                </li>
                <li className="flex items-center gap-3 text-white/70 group">
                  <Phone className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform" />
                  <a href="tel:+593999999999" className="hover:text-white transition-colors">
                    +593 99 999 9999
                  </a>
                </li>
                <li className="flex items-center gap-3 text-white/70 group">
                  <MessageCircle className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform" />
                  <a 
                    href="https://wa.me/593999999999" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    WhatsApp Business
                  </a>
                </li>
                <li className="flex items-center gap-3 text-white/70">
                  <MapPin className="w-4 h-4 text-emerald-300" />
                  <span>Quito - Guayaquil - Cuenca</span>
                </li>
              </ul>

              {/* Redes sociales con efecto neón */}
              <div className="mt-6">
                <p className="text-xs text-white/50 mb-3">Síguenos</p>
                <div className="flex gap-3">
                  {[
                    { Icon: FaFacebook, href: '#', label: 'Facebook', color: 'hover:bg-[#1877f2]' },
                    { Icon: FaTwitter, href: '#', label: 'Twitter', color: 'hover:bg-[#1da1f2]' },
                    { Icon: FaLinkedin, href: '#', label: 'LinkedIn', color: 'hover:bg-[#0a66c2]' },
                    { Icon: FaInstagram, href: '#', label: 'Instagram', color: 'hover:bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]' }
                  ].map((social, idx) => (
                    <a
                      key={idx}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="bg-white/10 backdrop-blur-sm p-2 rounded-full border border-white/20 text-white/80 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-emerald-500/20"
                    >
                      <social.Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Copyright con gradiente hover */}
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-white/50">
            <p>
              © {new Date().getFullYear()} ERP Conversacional Ecuador. Todos los derechos reservados.
            </p>

          </div>
        </div>
      </div>

      {/* Botón flotante "Volver arriba" con efecto de rebote */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-emerald-500 to-teal-500 p-3 rounded-full text-white shadow-lg shadow-emerald-500/30 hover:scale-110 transition-all duration-300 animate-bounce-once"
        aria-label="Volver arriba"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </footer>
  );
};

export default Footer;