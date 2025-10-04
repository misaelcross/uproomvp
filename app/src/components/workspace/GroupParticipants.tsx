'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { X, UserPlus, Search, User } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface GroupParticipantsProps {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function GroupParticipants({ conversationId, isOpen, onClose }: GroupParticipantsProps) {
  const { user } = useAuth();
  const { state: chatState } = useChat();
  const { toast } = useToast();
  
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [currentParticipants, setCurrentParticipants] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingMember, setAddingMember] = useState<string | null>(null);

  // Obter informações da conversa atual
  const currentConversation = chatState.conversations.find(conv => conv.id === conversationId);

  // Carregar todos os membros da empresa
  const loadAllMembers = async () => {
    if (!currentConversation?.companyId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/companies/${currentConversation.companyId}/members`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const members = data.members.map((member: any) => ({
          id: member.user.id,
          name: member.user.fullName || member.user.name || member.user.email,
          email: member.user.email,
          avatar: member.user.avatar,
          role: member.role,
        }));
        setAllMembers(members);
      }
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os membros',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar participantes atuais
  const loadCurrentParticipants = () => {
    if (currentConversation?.participants) {
      const participants = currentConversation.participants.map((p: any) => ({
        id: p.user.id,
        name: p.user.fullName || p.user.name || p.user.email,
        email: p.user.email,
        avatar: p.user.avatar,
        role: 'MEMBER', // Role no grupo, não na empresa
      }));
      setCurrentParticipants(participants);
    }
  };

  // Adicionar participante ao grupo
  const handleAddParticipant = async (memberId: string) => {
    try {
      setAddingMember(memberId);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/conversations/${conversationId}/participants`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: memberId }),
        }
      );

      if (response.ok) {
        toast({
          title: 'Participante adicionado',
          description: 'O membro foi adicionado ao grupo com sucesso',
        });
        // Recarregar conversas para atualizar a lista
        window.location.reload();
      } else {
        throw new Error('Erro ao adicionar participante');
      }
    } catch (error) {
      console.error('Erro ao adicionar participante:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o participante',
        variant: 'destructive',
      });
    } finally {
      setAddingMember(null);
    }
  };

  // Remover participante do grupo
  const handleRemoveParticipant = async (memberId: string) => {
    if (memberId === user?.id) {
      toast({
        title: 'Ação não permitida',
        description: 'Você não pode remover a si mesmo do grupo',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/conversations/${conversationId}/participants/${memberId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast({
          title: 'Participante removido',
          description: 'O membro foi removido do grupo',
        });
        // Recarregar conversas para atualizar a lista
        window.location.reload();
      } else {
        throw new Error('Erro ao remover participante');
      }
    } catch (error) {
      console.error('Erro ao remover participante:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o participante',
        variant: 'destructive',
      });
    }
  };

  // Filtrar membros disponíveis (não participantes)
  const getAvailableMembers = () => {
    const participantIds = currentParticipants.map(p => p.id);
    return allMembers.filter(member => !participantIds.includes(member.id));
  };

  // Filtrar por termo de busca
  const getFilteredMembers = () => {
    const available = getAvailableMembers();
    if (!searchTerm.trim()) return available;
    
    return available.filter(member => 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getUserInitials = (name: string) => {
    if (!name || typeof name !== 'string') return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  useEffect(() => {
    if (isOpen) {
      loadAllMembers();
      loadCurrentParticipants();
    }
  }, [isOpen, currentConversation]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar Participantes</DialogTitle>
          <DialogDescription>
            Adicione ou remova membros do grupo "{currentConversation?.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Participantes Atuais */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Participantes ({currentParticipants.length})</h4>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {currentParticipants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-white/10 text-white text-xs">
                        {getUserInitials(participant.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{participant.name}</p>
                      <p className="text-xs text-gray-400">{participant.email}</p>
                    </div>
                    {participant.id === user?.id && (
                      <Badge variant="secondary" className="text-xs">Você</Badge>
                    )}
                  </div>
                  {participant.id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveParticipant(participant.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Adicionar Participantes */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Adicionar Membros</h4>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar membros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-zinc-700"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              ) : (
                getFilteredMembers().map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-white/10 text-white text-xs">
                          {getUserInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-gray-400">{member.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddParticipant(member.id)}
                      disabled={addingMember === member.id}
                      className="text-green-400 hover:text-green-300"
                    >
                      {addingMember === member.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))
              )}
              {!loading && getFilteredMembers().length === 0 && (
                <div className="text-center py-4 text-gray-400">
                  {searchTerm ? 'Nenhum membro encontrado' : 'Todos os membros já estão no grupo'}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
