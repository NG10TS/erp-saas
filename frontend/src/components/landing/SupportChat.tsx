import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

const SupportChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: '¡Hola! Soy el asistente de ERP Conversacional Ecuador. ¿En qué puedo ayudarte hoy?',
      sender: 'agent',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Enfocar input al abrir el chat
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simular respuesta del agente después de 1-2 segundos
    setTimeout(() => {
      let replyText = '';
      const lowerMsg = inputValue.toLowerCase();
      if (lowerMsg.includes('precio') || lowerMsg.includes('cuesta') || lowerMsg.includes('plan')) {
        replyText = 'Tenemos planes desde $29/mes. ¿Te gustaría que te envíe la lista completa de precios?';
      } else if (lowerMsg.includes('factura') || lowerMsg.includes('sri') || lowerMsg.includes('xml')) {
        replyText = 'La facturación electrónica con el SRI es automática. Incluimos firma digital y envío. ¿Necesitas ayuda para configurarlo?';
      } else if (lowerMsg.includes('demo') || lowerMsg.includes('probar') || lowerMsg.includes('gratis')) {
        replyText = '¡Claro! Puedes solicitar una demo gratuita de 14 días. Déjame tu email o teléfono para enviarte el acceso.';
      } else if (lowerMsg.includes('hola') || lowerMsg.includes('buenas')) {
        replyText = '¡Hola! Estoy aquí para resolver tus dudas sobre el ERP conversacional. ¿Qué te gustaría saber?';
      } else {
        replyText = 'Gracias por tu mensaje. Un agente humano revisará tu consulta a la brevedad. Mientras tanto, puedes consultar nuestras FAQ en la página.';
      }
      const agentMessage: Message = {
        id: messages.length + 2,
        text: replyText,
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMessage]);
      setIsTyping(false);
    }, 1200);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Botón flotante */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </motion.button>

      {/* Ventana de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            style={{ height: '500px', maxHeight: 'calc(100vh - 100px)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white font-semibold">Soporte ERP Conversacional</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Zona de mensajes */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-800'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        msg.sender === 'user' ? 'text-emerald-100' : 'text-slate-400'
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-200 p-3 bg-white flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SupportChat;