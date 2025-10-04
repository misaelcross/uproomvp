'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, X } from 'lucide-react';

interface GroupSettingsProps {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function GroupSettings({ conversationId, isOpen, onClose }: GroupSettingsProps) {
  const { state: chatState } = useChat();
  const { toast } = useToast();
  
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Obter informações da conversa atual
  const currentConversation = chatState.conversations.find(conv => conv.id === conversationId);

  // Carregar dados atuais do grupo
  useEffect(() => {
    if (currentConversation) {
      setGroupName(currentConversation.title || '');
      setGroupDescription(currentConversation.description || '');
    }
  }, [currentConversation]);

  // Salvar configurações do grupo
  const handleSaveSettings = async () => {
    if (!groupName.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome do grupo é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/conversations/${conversationId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: groupName.trim(),
            description: groupDescription.trim(),
          }),
        }
      );

      if (response.ok) {
        toast({
          title: 'Configurações salvas',
          description: 'As configurações do grupo foram atualizadas com sucesso',
        });
        onClose();
        // Recarregar conversas para atualizar a lista
        window.location.reload();
      } else {
        throw new Error('Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Configurações do Grupo</span>
          </DialogTitle>
          <DialogDescription>
            Edite as informações do grupo "{currentConversation?.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="groupName" className="text-sm font-medium text-gray-300">
              Nome do Grupo
            </label>
            <Input
              id="groupName"
              placeholder="Digite o nome do grupo"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="bg-background border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="groupDescription" className="text-sm font-medium text-gray-300">
              Descrição (opcional)
            </label>
            <Textarea
              id="groupDescription"
              placeholder="Digite uma descrição para o grupo"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="bg-background border-zinc-700 min-h-[80px]"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSaveSettings} disabled={isSaving || !groupName.trim()}>
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
