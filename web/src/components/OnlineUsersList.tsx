import React from 'react'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { ScrollArea } from './ui/scroll-area'
import { Users, Circle } from 'lucide-react'
import { usePresence } from '../hooks/usePresence'
import UserPresenceIndicator from './UserPresenceIndicator'

interface OnlineUsersListProps {
  companyId?: string
  className?: string
}

const OnlineUsersList: React.FC<OnlineUsersListProps> = ({
  companyId,
  className = ""
}) => {
  const { onlineUsers, onlineCount } = usePresence(companyId)

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Team Status</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          <Circle className="h-2 w-2 fill-green-500 text-green-500 mr-1" />
          {onlineCount} online
        </Badge>
      </div>

      <ScrollArea className="h-64">
        {onlineUsers.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No team members online</p>
          </div>
        ) : (
          <div className="space-y-3">
            {onlineUsers.map((user) => (
              <div key={user.user_id} className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_avatar} />
                    <AvatarFallback className="text-xs">
                      {getUserInitials(user.user_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <UserPresenceIndicator status={user.status} size="sm" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.user_name}
                  </p>
                  <div className="flex items-center space-x-1">
                    <UserPresenceIndicator 
                      status={user.status} 
                      size="sm" 
                      showText 
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  )
}

export default OnlineUsersList