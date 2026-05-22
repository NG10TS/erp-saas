import React from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';

const WhatsAppButton: React.FC = () => {
  // Número de teléfono de soporte (incluye código país, sin '+' ni espacios)
  const phoneNumber = '593999999999'; // Reemplaza con tu número real
  const message = encodeURIComponent(
    'Hola, vengo de la página web de ERP Conversacional Ecuador. Necesito ayuda con una consulta sobre el producto.'
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 group"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Chat por WhatsApp"
    >
      <FaWhatsapp className="w-7 h-7 text-white" />
      {/* Pequeño badge de "Soporte" opcional */}
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
        Soporte
      </span>
    </motion.a>
  );
};

export default WhatsAppButton;