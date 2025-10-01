import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCompany } from '../contexts/CompanyContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { 
  Search, 
  Plus, 
  Settings, 
  Bell, 
  ChevronDown,
  MessageSquare,
  Users,
  MoreVertical,
  Send,
  User,
  LogOut,
  UserPlus
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/dropdown-menu'
import StatusSelector from './StatusSelector'
import UserPresenceIndicator from './UserPresenceIndicator'
import { usePresence } from '../hooks/usePresence'
import { useCompanies, useCompanyMembers } from '../hooks/api/useCompanies'
import { useConversations, useCreateConversation } from '../hooks/api/useConversations'
import { useMessages, useCreateMessage } from '../hooks/api/useMessages'
import InvitePeopleModal from './InvitePeopleModal'

interface MainDashboardProps {
  companyId?: string
  company?: {
    id: string
    name: string
    subdomain: string
    description?: string
    owner_id: string
    created_at: string
  }
  userRole?: {
    role: string
    status: string
    joined_at: string
  }
}

const MainDashboardWithAPI: React.FC<MainDashboardProps> = ({ companyId, company, userRole }) => {
  const { user, signOut } = useAuth()
  const { currentCompany } = useCompany()
  
  // Use passed company data or fallback to context
  const activeCompany = company || currentCompany
  const activeCompanyId = companyId || activeCompany?.id
  const { onlineUsers, getUserStatus } = usePresence(activeCompanyId)
  
  // API Hooks
  const { data: companies, isLoading: companiesLoading } = useCompanies()
  const { data: companyMembers, isLoading: membersLoading } = useCompanyMembers(activeCompanyId || '')
  const { data: conversations, isLoading: conversationsLoading } = useConversations(activeCompanyId)
  const createConversation = useCreateConversation()
  const createMessage = useCreateMessage()
  
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'activity'>('name')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [newMessage, setNewMessage] = useState('')

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleSendMessage = async (userId: string) => {
    if (!activeCompanyId) return
    
    try {
      // Criar conversa direta
      const conversation = await createConversation.mutateAsync({
        title: `Conversa com ${userId}`,
        companyId: activeCompanyId,
        type: 'DIRECT',
        participantIds: [userId]
      })
      
      setSelectedConversation(conversation.id)
    } catch (error) {
      console.error('Erro ao criar conversa:', error)
    }
  }

  const handleSendNewMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return
    
    try {
      await createMessage.mutateAsync({
        content: newMessage,
        conversationId: selectedConversation,
        type: 'TEXT'
      })
      
      setNewMessage('')
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    }
  }

  const filteredMembers = (companyMembers || []).filter(member =>
    member.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.user.name || a.user.email).localeCompare(b.user.name || b.user.email)
      case 'status':
        const statusA = getUserStatus(a.userId)
        const statusB = getUserStatus(b.userId)
        return statusA.localeCompare(statusB)
      case 'activity':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      default:
        return 0
    }
  })

  if (companiesLoading || membersLoading || conversationsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - 300px */}
      <div className="w-[300px] bg-background border-r border-border flex flex-col">
        {/* Company Profile Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-3 cursor-pointer hover:bg-accent/50 rounded-lg p-2 -m-2 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getInitials(activeCompany?.name || 'Company')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activeCompany?.name || 'Company'}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => setIsInviteModalOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Convidar Pessoas
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar organização
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="h-4 w-4 mr-2" />
                  Pausar notificações
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Alterar conta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  await signOut()
                  window.location.href = '/login'
                }}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Conversations */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground px-2 py-1">Conversas</h3>
              {conversations?.map(conv => (
                <div
                  key={conv.id}
                  className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer"
                  onClick={() => setSelectedConversation(conv.id)}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="relative">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>
                          {getInitials(conv.title)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {conv.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* Status Selector */}
        <div className="p-4 border-t border-border">
          <StatusSelector companyId={activeCompanyId} />
        </div>
      </div>

      {/* Main Area - Flexible */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-background border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar membros da equipe..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button>
                <Plus className="h-4 w-4" />
                Criar Grupo
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area with Cards and Chat */}
        <div className="flex-1 flex overflow-hidden">
          {/* User Cards Grid */}
          <div className={`${selectedConversation ? 'w-[400px]' : 'flex-1'} flex flex-col`}>
            <ScrollArea className="flex-1 p-6">
              <div className={`grid gap-4 ${selectedConversation ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                {sortedMembers.map(member => (
                  <Card key={member.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback>
                                {getInitials(member.user.name || member.user.email)}
                              </AvatarFallback>
                            </Avatar>
                            <UserPresenceIndicator
                              status={getUserStatus(member.userId)}
                              size="md"
                              className="absolute bottom-1 -right-4"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">
                              {member.user.name || member.user.email}
                            </CardTitle>
                            <CardDescription className="truncate">
                              {member.user.email}
                            </CardDescription>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleSendMessage(member.userId)}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Enviar Mensagem
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="h-4 w-4 mr-2" />
                              Ver Perfil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                        <UserPresenceIndicator
                          status={getUserStatus(member.userId)}
                          showText
                          size="sm"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Column */}
          {selectedConversation && (
            <div className="flex-1 min-w-0 border-l border-border flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="bg-background border-b border-border px-4 py-[18px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>CH</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">Conversa</h3>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {/* Aqui você pode implementar a lista de mensagens usando useMessages */}
                  <div className="text-center text-muted-foreground">
                    Mensagens serão carregadas aqui
                  </div>
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="bg-background border-t border-border p-4">
                <div className="flex items-center space-x-2">
                  <Input 
                    placeholder="Digite uma mensagem..." 
                    className="flex-1 border border-border"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendNewMessage()}
                  />
                  <Button size="sm" onClick={handleSendNewMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite People Modal */}
      <InvitePeopleModal 
        open={isInviteModalOpen} 
        onOpenChange={setIsInviteModalOpen} 
      />
    </div>
  )
}

export default MainDashboardWithAPI
