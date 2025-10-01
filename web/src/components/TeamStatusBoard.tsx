import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Alert, AlertDescription } from './ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { 
  Users, 
  Search, 
  RefreshCw,
  Clock,
  CheckCircle,
  Coffee,
  Home,
  Briefcase,
  Phone,
  Calendar,
  Moon,
  Zap,
  AlertCircle,
  Filter,
  User
} from 'lucide-react'
import { CompanyService } from '@/lib/company-client'
import { useAuth } from '@/contexts/AuthContext'

interface TeamMember {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  job_title: string | null
  role: string
  status: {
    status_type: string
    status_message: string | null
    created_at: string
    expires_at: string | null
    auto_set: boolean
  } | null
}

interface Company {
  id: string
  name: string
}

const statusIcons: Record<string, React.ReactNode> = {
  available: <CheckCircle className="h-4 w-4" />,
  busy: <Zap className="h-4 w-4" />,
  in_meeting: <Calendar className="h-4 w-4" />,
  on_call: <Phone className="h-4 w-4" />,
  break: <Coffee className="h-4 w-4" />,
  lunch: <Coffee className="h-4 w-4" />,
  away: <Clock className="h-4 w-4" />,
  wfh: <Home className="h-4 w-4" />,
  offline: <Moon className="h-4 w-4" />
}

const statusColors: Record<string, string> = {
  available: 'bg-green-500',
  busy: 'bg-red-500',
  in_meeting: 'bg-blue-500',
  on_call: 'bg-purple-500',
  break: 'bg-orange-500',
  lunch: 'bg-yellow-500',
  away: 'bg-gray-500',
  wfh: 'bg-indigo-500',
  offline: 'bg-gray-400'
}

const statusLabels: Record<string, string> = {
  available: 'Available',
  busy: 'Busy',
  in_meeting: 'In Meeting',
  on_call: 'On Call',
  break: 'On Break',
  lunch: 'At Lunch',
  away: 'Away',
  wfh: 'Working from Home',
  offline: 'Offline'
}

interface TeamStatusBoardProps {
  companyId?: string
  className?: string
}

const TeamStatusBoard: React.FC<TeamStatusBoardProps> = ({ 
  companyId, 
  className = '' 
}) => {
  const { user } = useAuth()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>(companyId || '')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      fetchUserCompanies()
    }
  }, [user])

  useEffect(() => {
    if (selectedCompany) {
      fetchTeamMembers()
    }
  }, [selectedCompany])

  const fetchUserCompanies = async () => {
    try {
      const { companies, error } = await CompanyService.getUserCompanies(user?.id || '')
      
      if (error) {
        setError('Failed to load companies')
        console.error('Error fetching companies:', error)
        return
      }

      const companiesData = companies.map(company => ({
        id: company.id,
        name: company.name
      }))

      setCompanies(companiesData)

      // Auto-select first company if no companyId provided
      if (!companyId && companiesData.length > 0) {
        setSelectedCompany(companiesData[0].id)
      }
    } catch (err: any) {
      setError('Failed to load companies')
      console.error('Error fetching companies:', err)
    }
  }

  const fetchTeamMembers = async () => {
    if (!selectedCompany) return

    setLoading(true)
    setError('')

    try {
      // Get all company members
      const { members, error: membersError } = await CompanyService.getCompanyMembers(selectedCompany)
      
      if (membersError) {
        setError('Failed to load team members')
        return
      }

      // Transform member data to match interface
      const teamData: TeamMember[] = members.map(member => ({
        id: member.user.id,
        email: member.user.email,
        first_name: member.user.fullName?.split(' ')[0] || null,
        last_name: member.user.fullName?.split(' ').slice(1).join(' ') || null,
        full_name: member.user.fullName || null,
        job_title: null, // TODO: Add job_title to User model if needed
        role: member.role,
        status: null // TODO: Implement user status functionality
      }))

      setTeamMembers(teamData)
    } catch (err: any) {
      setError(err.message || 'Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchTeamMembers()
    setRefreshing(false)
  }

  const getDisplayName = (member: TeamMember) => {
    if (member.full_name) return member.full_name
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`
    }
    if (member.first_name) return member.first_name
    return member.email.split('@')[0]
  }

  const getInitials = (member: TeamMember) => {
    const name = getDisplayName(member)
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getStatusDisplay = (member: TeamMember) => {
    if (!member.status) {
      return {
        type: 'offline',
        label: 'Offline',
        message: 'No status set',
        color: statusColors.offline,
        icon: statusIcons.offline,
        isExpired: false
      }
    }

    const isExpired = member.status.expires_at && new Date(member.status.expires_at) < new Date()
    
    return {
      type: member.status.status_type,
      label: statusLabels[member.status.status_type] || member.status.status_type,
      message: member.status.status_message,
      color: statusColors[member.status.status_type] || statusColors.offline,
      icon: statusIcons[member.status.status_type] || statusIcons.offline,
      isExpired,
      autoSet: member.status.auto_set,
      createdAt: member.status.created_at,
      expiresAt: member.status.expires_at
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'admin':
        return 'secondary'
      case 'member':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = searchTerm === '' || 
      getDisplayName(member).toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.job_title && member.job_title.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilter = statusFilter === 'all' || 
      (member.status?.status_type === statusFilter) ||
      (statusFilter === 'offline' && !member.status)

    return matchesSearch && matchesFilter
  })

  const statusCounts = teamMembers.reduce((acc, member) => {
    const statusType = member.status?.status_type || 'offline'
    acc[statusType] = (acc[statusType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading team status...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Team Status Board
            </CardTitle>
            <CardDescription>
              {selectedCompany && companies.find(c => c.id === selectedCompany)?.name} • {teamMembers.length} members
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Status Summary */}
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('all')}
          >
            All ({teamMembers.length})
          </Badge>
          {Object.entries(statusCounts).map(([status, count]) => (
            <Badge
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setStatusFilter(status)}
            >
              {statusLabels[status] || status} ({count})
            </Badge>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Team Members List */}
        <div className="space-y-3">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No team members found</p>
            </div>
          ) : (
            filteredMembers.map((member) => {
              const statusDisplay = getStatusDisplay(member)
              return (
                <div key={member.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt={getDisplayName(member)} />
                    <AvatarFallback>{getInitials(member)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {getDisplayName(member)}
                      </h3>
                      <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                        {member.role}
                      </Badge>
                      {member.id === user?.id && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{member.email}</p>
                    {member.job_title && (
                      <p className="text-xs text-gray-500 truncate">{member.job_title}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${statusDisplay.color}`}></div>
                        <div className="flex items-center space-x-1">
                          {statusDisplay.icon}
                          <span className="text-sm font-medium">{statusDisplay.label}</span>
                        </div>
                      </div>
                      {statusDisplay.message && (
                        <p className="text-xs text-gray-600 truncate max-w-32">
                          {statusDisplay.message}
                        </p>
                      )}
                      {statusDisplay.createdAt && (
                        <p className="text-xs text-gray-400">
                          {new Date(statusDisplay.createdAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {teamMembers.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No team members</h3>
            <p className="text-gray-600">
              This workspace doesn't have any active members yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TeamStatusBoard