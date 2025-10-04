'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from './AuthContext';
import { useCompany } from './CompanyContext';

interface Message {
  id: string;
  content: string;
  conversationId: string;
  userId: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
  createdAt: string;
  isPinned?: boolean;
  pinnedAt?: string;
  pinnedBy?: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface Conversation {
  id: string;
  title: string;
  description?: string;
  type: 'DIRECT' | 'GROUP';
  companyId: string;
  createdAt: string;
  updatedAt: string;
  participants: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      fullName: string;
      email: string;
    };
  }>;
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
  lastReadMessageId?: string;
}

interface TypingUser {
  userId: string;
  isTyping: boolean;
  timestamp: number;
}

interface ChatState {
  conversations: Conversation[];
  selectedConversation: string | null;
  messages: { [conversationId: string]: Message[] };
  typingUsers: { [conversationId: string]: TypingUser[] };
  onlineUsers: Set<string>;
  isLoading: boolean;
  error: string | null;
}

type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'UPDATE_CONVERSATION'; payload: Conversation }
  | { type: 'SET_SELECTED_CONVERSATION'; payload: string | null }
  | { type: 'SET_MESSAGES'; payload: { conversationId: string; messages: Message[] } }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: Message }
  | { type: 'DELETE_MESSAGE'; payload: { conversationId: string; messageId: string } }
  | { type: 'PIN_MESSAGE'; payload: { conversationId: string; messageId: string; pinnedBy: string } }
  | { type: 'UNPIN_MESSAGE'; payload: { conversationId: string; messageId: string } }
  | { type: 'MARK_AS_READ'; payload: { conversationId: string; messageId: string } }
  | { type: 'SET_TYPING_USERS'; payload: { conversationId: string; users: TypingUser[] } }
  | { type: 'SET_USER_STATUS'; payload: { userId: string; status: 'online' | 'offline' } }
  | { type: 'CLEAR_CONVERSATION_MESSAGES'; payload: string };

const initialState: ChatState = {
  conversations: [],
  selectedConversation: null,
  messages: {},
  typingUsers: {},
  onlineUsers: new Set(),
  isLoading: false,
  error: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    
    case 'ADD_CONVERSATION':
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
      };
    
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.id ? action.payload : conv
        ),
      };
    
    case 'SET_SELECTED_CONVERSATION':
      return { ...state, selectedConversation: action.payload };
    
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: action.payload.messages,
        },
      };
    
    case 'ADD_MESSAGE':
      const conversationId = action.payload.conversationId;
      const existingMessages = state.messages[conversationId] || [];
      const updatedMessages = [...existingMessages, action.payload];
      
      return {
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: updatedMessages,
        },
        conversations: state.conversations.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              lastMessage: action.payload,
              updatedAt: action.payload.createdAt,
            };
          }
          return conv;
        }),
      };
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: (state.messages[action.payload.conversationId] || [])
            .map(msg => msg.id === action.payload.id ? action.payload : msg),
        },
      };
    
    case 'DELETE_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: (state.messages[action.payload.conversationId] || [])
            .filter(msg => msg.id !== action.payload.messageId),
        },
      };
    
    case 'SET_TYPING_USERS':
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.conversationId]: action.payload.users,
        },
      };
    
    case 'SET_USER_STATUS':
      const newOnlineUsers = new Set(state.onlineUsers);
      if (action.payload.status === 'online') {
        newOnlineUsers.add(action.payload.userId);
      } else {
        newOnlineUsers.delete(action.payload.userId);
      }
      return { ...state, onlineUsers: newOnlineUsers };
    
    case 'PIN_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: (state.messages[action.payload.conversationId] || [])
            .map(msg => msg.id === action.payload.messageId 
              ? { 
                  ...msg, 
                  isPinned: true, 
                  pinnedAt: new Date().toISOString(), 
                  pinnedBy: action.payload.pinnedBy 
                } 
              : msg
            ),
        },
      };
    
    case 'UNPIN_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: (state.messages[action.payload.conversationId] || [])
            .map(msg => msg.id === action.payload.messageId 
              ? { 
                  ...msg, 
                  isPinned: false, 
                  pinnedAt: undefined, 
                  pinnedBy: undefined 
                } 
              : msg
            ),
        },
      };
    
    case 'MARK_AS_READ':
      return {
        ...state,
        conversations: state.conversations.map(conv => 
          conv.id === action.payload.conversationId 
            ? { ...conv, lastReadMessageId: action.payload.messageId }
            : conv
        ),
      };
    
    case 'CLEAR_CONVERSATION_MESSAGES':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload]: [],
        },
      };
    
    default:
      return state;
  }
}

interface ChatContextType {
  state: ChatState;
  sendMessage: (content: string, conversationId: string, type?: 'TEXT' | 'IMAGE' | 'FILE') => void;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  selectConversation: (conversationId: string | null) => void;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  createConversation: (title: string, participantIds: string[], type?: 'DIRECT' | 'GROUP') => Promise<Conversation | null>;
  pinMessage: (conversationId: string, messageId: string) => Promise<void>;
  unpinMessage: (conversationId: string, messageId: string) => Promise<void>;
  markAsRead: (conversationId: string, messageId: string) => void;
  isConnected: boolean;
  isConnecting: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat deve ser usado dentro de um ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user } = useAuth();
  const { currentCompany } = useCompany();

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');

  // WebSocket events
  const handleNewMessage = (message: Message) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  };

  const handleTyping = (data: { userId: string; conversationId: string; isTyping: boolean }) => {
    const typingUsers = state.typingUsers[data.conversationId] || [];
    const existingUserIndex = typingUsers.findIndex(u => u.userId === data.userId);
    
    let updatedTypingUsers: TypingUser[];
    
    if (data.isTyping) {
      if (existingUserIndex >= 0) {
        updatedTypingUsers = typingUsers.map((u, index) => 
          index === existingUserIndex 
            ? { ...u, isTyping: true, timestamp: Date.now() }
            : u
        );
      } else {
        updatedTypingUsers = [...typingUsers, {
          userId: data.userId,
          isTyping: true,
          timestamp: Date.now(),
        }];
      }
    } else {
      updatedTypingUsers = typingUsers.filter(u => u.userId !== data.userId);
    }
    
    dispatch({
      type: 'SET_TYPING_USERS',
      payload: { conversationId: data.conversationId, users: updatedTypingUsers },
    });
  };

  const handleUserStatus = (data: { userId: string; status: 'online' | 'offline'; timestamp: string }) => {
    dispatch({ type: 'SET_USER_STATUS', payload: { userId: data.userId, status: data.status } });
  };

  const handleNewConversation = (data: { conversationId: string; participantIds: string[] }) => {
    // Recarregar conversas quando uma nova for criada
    loadConversations();
  };

  const { isConnected, isConnecting, sendMessage: wsSendMessage, sendTyping: wsSendTyping } = useWebSocket({
    onMessage: handleNewMessage,
    onTyping: handleTyping,
    onUserStatus: handleUserStatus,
    onNewConversation: handleNewConversation,
  });

  const loadConversations = async () => {
    if (!user || !currentCompany) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('❌ ChatContext: Nenhum token encontrado');
        dispatch({ type: 'SET_ERROR', payload: 'Token de autenticação não encontrado' });
        return;
      }
      
      console.log('🔍 ChatContext: Carregando conversas para company:', currentCompany.id);
      console.log('🔍 ChatContext: Token encontrado:', !!token);
      
      const response = await fetch(`${apiUrl}/conversations?companyId=${currentCompany.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 ChatContext: Resposta do servidor:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ChatContext: Erro na resposta:', errorText);
        throw new Error(`Erro ao carregar conversas: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      dispatch({ type: 'SET_CONVERSATIONS', payload: data.conversations });
    } catch (error) {
      console.error('❌ ChatContext: Erro ao carregar conversas:', error);
      console.error('❌ ChatContext: Detalhes do erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      dispatch({ type: 'SET_ERROR', payload: `Erro ao carregar conversas: ${error instanceof Error ? error.message : 'Erro desconhecido'}` });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('❌ ChatContext: Nenhum token encontrado para carregar mensagens');
        return;
      }
      
      console.log('🔍 ChatContext: Carregando mensagens para conversa:', conversationId);
      console.log('🔍 ChatContext: Token encontrado:', !!token);
      
      const response = await fetch(`${apiUrl}/messages/conversation/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🔍 ChatContext: Resposta do servidor para mensagens:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ChatContext: Erro na resposta ao carregar mensagens:', errorText);
        throw new Error(`Erro ao carregar mensagens: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      dispatch({ type: 'SET_MESSAGES', payload: { conversationId, messages: data.messages } });
    } catch (error) {
      console.error('❌ ChatContext: Erro ao carregar mensagens:', error);
      console.error('❌ ChatContext: Detalhes do erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      dispatch({ type: 'SET_ERROR', payload: `Erro ao carregar mensagens: ${error instanceof Error ? error.message : 'Erro desconhecido'}` });
    }
  };

  const createConversation = async (
    title: string, 
    participantIds: string[], 
    type: 'DIRECT' | 'GROUP' = 'DIRECT'
  ): Promise<Conversation | null> => {
    if (!user || !currentCompany) return null;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('❌ ChatContext: Nenhum token encontrado para criar conversa');
        return null;
      }
      
      console.log('🔍 ChatContext: Criando conversa:', { title, companyId: currentCompany.id, type, participantIds });
      console.log('🔍 ChatContext: Token encontrado:', !!token);
      
      const response = await fetch(`${apiUrl}/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          companyId: currentCompany.id,
          type,
          participantIds,
        }),
      });
      
      console.log('🔍 ChatContext: Resposta do servidor para criar conversa:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ChatContext: Erro na resposta ao criar conversa:', errorText);
        throw new Error(`Erro ao criar conversa: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 ChatContext: Conversa criada:', data.conversation);
      dispatch({ type: 'ADD_CONVERSATION', payload: data.conversation });
      
      // Auto-selecionar a conversa recém-criada
      console.log('🔍 ChatContext: Auto-selecionando conversa:', data.conversation.id);
      dispatch({ type: 'SET_SELECTED_CONVERSATION', payload: data.conversation });
      
      return data.conversation;
    } catch (error) {
      console.error('❌ ChatContext: Erro ao criar conversa:', error);
      console.error('❌ ChatContext: Detalhes do erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      dispatch({ type: 'SET_ERROR', payload: `Erro ao criar conversa: ${error instanceof Error ? error.message : 'Erro desconhecido'}` });
      return null;
    }
  };

  const sendMessage = (content: string, conversationId: string, type: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT') => {
    wsSendMessage({ content, conversationId, type });
  };

  const sendTyping = (conversationId: string, isTyping: boolean) => {
    wsSendTyping({ conversationId, isTyping });
  };

  const selectConversation = (conversationId: string | null) => {
    dispatch({ type: 'SET_SELECTED_CONVERSATION', payload: conversationId });
    if (conversationId) {
      loadMessages(conversationId);
    }
  };

  const pinMessage = async (conversationId: string, messageId: string) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('❌ ChatContext: Nenhum token encontrado para fixar mensagem');
        return;
      }

      const response = await fetch(`${apiUrl}/messages/${messageId}/pin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('✅ Mensagem fixada com sucesso:', { conversationId, messageId, pinnedBy: user.id });
        dispatch({ 
          type: 'PIN_MESSAGE', 
          payload: { conversationId, messageId, pinnedBy: user.id } 
        });
      } else {
        console.error('❌ Erro ao fixar mensagem:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ ChatContext: Erro ao fixar mensagem:', error);
    }
  };

  const unpinMessage = async (conversationId: string, messageId: string) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('❌ ChatContext: Nenhum token encontrado para desfixar mensagem');
        return;
      }

      const response = await fetch(`${apiUrl}/messages/${messageId}/unpin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        dispatch({ 
          type: 'UNPIN_MESSAGE', 
          payload: { conversationId, messageId } 
        });
      }
    } catch (error) {
      console.error('❌ ChatContext: Erro ao desfixar mensagem:', error);
    }
  };

  const markAsRead = (conversationId: string, messageId: string) => {
    dispatch({ 
      type: 'MARK_AS_READ', 
      payload: { conversationId, messageId } 
    });
  };

  // Carregar conversas quando o usuário e empresa estiverem disponíveis
  useEffect(() => {
    if (user && currentCompany) {
      loadConversations();
    }
  }, [user, currentCompany]);

  const value: ChatContextType = {
    state,
    sendMessage,
    sendTyping,
    selectConversation,
    loadConversations,
    loadMessages,
    createConversation,
    pinMessage,
    unpinMessage,
    markAsRead,
    isConnected,
    isConnecting,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
