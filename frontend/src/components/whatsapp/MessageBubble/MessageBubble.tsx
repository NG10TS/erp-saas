// frontend/src/components/whatsapp/MessageBubble/MessageBubble.tsx
import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageDirection = 'inbound' | 'outbound';

export interface Message {
  id: string;
  content: string;
  direction: MessageDirection;
  status: MessageStatus;
  timestamp: string;         // ISO string
  type?: 'text' | 'image' | 'document' | 'template';
  media_url?: string;
}

interface Props {
  message: Message;
}

const StatusIcon: React.FC<{ status: MessageStatus }> = ({ status }) => {
  switch (status) {
    case 'pending':   return <Clock size={12} className="text-gray-400" />;
    case 'sent':      return <Check size={12} className="text-gray-400" />;
    case 'delivered': return <CheckCheck size={12} className="text-gray-400" />;
    case 'read':      return <CheckCheck size={12} className="text-blue-400" />;
    case 'failed':    return <AlertCircle size={12} className="text-red-400" />;
    default:          return null;
  }
};

const formatTimestamp = (iso: string): string => {
  const d = new Date(iso);
  if (isToday(d))     return format(d, 'HH:mm');
  if (isYesterday(d)) return `Ayer ${format(d, 'HH:mm')}`;
  return format(d, "d MMM, HH:mm", { locale: es });
};

export const MessageBubble: React.FC<Props> = ({ message }) => {
  const isOwn = message.direction === 'outbound';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`
          relative max-w-[75%] min-w-[80px] px-3 py-2 rounded-2xl shadow-sm
          ${isOwn
            ? 'bg-[#dcf8c6] rounded-br-sm text-gray-900'
            : 'bg-white rounded-bl-sm text-gray-900'
          }
        `}
      >
        {/* Content */}
        {message.type === 'image' && message.media_url ? (
          <img
            src={message.media_url}
            alt="Imagen"
            className="max-w-full rounded-lg mb-1"
            loading="lazy"
          />
        ) : message.type === 'document' && message.media_url ? (
          <a
            href={message.media_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 underline"
          >
            <span>📎</span>
            <span>{message.content || 'Documento'}</span>
          </a>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}

        {/* Timestamp + status */}
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-gray-400 leading-none">
            {formatTimestamp(message.timestamp)}
          </span>
          {isOwn && <StatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  );
};