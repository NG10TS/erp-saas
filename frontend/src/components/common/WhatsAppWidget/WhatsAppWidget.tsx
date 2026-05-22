import React, { useState } from 'react';

const WhatsAppWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const phoneNumber = '593999999999'; // Cambia por tu número real
  const message = 'Hola, necesito ayuda con ERP Conversacional Ecuador';

  const handleChat = () => {
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-xl w-72 p-4 mb-2 border border-gray-100 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xl">📱</div>
            <div>
              <h4 className="font-semibold text-gray-800">¿Necesitas ayuda?</h4>
              <p className="text-xs text-gray-500">Responde en minutos</p>
            </div>
          </div>
          <button
            onClick={handleChat}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>💬</span> Abrir WhatsApp
          </button>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    </div>
  );
};

export default WhatsAppWidget;