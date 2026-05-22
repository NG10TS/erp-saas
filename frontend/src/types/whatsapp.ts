export type MessageDirection = 'inbound' | 'outbound';
export type MessageType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'interactive' | 'button' | 'template';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface WhatsAppMessage {
  id: string;
  business_id: string;
  customer_id: string;
  whatsapp_message_id: string;
  direction: MessageDirection;
  message_type: MessageType;
  text?: string;
  media_url?: string;
  caption?: string;
  status: MessageStatus;
  whatsapp_timestamp: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
}

export interface SendMessageRequest {
  to: string;
  text: string;
}

export interface SendTemplateRequest {
  to: string;
  template_name: string;
  language?: string;
  components?: Array<{
    type: string;
    parameters?: Array<{ type: string; text: string }>;
  }>;
}

export interface WhatsAppTemplate {
  id: string;
  business_id: string;
  name: string;
  category: string;
  language: string;
  components: Array<{
    type: string;
    text?: string;
    format?: string;
    buttons?: Array<{ type: string; text: string; url?: string }>;
  }>;
  status: string;
  is_default: boolean;
  times_used: number;
  last_used_at?: string;
  created_at: string;
}

export interface WhatsAppTemplateCreate {
  name: string;
  category?: string;
  language?: string;
  components: Array<{
    type: string;
    text?: string;
    format?: string;
    buttons?: Array<{ type: string; text: string; url?: string }>;
  }>;
}

export interface Conversation {
  customer_id: string;
  customer_name?: string;
  customer_phone: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  last_message_direction: MessageDirection;
}