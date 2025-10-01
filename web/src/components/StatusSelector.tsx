import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Switch } from './ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './ui/dropdown-menu'
import { 
  Clock, 
  Coffee, 
  Home, 
  Briefcase, 
  Phone, 
  Calendar,
  Moon,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  Circle,
  AlertTriangle,
  Minus,
  Check
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePresence } from '@/hooks/usePresence'
import { UserStatus } from '@prisma/client'

interface StatusOption {
  type: string
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
  description: string
  defaultMessage: string
}

interface Company {
  id: string
  name: string
}

const statusOptions: StatusOption[] = [
  {
    type: 'available',
    label: 'Available',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-500',
    description: 'Ready to work, minimal interruptions',
    defaultMessage: 'Available for work'
  },
  {
    type: 'focus',
    label: 'Focus',
    icon: <Zap className="h-4 w-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-500',
    description: 'Focused work, minimal interruptions',
    defaultMessage: 'In deep work mode'
  },
  {
    type: 'meeting',
    label: 'Meeting',
    icon: <Calendar className="h-4 w-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500',
    description: 'Currently in a meeting',
    defaultMessage: 'In a meeting'
  },
  {
    type: 'away',
    label: 'Away',
    icon: <Clock className="h-4 w-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500',
    description: 'Temporarily away from desk',
    defaultMessage: 'Away from desk'
  },
  {
    type: 'break',
    label: 'Break',
    icon: <Coffee className="h-4 w-4" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-500',
    description: 'Taking a short break',
    defaultMessage: 'Taking a break'
  },
  {
    type: 'emergency',
    label: 'Emergency',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-500',
    description: 'Emergency situation - urgent attention needed',
    defaultMessage: 'Emergency - please contact immediately'
  },
  {
    type: 'offline',
    label: 'Offline',
    icon: <Moon className="h-4 w-4" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-400',
    description: 'Not available, finished for today',
    defaultMessage: 'Finished for today'
  }
]

interface StatusSelectorProps {
  companyId?: string
  onStatusUpdate?: () => void
  className?: string
}

const StatusSelector: React.FC<StatusSelectorProps> = ({ 
  companyId, 
  onStatusUpdate,
  className = ""
}) => {
  const { user } = useAuth()
  const [selectedStatus, setSelectedStatus] = useState<string>('available')
  const [customMessage, setCustomMessage] = useState('')
  const [autoExpiry, setAutoExpiry] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>(companyId || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentStatus, setCurrentStatus] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isToggleOn, setIsToggleOn] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserCompanies()
      if (companyId || selectedCompany) {
        fetchCurrentStatus()
      }
    }
  }, [user, companyId, selectedCompany])

  const fetchUserCompanies = async () => {
    try {
      const { prisma } = await import('../lib/prisma')
      const members = await prisma.companyMember.findMany({
        where: {
          userId: user?.id,
          isActive: true
        },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      const companiesData = members.map(member => ({
        id: member.company.id,
        name: member.company.name
      }))

      setCompanies(companiesData)

      if (!companyId && companiesData.length > 0) {
        setSelectedCompany(companiesData[0].id)
      }
    } catch (err: any) {
      console.error('Error fetching companies:', err)
    }
  }

  const fetchCurrentStatus = async () => {
    if (!selectedCompany || !user) return

    try {
      const { prisma } = await import('../lib/prisma')
      const status = await prisma.userPresence.findUnique({
        where: {
          userId_companyId: {
            userId: user.id,
            companyId: selectedCompany
          }
        }
      })

      if (status) {
        setCurrentStatus(status)
        setSelectedStatus(status.status)
        setCustomMessage(status.message || '')
        setIsToggleOn(status.status !== 'OFFLINE')
      } else {
        // No status found, create default offline status
        await createDefaultStatus()
      }
    } catch (err: any) {
      console.error('Error fetching current status:', err)
      // Create default status if none exists
      await createDefaultStatus()
    }
  }

  const createDefaultStatus = async () => {
    if (!user || !selectedCompany) return

    try {
      const { prisma } = await import('../lib/prisma')
      const status = await prisma.userPresence.create({
        data: {
          userId: user.id,
          companyId: selectedCompany,
          status: 'OFFLINE',
          message: 'Finished for today',
          isOnline: false
        }
      })

      setCurrentStatus(status)
      setSelectedStatus('OFFLINE')
      setCustomMessage('Finished for today')
      setIsToggleOn(false)
    } catch (err: any) {
      console.error('Error creating default status:', err)
    }
  }

  const handleStatusChange = (statusType: string) => {
    setSelectedStatus(statusType)
    const option = statusOptions.find(opt => opt.type === statusType)
    if (option && !customMessage) {
      setCustomMessage(option.defaultMessage)
    }
  }

  const handleUpdateStatus = async () => {
    if (!user || !selectedCompany) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Update status using Prisma
      const { prisma } = await import('../lib/prisma')
      const newStatus = await prisma.userPresence.upsert({
        where: {
          userId_companyId: {
            userId: user.id,
            companyId: selectedCompany
          }
        },
        update: {
          status: selectedStatus as UserStatus,
          message: customMessage,
          isOnline: selectedStatus !== 'OFFLINE',
          lastSeen: new Date()
        },
        create: {
          userId: user.id,
          companyId: selectedCompany,
          status: selectedStatus as UserStatus,
          message: customMessage,
          isOnline: selectedStatus !== 'OFFLINE',
          lastSeen: new Date()
        }
      })
      
      setCurrentStatus(newStatus)
      setIsToggleOn(selectedStatus !== 'OFFLINE')
      setSuccess('Status updated successfully!')
      
      // Close the selector after a brief delay
      setTimeout(() => {
        setIsOpen(false)
        setSuccess('')
      }, 1500)

    } catch (err: any) {
      console.error('Error updating status:', err)
      setError(err.message || 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const getStatusOption = (type: string) => {
    return statusOptions.find(opt => opt.type === type)
  }

  const currentStatusOption = currentStatus ? getStatusOption(currentStatus.status_type) : getStatusOption('available')
  const displayMessage = currentStatus?.status_message || currentStatusOption?.defaultMessage || 'Available for work'
  const truncatedMessage = displayMessage.length > 35 ? displayMessage.substring(0, 35) + '...' : displayMessage

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div className={`w-full p-3 border rounded-lg cursor-pointer hover:bg-neutral-700/50 transition-colors ${className}`}>
          {/* First line: Description text */}
          <div className="text-sm text-white mb-2">
            {truncatedMessage}
          </div>
          
          {/* Second line: Status badge and toggle */}
          <div className="flex items-center justify-between">
            <Badge 
              variant="secondary" 
              className={`${currentStatusOption?.color} border-0 px-2 py-1 rounded-sm`}
              style={{
                backgroundColor: currentStatusOption?.type === 'available' ? 'rgb(22 101 52 / 0.3)' :
                                currentStatusOption?.type === 'focus' ? 'rgb(107 33 168 / 0.3)' :
                                currentStatusOption?.type === 'meeting' ? 'rgb(37 99 235 / 0.3)' :
                                currentStatusOption?.type === 'away' ? 'rgb(202 138 4 / 0.3)' :
                                currentStatusOption?.type === 'break' ? 'rgb(234 88 12 / 0.3)' :
                                currentStatusOption?.type === 'emergency' ? 'rgb(220 38 38 / 0.3)' :
                                currentStatusOption?.type === 'offline' ? 'rgb(75 85 99 / 0.3)' :
                                'rgb(22 101 52 / 0.3)'
              }}
            >
              {currentStatusOption?.label}
            </Badge>
            
            <Switch 
              checked={isToggleOn} 
              onCheckedChange={setIsToggleOn}
              className="data-[state=checked]:bg-none [&_[data-state=checked]]:bg-white [&_[data-state=unchecked]]:bg-white"
              style={{
                backgroundColor: isToggleOn ? (
                  currentStatusOption?.type === 'available' ? 'rgb(22 101 52)' :
                  currentStatusOption?.type === 'focus' ? 'rgb(107 33 168)' :
                  currentStatusOption?.type === 'meeting' ? 'rgb(37 99 235)' :
                  currentStatusOption?.type === 'away' ? 'rgb(202 138 4)' :
                  currentStatusOption?.type === 'break' ? 'rgb(234 88 12)' :
                  currentStatusOption?.type === 'emergency' ? 'rgb(220 38 38)' :
                  currentStatusOption?.type === 'offline' ? 'rgb(75 85 99)' :
                  'rgb(22 101 52)'
                ) : undefined
              }}
            />
          </div>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-[267px] p-0" align="start" side="top">
        <div className="p-4">

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Status options */}
          <div className="space-y-1 mb-2">
            {statusOptions.map((option) => (
              <div
                key={option.type}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedStatus === option.type 
                    ? 'bg-neutral-700 text-white' 
                    : 'hover:bg-neutral-700/50'
                }`}
                onClick={() => handleStatusChange(option.type)}
              >
                <div className="flex gap-3 items-center">
                  <div className={`w-2 h-2 rounded-full ${option.bgColor}`}></div>
                  <span className="text-sm font-medium">{option.label}</span>
                </div>
                {selectedStatus === option.type && (
                  <Check className="h-4 w-4" />
                )}
              </div>
            ))}
          </div>

          {/* Text input */}
          <div className="mb-2">
            <Textarea
              id="message"
              placeholder="What are you working on?"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="min-h-[80px] resize-none w-full rounded-md"
            />
          </div>

          {/* Action buttons */}
           <div className="flex gap-2">
             <Button 
               variant="outline" 
               className="flex-1 h-10 border-border text-white bg-transparent hover:bg-neutral-700/50"
               onClick={() => setIsOpen(false)}
             >
               Cancel
             </Button>
             <Button 
               className="flex-1 h-10"
               onClick={handleUpdateStatus}
               disabled={loading || !selectedStatus || !selectedCompany}
             >
               {loading ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin hover:bg-neutral-400" />
                   Saving...
                 </>
               ) : (
                 'Save'
               )}
             </Button>
           </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default StatusSelector