import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCompany } from '../contexts/CompanyContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { ScrollArea } from './ui/scroll-area'
import { 
  Search, 
  Plus, 
  Settings, 
  Bell, 
  ChevronDown,
  MessageSquare,
  Users,
  Filter,
  SortAsc,
  MoreVertical,
  Minus,
  Maximize2,
  X,
  Pin,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible'
// TODO: Remove Prisma import - should use API routes instead
import StatusSelector from './StatusSelector'
import UserPresenceIndicator from './UserPresenceIndicator'
import { usePresence } from '../hooks/usePresence'
import ChatInterface from './ChatInterface'
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

interface TeamMember {
  id: string
  user_id: string
  full_name: string
  email: string
  avatar_url?: string
  role: string
  status: string
  last_activity_at: string
}

interface DirectConversation {
  id: string
  participant_id: string
  participant_name: string
  participant_avatar?: string
  last_message?: string
  last_message_at?: string
  unread_count: number
}

interface GroupConversation {
  id: string
  name: string
  description?: string
  member_count: number
  last_message?: string
  last_message_at?: string
  unread_count: number
}

const MainDashboard: React.FC<MainDashboardProps> = ({ companyId, company, userRole }) => {
  const { user, signOut } = useAuth()
  const { currentCompany } = useCompany()
  
  // Use passed company data or fallback to context
  const activeCompany = company || currentCompany
  const activeCompanyId = companyId || activeCompany?.id
  const { onlineUsers, getUserStatus } = usePresence(activeCompanyId)
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [directConversations, setDirectConversations] = useState<DirectConversation[]>([])
  const [groupConversations, setGroupConversations] = useState<GroupConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [isMessageMinimized, setIsMessageMinimized] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'activity'>('name')
  const [isDirectMessagesOpen, setIsDirectMessagesOpen] = useState(true)
  const [isGroupsOpen, setIsGroupsOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  useEffect(() => {
    if (activeCompanyId) {
      fetchTeamMembers()
      fetchConversations()
    }
  }, [activeCompanyId])

  const fetchTeamMembers = async () => {
    if (!activeCompany) return
    
    try {
      // TODO: Replace with API call instead of direct Prisma usage
      console.log('Team members fetch needs to be implemented with API routes')
      const members: any[] = []

      const formattedMembers = members.map((member: any) => ({
        id: member.id,
        user_id: member.userId,
        full_name: member.user?.fullName || member.user?.email?.split('@')[0] || 'Unknown',
        email: member.user?.email || '',
        avatar_url: member.user?.avatar,
        role: member.role,
        status: 'active',
        last_activity_at: new Date().toISOString()
      }))

      setTeamMembers(formattedMembers.filter(m => m.user_id !== user?.id))
    } catch (error) {
      console.error('Error fetching team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchConversations = async () => {
    // Mock data for now - will be implemented with real data later
    setDirectConversations([
      {
        id: '1',
        participant_id: 'user1',
        participant_name: 'John Doe',
        participant_avatar: undefined,
        last_message: 'Hey, how are you?',
        last_message_at: new Date().toISOString(),
        unread_count: 2
      }
    ])

    setGroupConversations([
      {
        id: 'group1',
        name: 'Team Alpha',
        description: 'Main project team',
        member_count: 5,
        last_message: 'Meeting at 3 PM',
        last_message_at: new Date().toISOString(),
        unread_count: 1
      }
    ])
  }

  const handleSendMessage = (userId: string) => {
    setSelectedConversation(userId)
    setIsMessageMinimized(false)
  }

  const handleCloseConversation = () => {
    setSelectedConversation(null)
    setIsMessageMinimized(false)
  }

  const filteredMembers = teamMembers.filter(member =>
    member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.full_name.localeCompare(b.full_name)
      case 'status':
        const statusA = getUserStatus(a.user_id)
        const statusB = getUserStatus(b.user_id)
        return statusA.localeCompare(statusB)
      case 'activity':
        return new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
      default:
        return 0
    }
  })

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
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
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => setIsInviteModalOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite People
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Plus className="h-4 w-4 mr-2" />
                  Add organization
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="h-4 w-4 mr-2" />
                  Pause notifications
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Change account
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  await signOut()
                  window.location.href = '/login'
                }}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
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
            {/* Direct Messages */}
            <Collapsible open={isDirectMessagesOpen} onOpenChange={setIsDirectMessagesOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-sm font-medium text-foreground hover:bg-accent rounded">
                <div className="flex items-center space-x-2">
                  <span>Direct Messages</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isDirectMessagesOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {directConversations.map(conv => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer"
                    onClick={() => setSelectedConversation(conv.id)}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="relative">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={conv.participant_avatar} />
                          <AvatarFallback>{getInitials(conv.participant_name)}</AvatarFallback>
                        </Avatar>
                        <UserPresenceIndicator
                          status={getUserStatus(conv.participant_id)}
                          size="sm"
                          className="absolute bottom-1 -right-4"
                        />
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">
                        {conv.participant_name}
                      </p>
                    </div>
                    {conv.unread_count > 0 && (
                      <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs flex-shrink-0 rounded-sm">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Groups */}
            <Collapsible open={isGroupsOpen} onOpenChange={setIsGroupsOpen} className="mt-4">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-sm font-medium text-foreground hover:bg-accent rounded">
                <div className="flex items-center space-x-2">
                  <span>Groups</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isGroupsOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {groupConversations.map(group => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer"
                    onClick={() => setSelectedConversation(group.id)}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">
                        {group.name}
                      </p>
                    </div>
                    {group.unread_count > 0 && (
                      <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs flex-shrink-0 rounded-sm">
                        {group.unread_count}
                      </Badge>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
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
                  placeholder="Search team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Sort
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy('name')}>Name</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('status')}>Status</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('activity')}>Activity</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button>
                <Plus className="h-4 w-4" />
                Create Group
              </Button>
            </div>
            
          </div>
        </div>

        {/* Content Area with Cards and Chat */}
        <div className="flex-1 flex overflow-hidden">
          {/* User Cards Grid */}
          <div className={`${selectedConversation && !isMessageMinimized ? 'w-[400px]' : 'flex-1'} flex flex-col`}>
            <ScrollArea className="flex-1 p-6">
              <div className={`grid gap-4 ${selectedConversation && !isMessageMinimized ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                {sortedMembers.map(member => (
                  <Card key={member.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={member.avatar_url} />
                              <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                            </Avatar>
                            <UserPresenceIndicator
                              status={getUserStatus(member.user_id)}
                              size="md"
                              className="absolute bottom-1 -right-4"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{member.full_name}</CardTitle>
                            <CardDescription className="truncate">{member.email}</CardDescription>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleSendMessage(member.user_id)}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="h-4 w-4 mr-2" />
                              View Profile
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
                          status={getUserStatus(member.user_id)}
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

          {/* Conditional Chat Column */}
          {selectedConversation && (
            <div className={`${isMessageMinimized ? 'w-[300px]' : 'flex-1 min-w-0'} border-l border-border flex flex-col overflow-hidden`}>
              {/* Chat Header */}
              <div className="bg-background border-b border-border px-4 py-[18px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    {!isMessageMinimized && (
                      <div>
                        <h3 className="font-medium">John Doe</h3>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {!isMessageMinimized && (
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMessageMinimized(!isMessageMinimized)}
                      title={isMessageMinimized ? "Expand" : "Minimize"}
                    >
                      {isMessageMinimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCloseConversation}
                      title="Close"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Chat Content - Always visible but responsive */}
               {isMessageMinimized ? (
                 /* Minimized View */
                 <>
                   {/* Pinned Messages - Minimized */}
                   <div className="bg-neutral-800/50 border-b border-border p-4">
                     <div className="flex items-center space-x-2 text-sm text-white">
                       <Pin className="h-4 w-4 flex-shrink-0" />
                       <span className="truncate">2 pinned messages</span>
                     </div>
                   </div>

                   {/* Messages Area - Minimized */}
                   <ScrollArea className="flex-1 p-4">
                     <div className="space-y-4">
                       <div className="flex items-start space-x-3">
                         <Avatar className="h-8 w-8 flex-shrink-0">
                           <AvatarFallback>JD</AvatarFallback>
                         </Avatar>
                         <div className="flex-1 min-w-0">
                           <div className="bg-accent rounded-lg p-3">
                             <p className="text-sm break-words">Hey, how are you doing?</p>
                           </div>
                           <p className="text-xs text-muted-foreground mt-1">2:30 PM</p>
                         </div>
                       </div>
                       
                       <div className="flex items-start space-x-3 justify-end">
                         <div className="flex-1 text-right min-w-0">
                           <div className="bg-white text-black rounded-lg p-3 inline-block max-w-full">
                             <p className="text-sm break-words">I'm doing great! Thanks for asking.</p>
                           </div>
                           <p className="text-xs text-muted-foreground mt-1">2:32 PM</p>
                         </div>
                         <Avatar className="h-8 w-8 flex-shrink-0">
                           <AvatarFallback>
                             {getInitials(user?.user_metadata?.full_name || user?.email || 'U')}
                           </AvatarFallback>
                         </Avatar>
                       </div>
                     </div>
                   </ScrollArea>

                   {/* Message Input - Minimized */}
                   <div className="bg-background border-t border-border p-4">
                     <div className="flex items-center space-x-2">
                       <Input placeholder="Type a message..." className="flex-1 border border-border" />
                       <Button size="sm">
                         <Send className="h-4 w-4" />
                       </Button>
                     </div>
                   </div>
                 </>
               ) : (
                /* Expanded View */
                <>
                  {/* Pinned Messages */}
                   <div className="bg-neutral-800/50 border-b border-border p-4">
                     <div className="flex items-center space-x-2 text-sm text-white">
                       <Pin className="h-4 w-4 flex-shrink-0" />
                       <span className="truncate">2 pinned messages</span>
                     </div>
                   </div>

                  {/* Messages Area */}
                   <ScrollArea className="flex-1 p-4">
                     <div className="space-y-4">
                       <div className="flex items-start space-x-3">
                         <Avatar className="h-8 w-8 flex-shrink-0">
                           <AvatarFallback>JD</AvatarFallback>
                         </Avatar>
                         <div className="flex-1 min-w-0">
                           <div className="bg-accent rounded-lg p-3">
                             <p className="text-sm break-words">Hey, how are you doing?</p>
                           </div>
                           <p className="text-xs text-muted-foreground mt-1">2:30 PM</p>
                         </div>
                       </div>
                       
                       <div className="flex items-start space-x-3 justify-end">
                         <div className="flex-1 text-right min-w-0">
                           <div className="bg-white text-black rounded-lg p-3 inline-block max-w-full">
                             <p className="text-sm break-words">I'm doing great! Thanks for asking.</p>
                           </div>
                           <p className="text-xs text-muted-foreground mt-1">2:32 PM</p>
                         </div>
                         <Avatar className="h-8 w-8 flex-shrink-0">
                           <AvatarFallback>
                             {getInitials(user?.user_metadata?.full_name || user?.email || 'U')}
                           </AvatarFallback>
                         </Avatar>
                       </div>
                     </div>
                   </ScrollArea>

                  {/* Message Input */}
                  <div className="bg-background border-t border-border p-4">
                    <div className="flex items-center space-x-2">
                      <Input placeholder="Type a message..." className="flex-1 border border-border" />
                      <Button size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
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

export default MainDashboard