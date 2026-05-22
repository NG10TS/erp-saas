// frontend/src/components/whatsapp/ChatWindow/ChatWindow.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Phone, MoreVertical, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { MessageBubble, Message } from '../MessageBubble/MessageBubble';
import { apiClient } from '@/lib/api-client';
import type { Conversation } from '../ConversationList/ConversationList';

interface Props {
  conversation: Conversation;
  onBack?: () => void;     // mobile back button
}

const fetchMessages = async (phone: string): Promise<Message[]> => {
  const r = await apiClient.get(`/whatsapp/messages`, { params: { phone_number: phone } });
  return r.data;
};

const sendMessage = async ({ phone, text }: { phone: string; text: string }) => {
  const r = await apiClient.post('/whatsapp/messages/send', {
    to: phone,
    message: text,
  });
  return r.data;
};

const initials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

export const ChatWindow: React.FC<Props> = ({ conversation, onBack }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['whatsapp-messages', conversation.phone_number],
    queryFn: () => fetchMessages(conversation.phone_number),
    refetchInterval: 5_000,  // poll every 5s (WebSocket would replace this)
  });

  const mutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      setInputText('');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages', conversation.phone_number] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
    onError: () => toast.error('Error al enviar el mensaje'),
  });

  // Scroll to bottom when messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || mutation.isPending) return;
    mutation.mutate({ phone: conversation.phone_number, text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#efeae2]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#075e54] text-white shadow-sm">
        {onBack && (
          <button onClick={onBack} className="mr-1 p-1 rounded hover:bg-white/10">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-[#075e54] font-bold text-sm flex-shrink-0">
          {initials(conversation.customer_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{conversation.customer_name}</p>
          <p className="text-xs text-green-200">{conversation.phone_number}</p>
        </div>
        <button className="p-2 rounded-full hover:bg-white/10">
          <Phone size={18} />
        </button>
        <button className="p-2 rounded-full hover:bg-white/10">
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <p className="text-sm">Sin mensajes aún</p>
            <p className="text-xs text-gray-400 mt-1">Envía el primero</p>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Optimistic outbound message while sending */}
        {mutation.isPending && (
          <MessageBubble
            message={{
              id: 'pending',
              content: inputText,
              direction: 'outbound',
              status: 'pending',
              timestamp: new Date().toISOString(),
            }}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2 bg-[#f0f0f0] flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          rows={1}
          className="flex-1 resize-none rounded-2xl px-4 py-2.5 bg-white border-0 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 max-h-32"
          style={{ minHeight: '42px' }}
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || mutation.isPending}
          className="w-10 h-10 rounded-full bg-[#075e54] text-white flex items-center justify-center hover:bg-[#064e47] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
