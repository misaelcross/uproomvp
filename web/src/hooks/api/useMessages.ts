import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

// Tipos
export interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
  conversationId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
  };
}

export interface CreateMessageData {
  content: string;
  conversationId: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE';
}

export interface UpdateMessageData {
  content: string;
}

export interface MessagesResponse {
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Hooks para mensagens
export const useMessages = (conversationId: string, page = 1, limit = 50) => {
  return useQuery<MessagesResponse>({
    queryKey: ['messages', conversationId, page, limit],
    queryFn: async () => {
      const response = await api.get(`/api/messages/conversation/${conversationId}`, {
        params: { page, limit },
      });
      return response.data;
    },
    enabled: !!conversationId,
  });
};

export const useMessage = (id: string) => {
  return useQuery<Message>({
    queryKey: ['messages', id],
    queryFn: async () => {
      const response = await api.get(`/api/messages/${id}`);
      return response.data.message;
    },
    enabled: !!id,
  });
};

export const useCreateMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMessageData) => {
      const response = await api.post('/api/messages', data);
      return response.data.message;
    },
    onSuccess: (message) => {
      // Invalidar mensagens da conversa
      queryClient.invalidateQueries({ 
        queryKey: ['messages', message.conversationId] 
      });
      
      // Invalidar conversas para atualizar a última mensagem
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useUpdateMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMessageData }) => {
      const response = await api.put(`/api/messages/${id}`, data);
      return response.data.message;
    },
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ['messages', message.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['messages', message.id] });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/messages/${id}`);
      return response.data;
    },
    onSuccess: (_, messageId) => {
      // Invalidar todas as queries de mensagens
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
};
