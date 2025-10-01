import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MoreHorizontal, 
  Crown, 
  Shield, 
  User, 
  Mail,
  Calendar,
  Loader2,
  Users
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { CompanyService } from '@/lib/company-client'
import { useAuth } from '@/contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'

interface TeamMember {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: 'owner' | 'admin' | 'manager' | 'member'
  joined_at: string
  last_seen?: string
  status: 'active' | 'inactive'
}

interface TeamMembersListProps {
  companyId: string
}

const TeamMembersList: React.FC<TeamMembersListProps> = ({ companyId }) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadTeamMembers()
  }, [companyId])

  const loadTeamMembers = async () => {
    try {
      setIsLoading(true)
      
      const { members, error } = await CompanyService.getCompanyMembers(companyId)

      if (error) {
        console.error('Error loading team members:', error)
        toast({
          title: 'Error loading team members',
          description: error,
          variant: 'destructive'
        })
        return
      }

      // Transform the data to match our interface
      const transformedMembers: TeamMember[] = members.map(member => ({
        id: member.user.id,
        email: member.user.email,
        full_name: member.user.fullName || undefined,
        avatar_url: member.user.avatar || undefined,
        role: member.role,
        joined_at: member.createdAt.toISOString(),
        last_seen: undefined, // TODO: Add last_seen to User model if needed
        status: member.isActive ? 'active' : 'inactive'
      }))

      setMembers(transformedMembers)
    } catch (error) {
      console.error('Error loading team members:', error)
      toast({
        title: 'Error',
        description: 'Failed to load team members',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      setActionLoading(memberId)
      
      const { member, error } = await CompanyService.updateMemberRole(memberId, newRole as any)

      if (error) {
        console.error('Error updating role:', error)
        toast({
          title: 'Error updating role',
          description: error,
          variant: 'destructive'
        })
        return
      }

      toast({
        title: 'Role updated',
        description: `Member role has been updated to ${newRole}`,
      })

      // Update local state
      setMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, role: newRole as TeamMember['role'] }
          : member
      ))
    } catch (error) {
      console.error('Error updating role:', error)
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    try {
      setActionLoading(memberId)
      
      const { success, error } = await CompanyService.removeMember(memberId)

      if (error || !success) {
        console.error('Error removing member:', error)
        toast({
          title: 'Error removing member',
          description: error || 'Failed to remove member',
          variant: 'destructive'
        })
        return
      }

      toast({
        title: 'Member removed',
        description: `${memberEmail} has been removed from the team`,
      })

      // Remove from local state
      setMembers(prev => prev.filter(member => member.id !== memberId))
    } catch (error) {
      console.error('Error removing member:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove team member',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />
      case 'admin':
        return <Shield className="h-4 w-4 text-red-600" />
      case 'manager':
        return <User className="h-4 w-4 text-blue-600" />
      default:
        return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      owner: 'bg-yellow-100 text-yellow-800',
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      member: 'bg-green-100 text-green-800'
    }
    
    return (
      <Badge 
        variant="outline" 
        className={`${roleColors[role] || 'bg-gray-100 text-gray-800'} flex items-center space-x-1`}
      >
        {getRoleIcon(role)}
        <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
      </Badge>
    )
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const canManageMember = (member: TeamMember) => {
    // Only owners and admins can manage members
    // Owners can manage everyone except other owners
    // Admins can manage managers and members
    const currentUserMember = members.find(m => m.id === user?.id)
    if (!currentUserMember) return false

    if (currentUserMember.role === 'owner') {
      return member.role !== 'owner' || member.id === user?.id
    }
    
    if (currentUserMember.role === 'admin') {
      return ['manager', 'member'].includes(member.role)
    }

    return false
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">Loading team members...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Team Members ({members.length})</span>
        </CardTitle>
        <CardDescription>
          Manage your team members and their roles
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {members.length === 0 ? (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              No team members found. Invite users to join your company workspace.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {members.map((member) => {
              const isActionLoading = actionLoading === member.id
              const canManage = canManageMember(member)
              
              return (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback>
                        {getInitials(member.full_name, member.email)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">
                          {member.full_name || member.email}
                        </p>
                        {member.id === user?.id && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{member.email}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getRoleBadge(member.role)}
                    
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            disabled={isActionLoading}
                          >
                            {isActionLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Manage Member</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          {member.role !== 'admin' && (
                            <DropdownMenuItem 
                              onClick={() => handleRoleChange(member.id, 'admin')}
                            >
                              Make Admin
                            </DropdownMenuItem>
                          )}
                          
                          {member.role !== 'manager' && (
                            <DropdownMenuItem 
                              onClick={() => handleRoleChange(member.id, 'manager')}
                            >
                              Make Manager
                            </DropdownMenuItem>
                          )}
                          
                          {member.role !== 'member' && (
                            <DropdownMenuItem 
                              onClick={() => handleRoleChange(member.id, 'member')}
                            >
                              Make Member
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleRemoveMember(member.id, member.email)}
                            className="text-red-600"
                          >
                            Remove from Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TeamMembersList