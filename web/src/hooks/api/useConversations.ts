import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

// Tipos
export interface Conversation {
  id: string;
  title: string;
  type: 'DIRECT' | 'GROUP';
  companyId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  participants?: ConversationParticipant[];
  messages?: Message[];
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  user: {
    id: string;
    name?: string;
    email: string;
  };
}

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

export interface CreateConversationData {
  title: string;
  companyId: string;
  type?: 'DIRECT' | 'GROUP';
  participantIds?: string[];
}

export interface UpdateConversationData {
  title?: string;
}

export interface CreateMessageData {
  content: string;
  conversationId: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE';
}

export interface UpdateMessageData {
  content: string;
}

// Hooks para conversas
export const useConversations = (companyId?: string) => {
  return useQuery<Conversation[]>({
    queryKey: ['conversations', companyId],
    queryFn: async () => {
      const params = companyId ? { companyId } : {};
      const response = await api.get('/api/conversations', { params });
      return response.data.conversations;
    },
  });
};

export const useConversation = (id: string) => {
  return useQuery<Conversation>({
    queryKey: ['conversations', id],
    queryFn: async () => {
      const response = await api.get(`/api/conversations/${id}`);
      return response.data.conversation;
    },
    enabled: !!id,
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateConversationData) => {
      const response = await api.post('/api/conversations', data);
      return response.data.conversation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', variables.companyId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useUpdateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateConversationData }) => {
      const response = await api.put(`/api/conversations/${id}`, data);
      return response.data.conversation;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', id] });
    },
  });
};

export const useAddParticipant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      const response = await api.post(`/api/conversations/${conversationId}/participants`, { userId });
      return response.data;
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', conversationId] });
    },
  });
};
