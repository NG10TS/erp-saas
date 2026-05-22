import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Producto', href: '#producto' },
    { name: 'Precios', href: '#precios' },
    { name: 'WhatsApp', href: 'https://wa.me/593999999999', external: true },
    { name: 'Login', href: '/login' },
  ];

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-1.5 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">ERP<span className="text-emerald-600">Conversacional</span></span>
          </Link>

          {/* Desktop menu */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              link.external ? (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-emerald-600 transition-colors font-medium"
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-slate-600 hover:text-emerald-600 transition-colors font-medium"
                >
                  {link.name}
                </Link>
              )
            ))}
            <Link
              to="/register"
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white px-5 py-2 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
            >
              Registrarse
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-slate-700 focus:outline-none"
            aria-label="Menú"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-md shadow-lg border-t border-slate-100"
          >
            <div className="px-4 py-5 space-y-4">
              {navLinks.map((link) => (
                link.external ? (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-slate-700 hover:text-emerald-600 font-medium py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block text-slate-700 hover:text-emerald-600 font-medium py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                )
              ))}
              <Link
                to="/register"
                className="block text-center bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-4 py-2 rounded-lg font-semibold mt-4"
                onClick={() => setIsOpen(false)}
              >
                Registrarse
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;