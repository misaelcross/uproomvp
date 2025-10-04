'use client';

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Search, User } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';

interface Member {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
}

interface MemberListProps {
  companyId: string;
  onClose: () => void;
}

export default function MemberList({ companyId, onClose }: MemberListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { createConversation, state: chatState } = useChat();

  useEffect(() => {
    fetchMembers();
  }, [companyId]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = members.filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [searchTerm, members]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');
      const token = localStorage.getItem('auth_token');
      
      console.log('🔍 MemberList: Carregando membros para company:', companyId);
      console.log('🔍 MemberList: Token encontrado:', !!token);
      console.log('🔍 MemberList: Token (primeiros 20 chars):', token ? token.substring(0, 20) + '...' : 'null');
      console.log('🔍 MemberList: URL:', `${apiUrl}/companies/${companyId}/members`);
      
      const response = await fetch(`${apiUrl}/companies/${companyId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 MemberList: Resposta do servidor:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ MemberList: Erro na resposta:', errorText);
        console.error('❌ MemberList: Status:', response.status);
        console.error('❌ MemberList: StatusText:', response.statusText);
        throw new Error(`Erro ao carregar membros: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 MemberList: Dados recebidos:', data);
      console.log('🔍 MemberList: Total de membros:', data.members?.length || 0);
      console.log('🔍 MemberList: Usuário atual:', user?.id);
      
      // Filtrar o usuário atual da lista
      const otherMembers = data.members.filter((member: any) => member.user.id !== user?.id);
      console.log('🔍 MemberList: Outros membros (após filtro):', otherMembers.length);
      
      setMembers(otherMembers.map((member: any) => ({
        id: member.user.id,
        email: member.user.email,
        name: member.user.name || member.user.fullName || member.user.email,
        avatar: member.user.avatar,
        role: member.role,
      })));
    } catch (err) {
      console.error('Erro ao carregar membros:', err);
      setError('Erro ao carregar membros');
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async (memberId: string, memberName: string) => {
    try {
      // Verificar se já existe uma conversa direta com esta pessoa
      const existingConversation = chatState.conversations.find(conv => {
        if (conv.type !== 'DIRECT') return false;
        const participants = conv.participants?.map(p => p.userId) || [];
        return participants.includes(memberId) && participants.includes(user?.id || '');
      });

      if (existingConversation) {
        // Se já existe, apenas fechar o modal e selecionar a conversa existente
        onClose();
        return;
      }

      const conversation = await createConversation(
        `Conversa com ${memberName}`,
        [memberId],
        'DIRECT'
      );

      if (conversation) {
        onClose();
      }
    } catch (err) {
      console.error('Erro ao criar conversa:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-400 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Iniciar Conversa</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar membros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background border-zinc-700 text-white"
          />
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredMembers.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            {searchTerm ? 'Nenhum membro encontrado' : 'Nenhum membro disponível'}
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className="bg-zinc-600 text-white">
                    {member.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-white font-medium">{member.name}</div>
                  <div className="text-gray-400 text-sm">{member.email}</div>
                  <Badge variant="secondary" className="text-xs">
                    {member.role}
                  </Badge>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStartConversation(member.id, member.name)}
                className="bg-transparent border-zinc-600 hover:bg-zinc-700 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Conversar
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
