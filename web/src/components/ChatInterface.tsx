import React, { useState, useEffect } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  MessageSquare,
  Users,
  Settings,
  Bell,
  Search,
  Plus,
  X
} from 'lucide-react'
import ConversationList from './ConversationList'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import StatusSelector from './StatusSelector'
import CreateConversationDialog from './CreateConversationDialog'
import { useAuth } from '../contexts/AuthContext'
// TODO: Implement chat service with Prisma
import { realtimeService, Message } from '../lib/realtime'

interface ConversationWithDetails {
  id: string
  company_id: string
  type: 'direct' | 'group'
  name?: string
  description?: string
  created_by?: string
  created_at: string
  updated_at: string
  last_message_at: string
  participants: {
    id: string
    user_id: string
    user_name: string
    user_avatar?: string
  }[]
  last_message?: {
    id: string
    content: string
    user_name: string
    created_at: string
  }
  unread_count: number
}

interface ChatInterfaceProps {
  companyId: string
  className?: string
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  companyId,
  className = ""
}) => {
  const { user } = useAuth()
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const handleConversationCreated = (conversationId: string) => {
    // Refresh conversation list or select the new conversation
    // The ConversationList component should handle this via real-time updates
    setShowCreateDialog(false)
  }

  useEffect(() => {
    if (user && companyId) {
      // Initialize realtime service with company context
      realtimeService.subscribeToCompanyStatus(companyId)
      realtimeService.subscribeToCompanyConversations(companyId)
    }

    return () => {
      realtimeService.disconnectAll()
    }
  }, [user, companyId])

  const handleConversationSelect = (conversation: ConversationWithDetails) => {
    setSelectedConversation(conversation)
    setMessages([]) // Clear messages while loading new conversation
  }

  const handleMessageUpdate = (updatedMessages: any[]) => {
    setMessages(updatedMessages)
  }

  const handleSendMessage = async (content: string, attachments: File[]) => {
    if (!selectedConversation) return

    try {
      await realtimeService.sendMessage(selectedConversation.id, content)
      // Message will be added via real-time subscription
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const getConversationTitle = () => {
    if (!selectedConversation) return 'Select a conversation'
    
    if (selectedConversation.type === 'group') {
      return selectedConversation.name || 'Group Chat'
    }
    
    const otherParticipant = selectedConversation.participants.find(p => p.user_id !== user?.id)
    return otherParticipant?.user_name || 'Direct Message'
  }

  const getConversationSubtitle = () => {
    if (!selectedConversation) return ''
    
    if (selectedConversation.type === 'group') {
      const participantCount = selectedConversation.participants.length
      return `${participantCount} participant${participantCount !== 1 ? 's' : ''}`
    }
    
    return 'Direct message'
  }

  return (
    <div className={`flex h-full bg-background ${className}`}>
      {/* Sidebar */}
      <div className={`bg-white border-r transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-80'
      }`}>
        {!sidebarCollapsed && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Mindful Communication</h2>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Status Selector */}
              <StatusSelector companyId={companyId} />
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-hidden">
              <ConversationList
                companyId={companyId}
                onConversationSelect={handleConversationSelect}
                selectedConversationId={selectedConversation?.id}
                className="h-full border-0 rounded-none"
              />
            </div>
          </div>
        )}
        
        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`absolute top-4 ${sidebarCollapsed ? 'left-4' : 'left-72'} z-10 h-8 w-8 p-0 bg-white border shadow-sm`}
        >
          {sidebarCollapsed ? <MessageSquare className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{getConversationTitle()}</h3>
                  <p className="text-sm text-gray-500">{getConversationSubtitle()}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Users className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <MessageList
                conversationId={selectedConversation.id}
                companyId={companyId}
                currentUserId={user?.id}
                onMessageUpdate={handleMessageUpdate}
                className="h-full border-0 rounded-none"
              />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t p-4">
              <MessageInput
                conversationId={selectedConversation.id}
                onSendMessage={handleSendMessage}
                placeholder={`Message ${getConversationTitle()}...`}
              />
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center bg-background">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Welcome to Mindful Communication
              </h3>
              <p className="text-gray-500 mb-6 max-w-sm">
                Select a conversation from the sidebar to start messaging, or create a new conversation.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                 <Plus className="h-4 w-4 mr-2" />
                 Start New Conversation
               </Button>
            </div>
          </div>
        )}
      </div>
      
      <CreateConversationDialog
         open={showCreateDialog}
         onOpenChange={setShowCreateDialog}
         companyId={companyId}
         onConversationCreated={handleConversationCreated}
       />
     </div>
   )
 }
 
 export default ChatInterface