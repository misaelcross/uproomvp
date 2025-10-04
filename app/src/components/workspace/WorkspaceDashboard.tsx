'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useChat } from '@/contexts/ChatContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useWebSocket } from '@/hooks/useWebSocket';
import { UserRoleBadge } from './UserRoleBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import WorkspaceHeader from './WorkspaceHeader';
import StatusSelector from './StatusSelector';
import MemberList from './MemberList';
import GroupParticipants from './GroupParticipants';
import GroupSettings from './GroupSettings';
import {
  Bell,
  Search,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Minimize2,
  X,
  Send,
  Pin,
  Plus,
  MessageCircle,
  Menu,
  Settings,
  UserPlus,
  LogOut,
  Building2,
  Mail,
  User,
  Archive,
  Trash2
} from 'lucide-react';

export default function WorkspaceDashboard({ company }: { company: any }) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { currentCompany, inviteUser, userRole, loadWorkspaceData } = useCompany();
  const { toast } = useToast();
  const { 
    state: chatState, 
    sendMessage, 
    sendTyping, 
    selectConversation, 
    createConversation,
    pinMessage,
    unpinMessage,
    markAsRead,
    isConnected,
    isConnecting 
  } = useChat();
  const { canAccessSettings, canInviteUsers } = usePermissions();
  
  // Estados para membros e presences
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Funções auxiliares para mapear status
  const getStatusLabel = useCallback((status: string) => {
    const labels: Record<string, string> = {
      'available': 'Available',
      'focus': 'Focus',
      'meeting': 'Meeting',
      'away': 'Away',
      'break': 'Break',
      'emergency': 'Emergency',
      'offline': 'Offline',
    };
    return labels[status] || 'Offline';
  }, []);

  const getStatusColor = useCallback((status: string) => {
    const colors: Record<string, string> = {
      'available': 'bg-green-600',
      'focus': 'bg-purple-600',
      'meeting': 'bg-blue-600',
      'away': 'bg-yellow-600',
      'break': 'bg-orange-600',
      'emergency': 'bg-red-600',
      'offline': 'bg-background',
    };
    return colors[status] || 'bg-background';
  }, []);

  // Conectar WebSocket apenas para atualizações de presença
  const wsPresence = useWebSocket({
    onMessage: () => {},
    onTyping: () => {},
    onUserStatus: () => {},
    onNewConversation: () => {},
    onPresenceUpdate: (data) => {
      console.log('📢 Presença atualizada via WebSocket:', data);
      
      // Atualizar o membro específico na lista
      setTeamMembers(prevMembers => {
        return prevMembers.map(member => {
          if (member.id === data.userId) {
            const status = data.presence.status.toLowerCase();
            const now = new Date();
            return {
              ...member,
              description: data.presence.message || 'No status message',
              status: getStatusLabel(status),
              statusColor: getStatusColor(status),
              online: data.presence.isOnline,
              time: 'now',
              lastSeen: now, // Atualizar lastSeen para o momento atual
            };
          }
          return member;
        });
      });
    },
  });

  // Carregar dados da workspace quando o componente montar
  useEffect(() => {
    if (company && user && loadWorkspaceData) {
      console.log('🔍 WorkspaceDashboard: Loading workspace data for company:', company.id);
      loadWorkspaceData(company);
    }
  }, [company?.id, user?.id, loadWorkspaceData]);

  // Carregar membros e seus status
  useEffect(() => {
    if (company?.id && user) {
      loadTeamMembers();
    }
  }, [company?.id, user?.id]);

  // Atualizar o tempo relativo de todos os membros a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setTeamMembers(prevMembers => {
        return prevMembers.map(member => {
          // Se o membro tem um lastSeen armazenado, recalcular o tempo
          if (member.lastSeen) {
            return {
              ...member,
              time: getTimeAgo(member.lastSeen),
            };
          }
          return member;
        });
      });
    }, 60000); // Atualizar a cada 1 minuto

    return () => clearInterval(interval);
  }, []);

  // Função temporária para corrigir membros faltantes
  const handleFixMembers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');
      
      const response = await fetch(`${apiUrl}/companies/fix-members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('✅ Membros corrigidos:', data);
      
      toast({
        title: 'Sucesso!',
        description: `${data.fixed.length} empresa(s) corrigida(s)`,
      });

      // Recarregar dados da workspace
      if (company && loadWorkspaceData) {
        await loadWorkspaceData(company);
      }
    } catch (error) {
      console.error('❌ Erro ao corrigir membros:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao corrigir membros',
        variant: 'destructive',
      });
    }
  };

  // Carregar membros e seus status
  const loadTeamMembers = async () => {
    try {
      setLoadingMembers(true);
      const token = localStorage.getItem('auth_token');
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');

      // Buscar membros e presences em paralelo
      const [membersResponse, presencesResponse] = await Promise.all([
        fetch(`${apiUrl}/companies/${company.id}/members`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/presence/${company.id}/members`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (membersResponse.ok && presencesResponse.ok) {
        const membersData = await membersResponse.json();
        const presencesData = await presencesResponse.json();

        // Mapear presences por userId
        const presenceMap = new Map();
        presencesData.presences.forEach((p: any) => {
          presenceMap.set(p.userId, p);
        });

        // Combinar membros com seus presences
        const membersWithStatus = membersData.members.map((member: any) => {
          const presence = presenceMap.get(member.user.id);
          const status = presence?.status?.toLowerCase() || 'offline';
          
          return {
            id: member.user.id,
            name: member.user.fullName || member.user.name || member.user.email,
            title: member.role,
            description: presence?.message || 'No status message',
            status: getStatusLabel(status),
            statusColor: getStatusColor(status),
            avatar: getMemberInitials(member.user.fullName || member.user.name || member.user.email),
            online: presence?.isOnline || false,
            time: getTimeAgo(presence?.lastSeen),
            lastSeen: presence?.lastSeen, // Armazenar lastSeen para recalcular depois
            apps: [],
            extraApps: 0,
          };
        });

        setTeamMembers(membersWithStatus);
      }
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
    } finally {
      setLoadingMembers(false);
    }
  };


  // Função auxiliar para obter iniciais dos membros
  const getMemberInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Função auxiliar para obter tempo relativo
  const getTimeAgo = (date: any) => {
    if (!date) return 'unknown';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  // Recarregar membros quando o status for atualizado
  const handleStatusUpdate = () => {
    loadTeamMembers();
  };

  // Debug logs para permissões
  useEffect(() => {
    console.log('🔍 WorkspaceDashboard: userRole:', userRole);
    console.log('🔍 WorkspaceDashboard: canInviteUsers:', canInviteUsers);
    console.log('🔍 WorkspaceDashboard: canAccessSettings:', canAccessSettings);
    console.log('🔍 WorkspaceDashboard: currentCompany:', currentCompany?.name);
    console.log('🔍 WorkspaceDashboard: company prop:', company?.name);
  }, [userRole, canInviteUsers, canAccessSettings, currentCompany, company]);

  // Chat state
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isDirectMessagesOpen, setIsDirectMessagesOpen] = useState(true);
  const [isGroupsOpen, setIsGroupsOpen] = useState(true);
  const [isArchivedOpen, setIsArchivedOpen] = useState(false);
  const [archivedConversations, setArchivedConversations] = useState<any[]>([]);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);


  // Workspace popup states
  const [isWorkspacePopupOpen, setIsWorkspacePopupOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // Create group modal states
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Estados para modais de ações de conversa
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [conversationToAction, setConversationToAction] = useState<string | null>(null);

  // Estados para gerenciamento de grupos
  const [isGroupParticipantsOpen, setIsGroupParticipantsOpen] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);

  // Member list modal state
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateInviteLink = async () => {
    setIsGenerating(true);
    try {
      console.log('🔍 Gerando link de convite:', {
        role: inviteRole,
        company: currentCompany?.name,
        userRole
      });
      
      const result = await inviteUser(inviteRole);
      
      console.log('🔍 Resultado do convite:', result);
      
      if (result.success) {
        const invitationUrl = result.data?.invitationUrl || result.data?.invitePath;
        
        if (invitationUrl) {
          setGeneratedLink(invitationUrl);
          
          // Copiar link para clipboard automaticamente
          if (navigator.clipboard) {
            navigator.clipboard.writeText(invitationUrl).then(() => {
              toast({
                title: 'Link Gerado!',
                description: 'Link de convite copiado para a área de transferência',
                duration: 5000,
              });
            }).catch(err => {
              console.log('❌ Erro ao copiar link:', err);
              toast({
                title: 'Link Gerado!',
                description: 'Link de convite gerado com sucesso',
                duration: 5000,
              });
            });
          } else {
            toast({
              title: 'Link Gerado!',
              description: 'Link de convite gerado com sucesso',
              duration: 5000,
            });
          }
        }
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Falha ao gerar link de convite',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao gerar convite:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao gerar link de convite',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (generatedLink && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(generatedLink);
        toast({
          title: 'Copiado!',
          description: 'Link copiado para a área de transferência',
        });
      } catch (err) {
        console.error('Erro ao copiar:', err);
      }
    }
  };

  const handleCloseInviteDialog = () => {
    setIsInviteDialogOpen(false);
    setGeneratedLink(null);
    setIsWorkspacePopupOpen(false);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a group name',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingGroup(true);
    try {
      const conversation = await createConversation(groupName, [], 'GROUP');
      if (conversation) {
        toast({
          title: 'Grupo criado',
          description: `Grupo "${groupName}" foi criado com sucesso`,
        });
        setGroupName('');
        setIsCreateGroupDialogOpen(false);
        // Selecionar o grupo recém-criado
        handleSelectChat(conversation.id);
        // Garantir que o chat esteja expandido
        setIsChatExpanded(true);
        setIsChatCollapsed(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create group',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const getCompanyInitials = (name: string) => {
    if (!name || typeof name !== 'string') return 'C';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUserInitials = (name: string) => {
    if (!name || typeof name !== 'string') return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUserDisplayName = () => {
    return user?.fullName || user?.email?.split('@')[0] || 'User';
  };

  // Separar conversas por tipo e remover duplicatas
  const directMessages = chatState.conversations
    .filter(conv => conv.type === 'DIRECT')
    .reduce((acc: any[], current: any) => {
      // Verificar se já existe uma conversa direta com os mesmos participantes
      const existingConv = acc.find(conv => {
        if (conv.type !== 'DIRECT') return false;
        const currentParticipants = current.participants?.map((p: any) => p.userId).sort() || [];
        const existingParticipants = conv.participants?.map((p: any) => p.userId).sort() || [];
        return JSON.stringify(currentParticipants) === JSON.stringify(existingParticipants);
      });
      
      if (!existingConv) {
        acc.push(current);
      }
      return acc;
    }, []);
    
  const groups = chatState.conversations.filter(conv => conv.type === 'GROUP');

  // Função para obter as mensagens do chat selecionado
  const getCurrentMessages = () => {
    if (!selectedChat) return [];
    const messages = chatState.messages[selectedChat] || [];
    
    // Remover duplicatas baseado no ID da mensagem
    const uniqueMessages = messages.reduce((acc: any[], current: any) => {
      const existingMessage = acc.find(msg => msg.id === current.id);
      if (!existingMessage) {
        acc.push(current);
      }
      return acc;
    }, []);
    
    return uniqueMessages;
  };

  // Função para obter mensagens fixadas
  const getPinnedMessages = () => {
    if (!selectedChat) return [];
    const messages = getCurrentMessages();
    const pinnedMessages = messages.filter(msg => msg.isPinned);
    console.log('🔍 Debug - Mensagens fixadas:', {
      totalMessages: messages.length,
      pinnedMessages: pinnedMessages.length,
      selectedChat,
      messages: messages.map(m => ({ id: m.id, isPinned: m.isPinned, content: m.content.substring(0, 20) }))
    });
    return pinnedMessages;
  };

  // Função para obter mensagens normais (não fixadas)
  const getNormalMessages = () => {
    if (!selectedChat) return [];
    return getCurrentMessages().filter(msg => !msg.isPinned);
  };

  // Função para contar mensagens fixadas
  const getPinnedCount = () => {
    return getPinnedMessages().length;
  };

  // Função para calcular mensagens não lidas baseada no estado do chat
  const getUnreadCount = (conversationId: string) => {
    const conversation = chatState.conversations.find(conv => conv.id === conversationId);
    if (!conversation) return 0;

    // Se o chat está aberto (selectedChat === conversationId), não há mensagens não lidas
    if (selectedChat === conversationId) {
      return 0;
    }

    // Se o chat está fechado, calcular baseado nas mensagens
    const messages = chatState.messages[conversationId] || [];
    const lastReadMessageId = (conversation as any).lastReadMessageId || null;
    
    if (!lastReadMessageId) {
      // Se nunca leu, todas as mensagens são não lidas
      return messages.length;
    }

    // Encontrar a posição da última mensagem lida
    const lastReadIndex = messages.findIndex(msg => msg.id === lastReadMessageId);
    if (lastReadIndex === -1) {
      // Se não encontrou a mensagem, todas são não lidas
      return messages.length;
    }

    // Retornar o número de mensagens após a última lida
    return messages.length - lastReadIndex - 1;
  };

  // Função para obter informações do chat selecionado
  const getCurrentChatInfo = () => {
    if (!selectedChat) return null;
    const conversation = chatState.conversations.find(conv => conv.id === selectedChat);
    console.log('🔍 getCurrentChatInfo:', { selectedChat, conversation, totalConversations: chatState.conversations.length });
    return conversation;
  };

  // Verificar se há conversas disponíveis
  const hasConversations = chatState.conversations.length > 0;
  
  // Chat deve estar fechado se não há conversas
  useEffect(() => {
    if (!hasConversations) {
      setIsChatExpanded(false);
      setSelectedChat(null);
    }
  }, [hasConversations]);

  // Função estável para marcar como lida
  const handleMarkAsRead = useCallback((conversationId: string, messageId: string) => {
    markAsRead(conversationId, messageId);
  }, [markAsRead]);

  // Marcar mensagens como lidas quando o chat é aberto
  useEffect(() => {
    if (selectedChat && chatState.messages[selectedChat]?.length > 0) {
      const messages = chatState.messages[selectedChat];
      const lastMessage = messages[messages.length - 1];
      
      // Marcar a última mensagem como lida (só se for de outro usuário)
      if (lastMessage && lastMessage.userId !== user?.id) {
        // Verificar se já foi marcada como lida para evitar loops
        const conversation = chatState.conversations.find(conv => conv.id === selectedChat);
        if (conversation && (conversation as any).lastReadMessageId !== lastMessage.id) {
          handleMarkAsRead(selectedChat, lastMessage.id);
        }
      }
    }
  }, [selectedChat, user?.id, chatState.messages, chatState.conversations, handleMarkAsRead]);

  // Função para enviar mensagem
  const handleSendMessage = () => {
    if (!message.trim() || !selectedChat) return;
    
    sendMessage(message, selectedChat);
    setMessage('');
    
    // Parar indicador de digitação
    if (isTyping) {
      sendTyping(selectedChat, false);
      setIsTyping(false);
    }
  };

  // Função para lidar com digitação
  const handleTyping = (value: string) => {
    setMessage(value);
    
    if (!selectedChat) return;
    
    if (value.trim() && !isTyping) {
      sendTyping(selectedChat, true);
      setIsTyping(true);
    } else if (!value.trim() && isTyping) {
      sendTyping(selectedChat, false);
      setIsTyping(false);
    }
    
    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Parar indicador de digitação após 3 segundos
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        sendTyping(selectedChat, false);
        setIsTyping(false);
      }
    }, 3000);
  };

  // Função para selecionar conversa
  const handleSelectChat = (conversationId: string) => {
    setSelectedChat(conversationId);
    selectConversation(conversationId);
    setIsChatExpanded(true);
    setIsChatCollapsed(false);
  };

  // Sincronizar selectedChat local com o ChatContext
  useEffect(() => {
    if (chatState.selectedConversation && chatState.selectedConversation !== selectedChat) {
      setSelectedChat(chatState.selectedConversation);
    }
  }, [chatState.selectedConversation, selectedChat]);

  // Carregar conversas arquivadas
  const loadArchivedConversations = async () => {
    if (!company?.id) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/conversations?companyId=${company.id}&archived=true`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setArchivedConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas arquivadas:', error);
    }
  };

  // Carregar arquivadas quando abrir a seção
  useEffect(() => {
    if (isArchivedOpen && archivedConversations.length === 0) {
      loadArchivedConversations();
    }
  }, [isArchivedOpen]);

  // Abrir modal de deletar conversa
  const openDeleteDialog = (conversationId: string) => {
    setConversationToAction(conversationId);
    setIsDeleteDialogOpen(true);
  };

  // Deletar conversa
  const handleDeleteConversation = async () => {
    if (!conversationToAction) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversations/${conversationToAction}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar conversa');
      }

      toast({
        title: 'Conversa deletada',
        description: 'A conversa foi deletada com sucesso.',
      });

      // Fechar modal e chat, recarregar conversas
      setIsDeleteDialogOpen(false);
      setConversationToAction(null);
      setSelectedChat(null);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao deletar conversa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar a conversa.',
        variant: 'destructive',
      });
      setIsDeleteDialogOpen(false);
    }
  };

  // Abrir modal de arquivar conversa
  const openArchiveDialog = (conversationId: string) => {
    setConversationToAction(conversationId);
    setIsArchiveDialogOpen(true);
  };

  // Arquivar conversa
  const handleArchiveConversation = async () => {
    if (!conversationToAction) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversations/${conversationToAction}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao arquivar conversa');
      }

      toast({
        title: 'Conversa arquivada',
        description: 'A conversa foi arquivada com sucesso.',
      });

      // Fechar modal e chat, recarregar conversas
      setIsArchiveDialogOpen(false);
      setConversationToAction(null);
      setSelectedChat(null);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao arquivar conversa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível arquivar a conversa.',
        variant: 'destructive',
      });
      setIsArchiveDialogOpen(false);
    }
  };

  // Desarquivar conversa
  const handleUnarchiveConversation = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversations/${conversationId}/unarchive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao desarquivar conversa');
      }

      toast({
        title: 'Conversa desarquivada',
        description: 'A conversa foi restaurada para sua lista.',
      });

      // Recarregar conversas arquivadas e conversas normais
      loadArchivedConversations();
      window.location.reload();
    } catch (error) {
      console.error('Erro ao desarquivar conversa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível desarquivar a conversa.',
        variant: 'destructive',
      });
    }
  };


  return (
    <div className="h-screen bg-background text-white flex flex-col">
      {/* Workspace Header */}
      <WorkspaceHeader company={company || currentCompany} />
      
      {/* Top Header - User Info + Search/Sort/Create Group - Fixed */}
      <div className="bg-background border-b border-zinc-800 px-5 py-6 flex items-center justify-between fixed top-0 left-0 md:left-64 right-0 z-50">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="md:hidden text-gray-400 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Botão temporário para corrigir membros */}
        {!userRole && (
          <Button
            onClick={handleFixMembers}
            className="bg-red-600 hover:bg-red-700 text-white font-bold"
            size="sm"
          >
            🔧 Corrigir Permissões
          </Button>
        )}

        {/* Search/Sort/Create Group */}
        <div className="flex items-center space-x-4 justify-between w-full mx-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search team members..."
              className="pl-10 bg-background border-2 border-zinc-700 text-white h-full"
            />
          </div>
          <div className='flex items-center space-x-4'>
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white border">
              Sort <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
            <Button 
              size="sm" 
              className="bg-white hover:bg-white/80"
              onClick={() => setIsCreateGroupDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Create Group
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-background bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Direct Messages, Groups, Status */}
        <div className={`w-64 bg-background border-r border-zinc-800 flex flex-col transition-transform duration-300 ${isMobileSidebarOpen ? 'fixed left-0 top-0 h-screen z-40 translate-x-0' : 'hidden md:flex'
          }`}>
          {/* User Info */}
          <div className="flex justify-between items-center space-x-4 px-5 py-[14.5px] border-b border-zinc-800">
            <DropdownMenu open={isWorkspacePopupOpen} onOpenChange={setIsWorkspacePopupOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-auto hover:bg-background p-2">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-white/10 text-white">
                      {getUserInitials(user?.fullName || user?.email || 'User')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-sm">{getUserDisplayName()}</span>
                    <UserRoleBadge />
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <div className="px-2 py-1.5 text-xs text-gray-400">
                  <p className="font-semibold">{user?.email}</p>
                  <p className="text-xs">
                    {userRole === 'OWNER' ? 'Owner' : userRole === 'ADMIN' ? 'Admin' : 'Member'}
                  </p>
                </div>
                <DropdownMenuSeparator />
                {canInviteUsers ? (
                  <DropdownMenuItem onClick={() => setIsInviteDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span>Gerar Link de Convite</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled className="opacity-50">
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span>Gerar Link de Convite</span>
                  </DropdownMenuItem>
                )}
                {canAccessSettings ? (
                  <DropdownMenuItem onClick={() => router.push('/workspaces/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled className="opacity-50">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Bell className="w-5 h-5 text-gray-400" />
          </div>

          {/* Direct Messages */}
          <div className="flex-1 p-4">

            <div
              className="flex items-center justify-between cursor-pointer mb-4"
              onClick={() => setIsDirectMessagesOpen(!isDirectMessagesOpen)}
            >
              <span className="text-sm font-medium text-gray-300">Direct Messages</span>
              {isDirectMessagesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>

            {isDirectMessagesOpen && (
              <div className="space-y-2">
                {directMessages.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMemberListOpen(true)}
                    className="w-full bg-transparent border-zinc-600 hover:bg-zinc-700 text-white mb-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Conversa
                  </Button>
                )}
                
                {directMessages.length > 0 ? (
                  directMessages.map((dm) => {
                    const otherParticipant = dm.participants?.find((p: any) => p.userId !== user?.id);
                    const isOnline = chatState.onlineUsers.has(otherParticipant?.userId || '');
                    const unreadCount = getUnreadCount(dm.id);
                    
                    return (
                      <div
                        key={dm.id}
                        className={`flex items-center justify-between p-2 rounded hover:bg-white/10 cursor-pointer ${selectedChat === dm.id ? 'bg-white/10' : ''
                          }`}
                        onClick={() => handleSelectChat(dm.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-background text-white text-xs">
                                {otherParticipant ? getUserInitials(otherParticipant.user.fullName) : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            {isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                            )}
                          </div>
                          <span className="text-sm">
                            {otherParticipant ? 
                              (otherParticipant.user.fullName || otherParticipant.user.email?.split('@')[0] || 'Unknown User') : 
                              'Unknown User'
                            }
                          </span>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          {unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white text-xs">
                              {unreadCount}
                            </Badge>
                          )}
                          
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-400">Nenhuma conversa direta</p>
                  </div>
                )}
              </div>
            )}

            {/* Groups */}
            <div className="mt-6">
              <div
                className="flex items-center justify-between cursor-pointer mb-4"
                onClick={() => setIsGroupsOpen(!isGroupsOpen)}
              >
                <span className="text-sm font-medium text-gray-300">Groups</span>
                {isGroupsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>

              {isGroupsOpen && (
                <div className="space-y-2">
                  {groups.length > 0 ? (
                    groups.map((group) => {
                      const unreadCount = group.unreadCount || 0;
                      const groupInitials = group.title.split(' ').map((word: string) => word[0]).join('').toUpperCase().slice(0, 2);
                      
                      return (
                        <div
                          key={group.id}
                          className={`flex items-center justify-between p-2 rounded hover:bg-white/10 cursor-pointer ${selectedChat === group.id ? 'bg-white/10' : ''
                            }`}
                          onClick={() => handleSelectChat(group.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">{groupInitials}</span>
                            </div>
                            <span className="text-sm">{group.title}</span>
                          </div>
                          {unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white text-xs">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-400">Nenhum grupo</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Archived */}
            <div className="mt-6">
              <div
                className="flex items-center justify-between cursor-pointer mb-4"
                onClick={() => setIsArchivedOpen(!isArchivedOpen)}
              >
                <span className="text-sm font-medium text-gray-300">Archived</span>
                {isArchivedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>

              {isArchivedOpen && (
                <div className="space-y-2">
                  {archivedConversations.length > 0 ? (
                    archivedConversations.map((conversation) => {
                      const isGroup = conversation.type === 'GROUP';
                      const otherParticipant = isGroup ? null : conversation.participants?.find((p: any) => p.userId !== user?.id);
                      const displayName = isGroup 
                        ? conversation.title 
                        : (otherParticipant?.user?.fullName || otherParticipant?.user?.email?.split('@')[0] || 'Unknown');
                      
                      const initials = isGroup
                        ? conversation.title.split(' ').map((word: string) => word[0]).join('').toUpperCase().slice(0, 2)
                        : getUserInitials(otherParticipant?.user?.fullName || otherParticipant?.user?.email || 'U');

                      return (
                        <div
                          key={conversation.id}
                          className="flex items-center justify-between p-2 rounded hover:bg-white/10 group"
                        >
                          <div 
                            className="flex items-center space-x-3 flex-1 cursor-pointer"
                            onClick={() => handleSelectChat(conversation.id)}
                          >
                            <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">{initials}</span>
                            </div>
                            <span className="text-sm text-gray-400">{displayName}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnarchiveConversation(conversation.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Desarquivar"
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-400">Nenhuma conversa arquivada</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Status Section */}
          <div className="p-4 border-t-2 border-zinc-800">
            <StatusSelector 
              companyId={company?.id || currentCompany?.id}
              onStatusUpdate={handleStatusUpdate}
              className="bg-background border-zinc-700"
            />
          </div>
        </div>

        {/* Center Area - Team Members Grid */}
        <div className="flex-1 bg-background p-6 overflow-y-auto" style={{
            marginTop: '0px'    // Sem margem superior
          }}>
          
          {loadingMembers ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400">Nenhum membro encontrado</p>
            </div>
          ) : (
            <div className={`grid gap-4 ${isChatExpanded && !isChatCollapsed ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-background rounded-lg p-4 hover:bg-background transition-colors border-2 border-zinc-800">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-white/10 text-white text-sm font-semibold">
                          {member.avatar}
                        </AvatarFallback>
                      </Avatar>
                      {member.online && (
                        <div className="absolute -bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-700"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{member.name}</h3>
                      <p className="text-sm text-gray-300">{member.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">{member.time}</span>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-300 mb-3 line-clamp-2">{member.description}</p>

                {/* Status and Apps */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${member.statusColor} text-white`}>
                      {member.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* @ts-ignore */}
                    {member.apps.slice(0, 2).map((app: string, index: number) => (
                      <div key={index} className="w-6 h-6 bg-background rounded flex items-center justify-center">
                        <span className="text-xs text-white font-semibold">
                          {app.charAt(0)}
                        </span>
                      </div>
                    ))}
                    {member.extraApps > 0 && (
                      <div className="w-6 h-6 bg-background rounded flex items-center justify-center">
                        <span className="text-xs text-white font-semibold">
                          +{member.extraApps}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Right Sidebar - Chat Conversation */}
        <div className={`bg-background border-l-2 border-stone-800 transition-all duration-300 flex flex-col ${!isChatExpanded ? 'w-0 overflow-hidden' : isChatCollapsed ? 'w-96' : 'w-full md:w-6/12'
          }`}>
          {!isChatExpanded && (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsChatExpanded(true);
                  setIsChatCollapsed(false);
                }}
                className="text-gray-400 hover:text-white"
                title="Abrir chat"
              >
                <MessageCircle className="w-6 h-6" />
              </Button>
            </div>
          )}
          {isChatExpanded && (
            <div className="flex-1 flex flex-col h-full">
              {!selectedChat ? (
                // Estado quando nenhuma conversa está selecionada
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Nenhuma conversa selecionada</h3>
                    <p className="text-gray-400 mb-6">
                      {hasConversations 
                        ? 'Selecione uma conversa na barra lateral para começar a conversar'
                        : 'Crie uma conversa ou grupo para começar a conversar'
                      }
                    </p>
                    {!hasConversations && (
                      <Button 
                        onClick={() => setIsCreateGroupDialogOpen(true)}
                        className="bg-white hover:bg-white/90 text-black"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Primeiro Grupo
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-white/10 text-white text-xs">
                          {getCurrentChatInfo()?.type === 'DIRECT' 
                            ? (() => {
                                const otherParticipant = getCurrentChatInfo()?.participants?.find(p => p.userId !== user?.id);
                                return otherParticipant ? getUserInitials(otherParticipant.user.fullName) : 'U';
                              })()
                            : (() => {
                                const title = getCurrentChatInfo()?.title || '';
                                return title.split(' ').map((word: string) => word[0]).join('').toUpperCase().slice(0, 2);
                              })()
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {getCurrentChatInfo()?.type === 'DIRECT' 
                            ? (() => {
                                const otherParticipant = getCurrentChatInfo()?.participants?.find(p => p.userId !== user?.id);
                                return otherParticipant ? 
                                  (otherParticipant.user.fullName || otherParticipant.user.email?.split('@')[0] || 'Unknown User') : 
                                  'Unknown User';
                              })()
                            : getCurrentChatInfo()?.title || 'Unknown'
                          }
                        </span>
                        {getCurrentChatInfo()?.type === 'GROUP' && (
                          <span className="text-xs text-gray-400">
                            {getCurrentChatInfo()?.participants?.length || 0} participantes
                            {getCurrentChatInfo()?.description && ` • ${getCurrentChatInfo()?.description}`}
                          </span>
                        )}
                      </div>
                    </div>
                <div className="flex items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {getCurrentChatInfo()?.type === 'GROUP' && (
                        <>
                          <DropdownMenuItem onClick={() => setIsGroupParticipantsOpen(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            <span>Gerenciar participantes</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsGroupSettingsOpen(true)}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Configurações do grupo</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={() => openArchiveDialog(selectedChat!)}>
                        <Archive className="mr-2 h-4 w-4" />
                        <span>Arquivar conversa</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => openDeleteDialog(selectedChat!)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Deletar conversa</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsChatCollapsed(!isChatCollapsed)}
                    title={isChatCollapsed ? "Expandir chat" : "Colapsar chat"}
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsChatExpanded(false)}
                    title="Fechar chat"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Pinned Messages */}
              {getPinnedCount() > 0 && (
                <div className="p-4 border bg-white/5 border-zinc-700">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Pin className="w-4 h-4" />
                    <span className="text-sm">
                      {getPinnedCount()} {getPinnedCount() === 1 ? 'mensagem fixada' : 'mensagens fixadas'}
                    </span>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {/* Mensagens Fixadas */}
                {getPinnedMessages().length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-3 px-2">
                      <span className="text-yellow-400 text-sm font-medium">📌 Mensagens Fixadas ({getPinnedCount()})</span>
                    </div>
                    <div className="space-y-2">
                      {getPinnedMessages().map((msg: any, index: number) => {
                        const isOwn = msg.userId === user?.id;
                        const senderInitials = getUserInitials(msg.user.fullName);
                        
                        return (
                          <div key={`pinned-${msg.id}-${index}-${msg.createdAt}`} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex space-x-2 max-w-xs ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                              {!isOwn && (
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="bg-white/5 text-white text-xs">
                                    {senderInitials}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className={`${isOwn ? 'flex-row-reverse space-x-reverse' : ''} flex space-x-2`}>
                                <div className={`px-3 py-2 rounded-lg border-2 border-yellow-400/30 ${isOwn
                                  ? 'bg-yellow-400/20 text-black'
                                  : 'bg-yellow-400/20 text-white'
                                  }`}>
                                  <p className="text-sm">{msg.content}</p>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs opacity-70">
                                      {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { 
                                        hour: '2-digit', minute: '2-digit' 
                                      })}
                                    </span>
                                    <div className="flex items-center space-x-1">
                                      <span className="text-xs opacity-70">📌</span>
                                      {msg.pinnedBy && (
                                        <span className="text-xs opacity-70">
                                          por {msg.pinnedBy === user?.id ? 'você' : 'outro usuário'}
                                        </span>
                                      )}
                                      <button
                                        onClick={() => unpinMessage(selectedChat!, msg.id)}
                                        className="text-xs opacity-70 hover:opacity-100 transition-opacity"
                                        title="Desfixar mensagem"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mensagens Normais */}
                {getNormalMessages().map((msg: any, index: number) => {
                  const isOwn = msg.userId === user?.id;
                  const senderInitials = getUserInitials(msg.user.fullName);
                  
                  return (
                    <div key={`${msg.id}-${index}-${msg.createdAt}`} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex space-x-2 max-w-xs ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {!isOwn && (
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-white/5 text-white text-xs">
                              {senderInitials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`${isOwn ? 'flex-row-reverse space-x-reverse' : ''} flex space-x-2`}>
                          <div className={`px-3 py-2 rounded-lg ${isOwn
                            ? 'bg-white/90 text-black'
                            : 'bg-white/10 text-white'
                            }`}>
                            <p className="text-sm">{msg.content}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs opacity-70">
                                {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', minute: '2-digit' 
                                })}
                              </span>
                              <button
                                onClick={() => pinMessage(selectedChat!, msg.id)}
                                className="text-xs opacity-70 hover:opacity-100 transition-opacity"
                                title="Fixar mensagem"
                              >
                                📌
                              </button>
                            </div>
                          </div>
                          {isOwn && (
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-white/5 text-white text-xs">
                                {getUserInitials(user?.fullName || 'U')}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Indicador de digitação */}
                {selectedChat && chatState.typingUsers[selectedChat] && chatState.typingUsers[selectedChat].length > 0 && (
                  <div className="flex justify-start">
                    <div className="flex items-center space-x-2 bg-white/5 rounded-lg px-3 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {chatState.typingUsers[selectedChat].map(u => {
                          // Buscar o nome do usuário que está digitando
                          const currentChat = getCurrentChatInfo();
                          const participant = currentChat?.participants?.find((p: any) => p.userId === u.userId);
                          return participant?.user?.fullName || participant?.user?.email?.split('@')[0] || 'Alguém';
                        }).join(', ')} está digitando...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t-2 border-zinc-800">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 bg-background border-zinc-700 text-white"
                    disabled={!selectedChat || !isConnected}
                  />
                  <Button 
                    size="sm" 
                    className="bg-white hover:bg-white/90"
                    onClick={handleSendMessage}
                    disabled={!message.trim() || !selectedChat || !isConnected}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Status de conexão */}
                <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center space-x-2">
                    {isConnecting && (
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    )}
                    {isConnected && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                    {!isConnected && !isConnecting && (
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                    <span>
                      {isConnecting ? 'Conectando...' : isConnected ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                </div>
              </div>
                </>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Create Group Dialog */}
      <Dialog open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Grupo</DialogTitle>
            <DialogDescription>
              Crie um novo grupo para conversar com sua equipe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Nome do Grupo</Label>
              <Input
                id="groupName"
                placeholder="Digite o nome do grupo"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateGroup();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateGroupDialogOpen(false);
              setGroupName('');
            }}>
              Cancelar
            </Button>
            <Button onClick={handleCreateGroup} disabled={isCreatingGroup || !groupName.trim()}>
              {isCreatingGroup ? 'Criando...' : 'Criar Grupo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={handleCloseInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Link de Convite</DialogTitle>
            <DialogDescription>
              Gere um link de convite para compartilhar com novos membros.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role do Membro</Label>
              <Select value={inviteRole} onValueChange={(value: 'MEMBER' | 'ADMIN') => setInviteRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Member</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ADMIN">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>Admin</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {generatedLink ? (
              <div className="space-y-3">
                <Label>Link de Convite Gerado</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={generatedLink}
                    readOnly
                    className="bg-gray-100 text-gray-800"
                  />
                  <Button
                    onClick={handleCopyLink}
                    size="sm"
                    variant="outline"
                  >
                    Copiar
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Compartilhe este link com quem você quer convidar para a workspace.
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">
                  Clique em "Gerar Link" para criar um link de convite.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseInviteDialog}>
              {generatedLink ? 'Fechar' : 'Cancelar'}
            </Button>
            {!generatedLink && (
              <Button onClick={handleGenerateInviteLink} disabled={isGenerating}>
                {isGenerating ? 'Gerando...' : 'Gerar Link'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member List Dialog */}
      <Dialog open={isMemberListOpen} onOpenChange={setIsMemberListOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Iniciar Conversa</DialogTitle>
            <DialogDescription>
              Escolha um membro para iniciar uma conversa.
            </DialogDescription>
          </DialogHeader>
          <MemberList 
            companyId={company.id} 
            onClose={() => setIsMemberListOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Delete Conversation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar Conversa</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar esta conversa? Esta ação não pode ser desfeita e todas as mensagens serão permanentemente removidas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setConversationToAction(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConversation}
            >
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Conversation Dialog */}
      <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arquivar Conversa</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja arquivar esta conversa? Ela será removida da sua lista de conversas, mas você poderá acessá-la novamente depois.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsArchiveDialogOpen(false);
                setConversationToAction(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleArchiveConversation}
            >
              Arquivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Participants Dialog */}
      {selectedChat && (
        <GroupParticipants
          conversationId={selectedChat}
          isOpen={isGroupParticipantsOpen}
          onClose={() => setIsGroupParticipantsOpen(false)}
        />
      )}

      {/* Group Settings Dialog */}
      {selectedChat && (
        <GroupSettings
          conversationId={selectedChat}
          isOpen={isGroupSettingsOpen}
          onClose={() => setIsGroupSettingsOpen(false)}
        />
      )}

    </div>
  );
}