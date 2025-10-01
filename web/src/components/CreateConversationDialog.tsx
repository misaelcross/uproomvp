import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Checkbox } from './ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  Search,
  Users,
  MessageCircle,
  X,
  Loader2
} from 'lucide-react'
// TODO: Implement conversation service with Prisma
import { useAuth } from '../contexts/AuthContext'

interface User {
  id: string
  full_name: string
  avatar_url?: string
  email: string
}

interface CreateConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  onConversationCreated?: (conversationId: string) => void
}

const CreateConversationDialog: React.FC<CreateConversationDialogProps> = ({
  open,
  onOpenChange,
  companyId,
  onConversationCreated
}) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [conversationType, setConversationType] = useState<'direct' | 'group'>('direct')
  const [groupName, setGroupName] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    if (open) {
      loadUsers()
    } else {
      // Reset state when dialog closes
      setSearchQuery('')
      setSelectedUsers([])
      setGroupName('')
      setConversationType('direct')
    }
  }, [open, companyId])

  const loadUsers = async () => {
    if (!companyId) return
    
    setLoadingUsers(true)
    try {
      // TODO: Implement user loading with Prisma
      console.log('User loading needs to be implemented with Prisma')
      setUsers([])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true
    return user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           user.email.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handleUserToggle = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id)
      if (isSelected) {
        return prev.filter(u => u.id !== user.id)
      } else {
        // For direct messages, only allow one user
        if (conversationType === 'direct') {
          return [user]
        }
        return [...prev, user]
      }
    })
  }

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return
    
    setLoading(true)
    try {
      // TODO: Implement conversation creation with Prisma
      console.log('Conversation creation needs to be implemented with Prisma')
      
      // For now, just close the dialog
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const canCreate = selectedUsers.length > 0 && 
    (conversationType === 'direct' || (conversationType === 'group' && groupName.trim()))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Start a new conversation with your team members
          </DialogDescription>
        </DialogHeader>

        <Tabs value={conversationType} onValueChange={(value) => {
          setConversationType(value as 'direct' | 'group')
          setSelectedUsers([])
        }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Direct Message
            </TabsTrigger>
            <TabsTrigger value="group" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Group Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-4">
            <div className="space-y-2">
              <Label>Select a team member</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="group" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Select team members</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="space-y-2">
            <Label>Selected ({selectedUsers.length})</Label>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <Badge key={user.id} variant="secondary" className="flex items-center gap-2">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {user.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {user.full_name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleUserToggle(user)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No users found' : 'No team members available'}
            </div>
          ) : (
            filteredUsers.map(user => {
              const isSelected = selectedUsers.some(u => u.id === user.id)
              return (
                <div
                  key={user.id}
                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-background ${
                    isSelected ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                  onClick={() => handleUserToggle(user)}
                >
                  <Checkbox checked={isSelected} />
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateConversation} 
            disabled={!canCreate || loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Conversation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateConversationDialog