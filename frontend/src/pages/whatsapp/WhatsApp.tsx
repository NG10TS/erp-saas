import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon, 
  PhoneIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { whatsappApi } from '@/services/api/whatsapp';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { Loading } from '@/components/common/Loading/Loading';
import { formatDate, formatPhone } from '@/utils/formatters';
import { useAuthStore } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';

export const WhatsApp: React.FC = () => {
  const { business } = useAuthStore();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: () => whatsappApi.getConversations(),
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['whatsapp-messages', selectedConversation?.customer_id],
    queryFn: () => whatsappApi.getMessages(selectedConversation?.customer_id),
    enabled: !!selectedConversation,
  });

  const sendMessage = useMutation({
    mutationFn: (data: { to: string; text: string }) => whatsappApi.sendMessage(data),
    onSuccess: () => {
      setMessageText('');
      setSending(false);
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
    onError: (error: any) => {
      setSending(false);
      toast.error(error.response?.data?.message || 'Error al enviar mensaje');
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;
    setSending(true);
    sendMessage.mutate({
      to: selectedConversation.customer_phone,
      text: messageText,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircleIcon className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCircleIcon className="w-3 h-3 text-blue-500" />;
      case 'read':
        return <CheckCircleIcon className="w-3 h-3 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="w-3 h-3 text-red-500" />;
      default:
        return <ClockIcon className="w-3 h-3 text-gray-400" />;
    }
  };

  if (!business?.whatsapp_business_phone) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">WhatsApp no configurado</h2>
        <p className="text-gray-500 mb-6">
          Para usar WhatsApp Business, configura tu número en la sección de configuración.
        </p>
        <Link to="/app/settings">
          <Button>Configurar WhatsApp</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Conversations List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Conversaciones</h2>
            <p className="text-xs text-gray-500 mt-1">{business.whatsapp_business_phone}</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="flex justify-center py-12">
                <Loading />
              </div>
            ) : conversations && conversations.length > 0 ? (
              conversations.map((conv: any) => (
                <button
                  key={conv.customer_id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedConversation?.customer_id === conv.customer_id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <UserCircleIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conv.customer_name || formatPhone(conv.customer_phone)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{formatPhone(conv.customer_phone)}</p>
                      <div className="flex items-center mt-1">
                        <p className="text-xs text-gray-400 truncate flex-1">{conv.last_message}</p>
                        <p className="text-xs text-gray-400 ml-2">{formatDate(conv.last_message_time, 'HH:mm')}</p>
                      </div>
                    </div>
                    {conv.unread_count > 0 && (
                      <div className="flex-shrink-0 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">{conv.unread_count}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay conversaciones</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <UserCircleIcon className="w-10 h-10 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedConversation.customer_name || formatPhone(selectedConversation.customer_phone)}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                      <PhoneIcon className="w-3 h-3 mr-1" />
                      {formatPhone(selectedConversation.customer_phone)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ backgroundImage: "url('/images/whatsapp-bg.png')", backgroundSize: 'cover' }}>
                {messagesLoading ? (
                  <div className="flex justify-center py-12">
                    <Loading />
                  </div>
                ) : messages && messages.length > 0 ? (
                  messages.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.direction === 'outbound'
                            ? 'bg-primary-500 text-white'
                            : 'bg-white text-gray-900 shadow-sm'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <div className="flex items-center justify-end space-x-1 mt-1">
                          <span className="text-[10px] opacity-70">
                            {formatDate(msg.created_at, 'HH:mm')}
                          </span>
                          {msg.direction === 'outbound' && (
                            <span className="opacity-70">{getStatusIcon(msg.status)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No hay mensajes. Envía un mensaje para iniciar la conversación.</p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex space-x-3">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    loading={sending}
                    disabled={!messageText.trim()}
                    icon={<PaperAirplaneIcon className="w-4 h-4" />}
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Selecciona una conversación para comenzar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
