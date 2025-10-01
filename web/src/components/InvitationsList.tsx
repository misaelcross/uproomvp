import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  Mail, 
  Clock, 
  RefreshCw, 
  Trash2, 
  UserPlus,
  AlertCircle 
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { InvitationService } from '@/lib/invitations-client'
import { CompanyInvitation } from '@/types/company'
import { formatDistanceToNow } from 'date-fns'

interface InvitationsListProps {
  companyId: string
  onInvitationChange?: () => void
}

const InvitationsList: React.FC<InvitationsListProps> = ({ 
  companyId, 
  onInvitationChange 
}) => {
  const { toast } = useToast()
  const [invitations, setInvitations] = useState<CompanyInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadInvitations()
  }, [companyId])

  const loadInvitations = async () => {
    try {
      setIsLoading(true)
      const invitationsData = await InvitationService.getCompanyInvitations(companyId)
      setInvitations(invitationsData)
    } catch (error) {
      console.error('Error loading invitations:', error)
      toast({
        title: 'Error',
        description: 'Failed to load invitations',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendInvitation = async (invitationId: string, email: string) => {
    try {
      setActionLoading(invitationId)
      const result = await InvitationService.resendInvitation(invitationId)
      
      if (result.success) {
        toast({
          title: 'Invitation resent',
          description: `Invitation has been resent to ${email}`,
        })
        onInvitationChange?.()
      } else {
        toast({
          title: 'Failed to resend invitation',
          description: result.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error resending invitation:', error)
      toast({
        title: 'Error',
        description: 'Failed to resend invitation',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    try {
      setActionLoading(invitationId)
      const result = await InvitationService.cancelInvitation(invitationId)
      
      if (result) {
        toast({
          title: 'Invitation cancelled',
          description: `Invitation for ${email} has been cancelled`,
        })
        // Remove from local state
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
        onInvitationChange?.()
      } else {
        toast({
          title: 'Failed to cancel invitation',
          description: 'Unable to cancel the invitation',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      toast({
        title: 'Error',
        description: 'Failed to cancel invitation',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (invitation: CompanyInvitation) => {
    const isExpired = new Date(invitation.expires_at) < new Date()
    
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>
    }
    
    if (invitation.accepted_at) {
      return <Badge variant="default">Accepted</Badge>
    }
    
    return <Badge variant="secondary">Pending</Badge>
  }

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      member: 'bg-green-100 text-green-800'
    }
    
    return (
      <Badge 
        variant="outline" 
        className={roleColors[role] || 'bg-gray-100 text-gray-800'}
      >
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">Loading invitations...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5" />
              <span>Pending Invitations</span>
            </CardTitle>
            <CardDescription>
              Manage invitations sent to new team members
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadInvitations}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {invitations.length === 0 ? (
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              No pending invitations. Use the "Invite User" button to send invitations to new team members.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => {
              const isExpired = new Date(invitation.expires_at) < new Date()
              const isActionLoading = actionLoading === invitation.id
              
              return (
                <div 
                  key={invitation.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <p className="font-medium">{invitation.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {getRoleBadge(invitation.role)}
                          {getStatusBadge(invitation)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          Sent {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {invitation.inviter && (
                        <div>
                          by {invitation.inviter.full_name || invitation.inviter.email}
                        </div>
                      )}
                      
                      {isExpired && (
                        <div className="flex items-center space-x-1 text-red-600">
                          <AlertCircle className="h-3 w-3" />
                          <span>Expired {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!invitation.accepted_at && !isExpired && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                        disabled={isActionLoading}
                      >
                        {isActionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Resend
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                      disabled={isActionLoading}
                      className="text-red-600 hover:text-red-700"
                    >
                      {isActionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Cancel
                    </Button>
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

export default InvitationsList