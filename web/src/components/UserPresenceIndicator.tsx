import React from 'react'
import { Badge } from './ui/badge'
import { UserPresence } from '../hooks/usePresence'

interface UserPresenceIndicatorProps {
  status: UserPresence['status']
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const UserPresenceIndicator: React.FC<UserPresenceIndicatorProps> = ({
  status,
  size = 'sm',
  showText = false,
  className = ''
}) => {
  const getStatusConfig = (status: UserPresence['status']) => {
    switch (status) {
      case 'available':
        return {
          color: 'rgb(22, 101, 52)', // Dark green to match StatusSelector
          text: 'Available',
          textColor: 'text-green-600'
        }
      case 'focus':
        return {
          color: 'rgb(107, 33, 168)', // Dark purple to match StatusSelector
          text: 'Focus',
          textColor: 'text-purple-600'
        }
      case 'meeting':
        return {
          color: 'rgb(37, 99, 235)', // Dark blue to match StatusSelector
          text: 'Meeting',
          textColor: 'text-blue-600'
        }
      case 'away':
        return {
          color: 'rgb(202, 138, 4)', // Dark yellow to match StatusSelector
          text: 'Away',
          textColor: 'text-yellow-600'
        }
      case 'break':
        return {
          color: 'rgb(234, 88, 12)', // Dark orange to match StatusSelector
          text: 'Break',
          textColor: 'text-orange-600'
        }
      case 'emergency':
        return {
          color: 'rgb(220, 38, 38)', // Dark red to match StatusSelector
          text: 'Emergency',
          textColor: 'text-red-600'
        }
      case 'offline':
      default:
        return {
          color: 'rgb(75, 85, 99)', // Dark gray to match StatusSelector
          text: 'Offline',
          textColor: 'text-gray-500'
        }
    }
  }

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'lg':
        return 'w-4 h-4'
      case 'md':
        return 'w-3 h-3'
      case 'sm':
      default:
        return 'w-2 h-2'
    }
  }

  const config = getStatusConfig(status)
  const sizeClasses = getSizeClasses(size)

  if (showText) {
    return (
      <Badge variant="outline" className={`${config.textColor} ${className}`}>
        <div 
          className={`${sizeClasses} rounded-full mr-1`}
          style={{ backgroundColor: config.color }}
        />
        {config.text}
      </Badge>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`${sizeClasses} rounded-full`}
        style={{ backgroundColor: config.color }}
      />
    </div>
  )
}

export default UserPresenceIndicator