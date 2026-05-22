import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} ERP Conversacional Ecuador. Todos los derechos reservados.
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/app/terms" className="text-gray-500 hover:text-emerald-600 transition-colors">
              Términos
            </Link>
            <Link to="/app/privacy" className="text-gray-500 hover:text-emerald-600 transition-colors">
              Privacidad
            </Link>
            <Link to="/app/pricing" className="text-gray-500 hover:text-emerald-600 transition-colors">
              Precios
            </Link>
            <a
              href="https://wa.me/593999999999?text=Hola%2C%20necesito%20soporte"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-emerald-600 transition-colors flex items-center gap-1"
            >
              <span>📱</span> Soporte WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;