import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

const DemoSection: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ text: string; type: 'user' | 'bot' }[]>([
    { text: '¡Hola! Simula un pedido. Ejemplo: "2 camisas"', type: 'bot' }
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { text: userMsg, type: 'user' }]);
    setInput('');

    // Simular respuesta automática con detección simple
    setTimeout(() => {
      let botReply = '';
      if (userMsg.toLowerCase().includes('camisa') || userMsg.toLowerCase().includes('camisas')) {
        botReply = '✅ Pedido recibido: ' + userMsg + '. Total: $39.98. Factura electrónica generada: #001-001-1234. ¡Gracias!';
      } else if (userMsg.toLowerCase().includes('pantalon') || userMsg.toLowerCase().includes('pantalones')) {
        botReply = '✅ Pantalones en stock. Total: $59.99. ¿Confirmas la compra?';
      } else {
        botReply = '📦 Producto registrado. Para facturar, escribe "confirmar pedido". Este es un simulador.';
      }
      setMessages(prev => [...prev, { text: botReply, type: 'bot' }]);
    }, 600);
  };

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Prueba el flujo en vivo</h2>
          <p className="text-slate-600 mt-2">Escribe un mensaje y mira cómo responde nuestro asistente</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200"
        >
          <div className="bg-emerald-600 px-4 py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white/30"></div>
            <span className="text-white font-medium">Simulador de WhatsApp - ERP Conversacional</span>
          </div>
          <div className="h-96 overflow-y-auto p-4 flex flex-col space-y-3 bg-[#efeae2]">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-2 shadow-sm ${msg.type === 'user' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-800'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t p-3 flex gap-2 bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Escribe '2 camisas' o algún producto..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleSend}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
        <p className="text-center text-slate-400 text-sm mt-4">* Simulación local. No guardamos datos.</p>
      </div>
    </section>
  );
};

export default DemoSection;