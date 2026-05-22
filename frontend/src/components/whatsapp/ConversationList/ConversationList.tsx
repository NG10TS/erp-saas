// frontend/src/components/whatsapp/ConversationList/ConversationList.tsx
import React, { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Conversation {
  customer_id: string;
  customer_name: string;
  phone_number: string;
  last_message: string;
  last_at: string | null;
  direction: 'inbound' | 'outbound';
  unread: number;
}

interface Props {
  selectedId?: string;
  onSelect: (conv: Conversation) => void;
}

const fetchConversations = async (): Promise<Conversation[]> => {
  const r = await apiClient.get('/whatsapp/conversations');
  return r.data;
};

const formatTime = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isToday(d))     return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Ayer';
  return format(d, 'd/MM/yy', { locale: es });
};

const initials = (name: string): string =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

export const ConversationList: React.FC<Props> = ({ selectedId, onSelect }) => {
  const [search, setSearch] = useState('');

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: fetchConversations,
    refetchInterval: 15_000,
  });

  const filtered = conversations.filter(c =>
    c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone_number.includes(search)
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <MessageSquare size={20} className="text-green-600" />
          WhatsApp
        </h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conversación..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                <div className="w-11 h-11 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <MessageSquare size={32} className="mb-2" />
            <p className="text-sm">
              {search ? 'Sin resultados' : 'Sin conversaciones aún'}
            </p>
          </div>
        )}

        {filtered.map(conv => (
          <button
            key={conv.customer_id}
            onClick={() => onSelect(conv)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left
              ${selectedId === conv.customer_id ? 'bg-green-50 border-r-2 border-green-500' : ''}
            `}
          >
            {/* Avatar */}
            <div className="w-11 h-11 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center text-green-700 font-semibold text-sm">
              {initials(conv.customer_name)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {conv.customer_name}
                </span>
                <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                  {formatTime(conv.last_at)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 truncate">
                  {conv.direction === 'outbound' ? '✓ ' : ''}{conv.last_message}
                </p>
                {conv.unread > 0 && (
                  <span className="ml-2 flex-shrink-0 w-5 h-5 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {conv.unread > 9 ? '9+' : conv.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
