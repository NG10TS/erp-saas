import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Minimize2, Maximize2, Paperclip, Zap, CheckCircle, Clock } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  options?: { label: string; action: string; icon?: React.ReactNode }[];
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '👋 ¡Hola! Soy *Asistente AI* de **ERP Conversacional Ecuador**. ¿En qué puedo ayudarte hoy?',
      sender: 'agent',
      timestamp: new Date(),
      options: [
        { label: '💰 Precios y planes', action: 'Precios y planes', icon: <Zap className="w-4 h-4" /> },
        { label: '📄 Facturación SRI', action: 'Facturación SRI', icon: <CheckCircle className="w-4 h-4" /> },
        { label: '🎉 Demo gratis', action: 'Demo gratis', icon: <Clock className="w-4 h-4" /> },
        { label: '👨‍💼 Hablar con humano', action: 'Hablar con humano', icon: <MessageCircle className="w-4 h-4" /> },
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const formatMessage = (text: string) => {
    const withBold = text.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    const parts = withBold.split('\n');
    return parts.map((line, i) => (
      <React.Fragment key={i}>
        <span dangerouslySetInnerHTML={{ __html: line }} />
        {i < parts.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const sendMessage = async (text: string, isOption = false) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);
    setEstimatedTime(Math.floor(Math.random() * 2000) + 1000);

    setTimeout(() => {
      const botReply = getSimulatedResponse(text);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: botReply.text,
        sender: 'agent',
        timestamp: new Date(),
        options: botReply.options,
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
      setEstimatedTime(null);
    }, estimatedTime || 1500);
  };

  const getSimulatedResponse = (userText: string): { text: string; options?: { label: string; action: string; icon?: React.ReactNode }[] } => {
    const lower = userText.toLowerCase();
    if (lower.includes('precio') || lower.includes('plan') || lower.includes('costo')) {
      return {
        text: '💰 *Nuestros planes:*\n\n• **Micro**: $29/mes (1 usuario, 100 facturas)\n• **Startup**: $79/mes (5 usuarios, 1000 facturas) ⭐ *Más popular*\n• **Business**: $199/mes (15 usuarios, 5000 facturas)\n• **Enterprise**: Precio personalizado\n\n¿Te gustaría agendar una demo gratuita?',
        options: [
          { label: '📅 Agendar demo', action: 'Agendar demo', icon: <Clock className="w-4 h-4" /> },
          { label: '📊 Comparar planes', action: 'Ver comparativa completa', icon: <CheckCircle className="w-4 h-4" /> },
          { label: '💬 Hablar con asesor', action: 'Hablar con asesor', icon: <MessageCircle className="w-4 h-4" /> },
        ],
      };
    }
    if (lower.includes('factura') || lower.includes('sri')) {
      return {
        text: '📄 *Facturación electrónica SRI*\n\n✅ Generación automática de XML\n✅ Firma digital incluida\n✅ Envío SOAP y recepción de autorización\n✅ PDF RIDE\n✅ Ambiente de pruebas y producción\n\n¿Necesitas ayuda para la configuración inicial?',
        options: [
          { label: '⚙️ Configurar ahora', action: 'Configurar ahora', icon: <Zap className="w-4 h-4" /> },
          { label: '📋 Requisitos técnicos', action: 'Requisitos técnicos', icon: <CheckCircle className="w-4 h-4" /> },
          { label: '🛠️ Soporte', action: 'Soporte', icon: <MessageCircle className="w-4 h-4" /> },
        ],
      };
    }
    if (lower.includes('demo') || lower.includes('prueba') || lower.includes('gratis')) {
      return {
        text: '🎉 *Demo gratuita por 14 días*\n\nSin compromiso, sin tarjeta de crédito. Incluye todas las funciones.\n\nSolo regístrate y activa el plan de prueba.\n¿Te ayudo con el registro?',
        options: [
          { label: '📝 Registrarme ahora', action: 'Registrarme ahora', icon: <CheckCircle className="w-4 h-4" /> },
          { label: '📺 Ver video tutorial', action: 'Ver video tutorial', icon: <Clock className="w-4 h-4" /> },
          { label: '💼 Hablar con ventas', action: 'Hablar con ventas', icon: <MessageCircle className="w-4 h-4" /> },
        ],
      };
    }
    if (lower.includes('humano') || lower.includes('asesor') || lower.includes('soporte')) {
      return {
        text: '👨‍💼 Un asesor se pondrá en contacto contigo pronto. Mientras tanto, ¿puedo ayudarte con alguna pregunta específica?',
        options: [
          { label: '🚀 Probar gratis', action: 'Probar gratis', icon: <Zap className="w-4 h-4" /> },
          { label: '💰 Precios', action: 'Precios', icon: <CheckCircle className="w-4 h-4" /> },
          { label: '📋 Requisitos técnicos', action: 'Requisitos técnicos', icon: <Clock className="w-4 h-4" /> },
        ],
      };
    }
    return {
      text: 'Gracias por tu mensaje. Nuestro equipo de soporte te responderá en breve. ¿Te gustaría recibir más información por WhatsApp?',
      options: [
        { label: '📱 Sí, enviar a WhatsApp', action: 'Sí, enviar a WhatsApp', icon: <MessageCircle className="w-4 h-4" /> },
        { label: '❌ No, gracias', action: 'No, gracias', icon: <X className="w-4 h-4" /> },
        { label: '👨‍💼 Hablar con asesor', action: 'Hablar con asesor', icon: <MessageCircle className="w-4 h-4" /> },
      ],
    };
  };

  const handleSend = () => sendMessage(inputValue);
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const handleOptionClick = (action: string) => sendMessage(action, true);

  return (
    <div className="fixed bottom-24 right-6 z-50"> {/* ← posición más arriba (bottom-24 en lugar de bottom-6) */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        aria-label="Chat de soporte"
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">1</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute bottom-16 right-0 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 ${
              isMinimized ? 'w-80 h-14' : 'w-[450px] h-[650px]'
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 flex justify-between items-center cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-white" />
                <span className="text-white font-semibold">Soporte ERP Conversacional</span>
                <span className="bg-green-400 w-2 h-2 rounded-full animate-pulse"></span>
              </div>
              <button className="text-white hover:text-emerald-100 transition">
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
            </div>

            {!isMinimized && (
              <>
                {/* Estado en línea */}
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 text-xs text-slate-500 flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span>En línea</span>
                  </div>
                  {isTyping && estimatedTime && (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <Clock className="w-3 h-3" />
                      <span>Respondiendo en unos segundos...</span>
                    </div>
                  )}
                </div>

                {/* Cuerpo del chat */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100%-180px)] bg-gradient-to-b from-slate-50 to-white custom-scroll">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                    >
                      <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${
                            msg.sender === 'user'
                              ? 'bg-emerald-600 text-white rounded-br-none'
                              : 'bg-white text-slate-800 border border-emerald-100 rounded-bl-none'
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">{formatMessage(msg.text)}</div>
                          <div className={`text-[10px] mt-1 ${msg.sender === 'user' ? 'text-emerald-100' : 'text-slate-400'}`}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      {msg.sender === 'agent' && msg.options && msg.options.length > 0 && (
                        <div className="mt-3 ml-2 space-y-2">
                          {msg.options.map((opt, idx) => (
                            <motion.button
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              onClick={() => handleOptionClick(opt.action)}
                              className="w-full flex items-center gap-3 text-left bg-white border border-emerald-200 hover:border-emerald-400 rounded-xl px-4 py-2.5 transition-all shadow-sm hover:shadow-md group"
                            >
                              <span className="text-emerald-600 group-hover:scale-110 transition-transform">
                                {opt.icon || <MessageCircle className="w-4 h-4" />}
                              </span>
                              <span className="text-sm font-medium text-slate-700 flex-1">{opt.label}</span>
                              <span className="text-emerald-400 opacity-0 group-hover:opacity-100 transition">→</span>
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl rounded-bl-none px-4 py-2 shadow-sm border border-slate-200">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-75"></span>
                          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-slate-200 p-3 bg-white flex items-center gap-2">
                  <button className="p-2 text-slate-400 hover:text-emerald-600 transition rounded-full" aria-label="Adjuntar archivo">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white placeholder:text-slate-400"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-full transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default ChatWidget;