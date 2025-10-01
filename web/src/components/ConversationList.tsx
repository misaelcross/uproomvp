import React, { useState, useEffect } from 'react'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { 
  Search,
  MessageCircle,
  Users,
  Clock,
  Plus
} from 'lucide-react'
import { realtimeService, Conversation, ConversationEvent } from '../lib/realtime'
// TODO: Implement conversation service with Prisma
import { useAuth } from '../contexts/AuthContext'
import { useCompany } from '../contexts/CompanyContext'
import CreateConversationDialog from './CreateConversationDialog'
import { usePresence } from '../hooks/usePresence'
import UserPresenceIndicator from './UserPresenceIndicator'

interface ConversationWithDetails extends Conversation {
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

interface ConversationListProps {
  companyId?: string
  onConversationSelect?: (conversation: ConversationWithDetails) => void
  selectedConversationId?: string
  className?: string
}

const ConversationList: React.FC<ConversationListProps> = ({
  companyId,
  onConversationSelect,
  selectedConversationId,
  className = ""
}) => {
  const { user } = useAuth()
  // Removed unused company destructuring from useCompany
  const { isUserOnline, getUserStatus } = usePresence(companyId)
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && companyId) {
      loadConversations()
      subscribeToConversationUpdates()
    }

    return () => {
      realtimeService.unsubscribeFromCompanyStatus(companyId)
    }
  }, [user, companyId])

  const loadConversations = async () => {
    if (!user || !companyId) return

    setLoading(true)
    setError('')

    try {
      // TODO: Implement conversation loading with Prisma
      console.log('Conversation loading needs to be implemented with Prisma')
      setConversations([])
    } catch (err: any) {
      console.error('Error loading conversations:', err)
      setError('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const subscribeToConversationUpdates = () => {
    if (!companyId) return

    // Subscribe to conversation changes
    realtimeService.subscribeToCompanyConversations(companyId)
    
    // Listen for conversation events
    const unsubscribe = realtimeService.onConversation((event: ConversationEvent) => {
      if (event.type === 'INSERT' || event.type === 'UPDATE') {
        // Reload conversations when there are changes
        loadConversations()
      }
    })

    return unsubscribe
  }

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return diffInMinutes < 1 ? 'now' : `${diffInMinutes}m`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return diffInDays === 1 ? '1d' : `${diffInDays}d`
    }
  }

  const getConversationName = (conversation: ConversationWithDetails) => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat'
    }
    
    // For direct conversations, show the other participant's name
    const otherParticipant = conversation.participants.find(p => p.user_id !== user?.id)
    return otherParticipant?.user_name || 'Direct Message'
  }

  const getConversationAvatar = (conversation: ConversationWithDetails) => {
    if (conversation.type === 'group') {
      return null // Group conversations don't have avatars for now
    }
    
    const otherParticipant = conversation.participants.find(p => p.user_id !== user?.id)
    return otherParticipant?.user_avatar
  }

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true
    
    const name = getConversationName(conversation).toLowerCase()
    const lastMessage = conversation.last_message?.content.toLowerCase() || ''
    
    return name.includes(searchQuery.toLowerCase()) || 
           lastMessage.includes(searchQuery.toLowerCase())
  })

  const handleCreateConversation = async () => {
    setShowCreateDialog(true)
  }

  const handleConversationCreated = (conversationId: string) => {
    // Refresh conversations list
    loadConversations()
    
    // Select the newly created conversation
    const newConversation = conversations.find(c => c.id === conversationId)
    if (newConversation && onConversationSelect) {
      onConversationSelect(newConversation)
    }
  }

  if (loading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className={`${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center">
            <MessageCircle className="h-4 w-4 mr-2" />
            Conversations
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateConversation}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border-b">
            {error}
          </div>
        )}

        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateConversation}
                className="mt-3"
              >
                Start a conversation
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 hover:bg-background cursor-pointer transition-colors ${
                  selectedConversationId === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
                onClick={() => onConversationSelect?.(conversation)}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getConversationAvatar(conversation)} />
                      <AvatarFallback>
                        {conversation.type === 'group' ? (
                          <Users className="h-4 w-4" />
                        ) : (
                          getConversationName(conversation).charAt(0).toUpperCase()
                        )}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Presence indicator for direct conversations */}
                    {conversation.type === 'direct' && conversation.participants.length > 0 && (
                      <div className="absolute -bottom-0.5 -right-0.5">
                        {(() => {
                          const otherParticipant = conversation.participants.find(p => p.user_id !== user?.id)
                          if (otherParticipant) {
                            return (
                              <UserPresenceIndicator 
                                status={getUserStatus(otherParticipant.user_id)} 
                                size="sm"
                              />
                            )
                          }
                          return null
                        })()}
                      </div>
                    )}
                    
                    {conversation.unread_count > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium truncate">
                        {getConversationName(conversation)}
                      </h4>
                      {conversation.last_message && (
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatLastMessageTime(conversation.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    
                    {conversation.last_message ? (
                      <p className="text-sm text-gray-600 truncate mt-1">
                        <span className="font-medium">{conversation.last_message.user_name}:</span>{' '}
                        {conversation.last_message.content}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic mt-1">
                        No messages yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateConversationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        companyId={companyId || ''}
        onConversationCreated={handleConversationCreated}
      />
    </Card>

)

}

export default ConversationList