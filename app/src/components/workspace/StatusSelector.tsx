import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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
import { useCompany } from '@/contexts/CompanyContext'
import { Switch } from '../ui/switch'

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
  const { currentCompany } = useCompany()
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
    }
  }, [user, companyId])

  useEffect(() => {
    if (user && (companyId || selectedCompany)) {
      fetchCurrentStatus()
    }
  }, [user, companyId, selectedCompany])

  const fetchUserCompanies = async () => {
    try {
      // Simular busca de empresas - implementar com API real
      const companiesData = currentCompany ? [{
        id: currentCompany.id,
        name: currentCompany.name
      }] : []
      
      setCompanies(companiesData)

      if (companyId && companyId !== selectedCompany) {
        setSelectedCompany(companyId)
      } else if (companiesData.length > 0 && !selectedCompany) {
        setSelectedCompany(companiesData[0].id)
      }
    } catch (err: any) {
      console.error('Error fetching companies:', err)
    }
  }

  const fetchCurrentStatus = async () => {
    if (!selectedCompany || !user) return

    try {
      const token = localStorage.getItem('auth_token')
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '')
      
      const response = await fetch(`${apiUrl}/presence/${selectedCompany}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const presence = data.presence
        
        // Converter status para lowercase para corresponder ao frontend
        const status = presence.status.toLowerCase()
        
        setCurrentStatus({
          status,
          message: presence.message || '',
          isOnline: presence.isOnline
        })
        setSelectedStatus(status)
        setCustomMessage(presence.message || '')
        setIsToggleOn(status !== 'offline')
      } else {
        // Create default status if none exists
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
      // Simular criação de status padrão - implementar com API real
      const defaultStatus = {
        status: 'OFFLINE',
        message: 'Finished for today',
        isOnline: false
      }

      setCurrentStatus(defaultStatus)
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
      const token = localStorage.getItem('auth_token')
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '')
      
      // Converter status para uppercase para a API
      const statusUppercase = selectedStatus.toUpperCase()
      
      const response = await fetch(`${apiUrl}/presence/${selectedCompany}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: statusUppercase,
          message: customMessage,
          isOnline: selectedStatus !== 'offline',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const presence = data.presence
        
        setCurrentStatus({
          status: selectedStatus,
          message: presence.message || customMessage,
          isOnline: presence.isOnline
        })
        setIsToggleOn(selectedStatus !== 'offline')
        setSuccess('Status atualizado com sucesso!')
        
        // Notificar o componente pai se houver callback
        if (onStatusUpdate) {
          onStatusUpdate()
        }
        
        // Close the selector after a brief delay
        setTimeout(() => {
          setIsOpen(false)
          setSuccess('')
        }, 1500)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Falha ao atualizar status')
      }
    } catch (err: any) {
      console.error('Error updating status:', err)
      setError(err.message || 'Falha ao atualizar status')
    } finally {
      setLoading(false)
    }
  }

  const getStatusOption = (type: string) => {
    return statusOptions.find(opt => opt.type === type)
  }

  const currentStatusOption = currentStatus ? getStatusOption(currentStatus.status) : getStatusOption('available')
  const displayMessage = currentStatus?.message || currentStatusOption?.defaultMessage || 'Available for work'
  const truncatedMessage = displayMessage.length > 35 ? displayMessage.substring(0, 35) + '...' : displayMessage

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div className={`w-full p-3 border-2 rounded-lg cursor-pointer hover:bg-neutral-700/50 transition-colors ${className}`}>
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

      <DropdownMenuContent className="w-[222px] p-0" align="start" side="top">
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
               className="flex-1 h-10 border-2 border-border text-white bg-transparent hover:bg-neutral-700/50"
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
