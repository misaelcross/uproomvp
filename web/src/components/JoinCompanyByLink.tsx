import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Loader2, Link, UserPlus, CheckCircle, XCircle, Building2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/use-toast'
import { InvitationService } from '../lib/invitations-client'
import { SubdomainService } from '../lib/subdomain'

interface JoinCompanyByLinkProps {
  className?: string
}

const JoinCompanyByLink: React.FC<JoinCompanyByLinkProps> = ({ className = "" }) => {
  const [invitationLink, setInvitationLink] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [invitationDetails, setInvitationDetails] = useState<any>(null)
  
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const extractTokenFromUrl = (url: string): string | null => {
    try {
      // Handle different URL formats:
      // 1. Full URL: https://company.mindfulcomm.app/accept-invitation/token123
      // 2. Path only: /accept-invitation/token123
      // 3. Token only: token123
      
      const urlObj = new URL(url.startsWith('http') ? url : `https://example.com${url.startsWith('/') ? url : `/${url}`}`)
      const pathParts = urlObj.pathname.split('/')
      
      // Look for accept-invitation in the path
      const invitationIndex = pathParts.findIndex(part => part === 'accept-invitation')
      if (invitationIndex !== -1 && pathParts[invitationIndex + 1]) {
        return pathParts[invitationIndex + 1]
      }
      
      // If no accept-invitation path found, assume the entire input is a token
      if (!url.includes('/') && !url.includes('.')) {
        return url
      }
      
      return null
    } catch (error) {
      // If URL parsing fails, check if it's just a token
      if (!invitationLink.includes('/') && !invitationLink.includes('.')) {
        return invitationLink
      }
      return null
    }
  }

  const validateInvitation = async () => {
    if (!invitationLink.trim()) {
      setError('Please enter an invitation link or token')
      return
    }

    if (!user) {
      setError('You must be signed in to accept invitations')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')
    setInvitationDetails(null)

    try {
      const token = extractTokenFromUrl(invitationLink.trim())
      
      if (!token) {
        setError('Invalid invitation link format. Please check the link and try again.')
        return
      }

      // Validate the invitation token
      const result = await InvitationService.validateInvitation(token)
      
      if (!result.success) {
        setError(result.message)
        return
      }

      setInvitationDetails(result.invitation)
      setSuccess('Invitation validated successfully! Click "Accept Invitation" to join the company.')
      
    } catch (err: any) {
      console.error('Error validating invitation:', err)
      setError('Failed to validate invitation. Please check the link and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const acceptInvitation = async () => {
    if (!invitationDetails || !user) return

    setIsLoading(true)
    setError('')

    try {
      const token = extractTokenFromUrl(invitationLink.trim())
      if (!token) {
        setError('Invalid invitation token')
        return
      }

      const result = await InvitationService.acceptInvitation(token)
      
      if (!result.success) {
        setError(result.message)
        return
      }

      toast({
        title: "Success!",
        description: `You've successfully joined ${invitationDetails.company.name}!`,
      })

      // Redirect to the company workspace
      const workspaceUrl = SubdomainService.getWorkspaceUrl(invitationDetails.company.subdomain)
      setTimeout(() => {
        window.location.href = workspaceUrl
      }, 1500)
      
    } catch (err: any) {
      console.error('Error accepting invitation:', err)
      setError('Failed to accept invitation. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      if (invitationDetails) {
        acceptInvitation()
      } else {
        validateInvitation()
      }
    }
  }

  const resetForm = () => {
    setInvitationLink('')
    setError('')
    setSuccess('')
    setInvitationDetails(null)
  }

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Link className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl">Join by Invitation Link</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        {!invitationDetails ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                id="invitation-link"
                type="text"
                placeholder="Paste invitation link here..."
                value={invitationLink}
                onChange={(e) => setInvitationLink(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
            </div>
            
            <Button 
              onClick={validateInvitation}
              disabled={isLoading || !invitationLink.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Link className="mr-2 h-4 w-4" />
                  Validate Invitation
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Invitation Details */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-start space-x-3">
                  <Building2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900">{invitationDetails.company.name}</h3>
                    <p className="text-sm text-green-700">
                      {invitationDetails.company.subdomain}.mindfulcomm.app
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-green-600">
                        <strong>Role:</strong> {invitationDetails.role}
                      </p>
                      <p className="text-sm text-green-600">
                        <strong>Invited by:</strong> {invitationDetails.inviter?.full_name || invitationDetails.inviter?.email}
                      </p>
                      <p className="text-sm text-green-600">
                        <strong>Expires:</strong> {new Date(invitationDetails.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex space-x-2">
              <Button 
                onClick={acceptInvitation}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Accept Invitation
                  </>
                )}
              </Button>
              
              <Button 
                onClick={resetForm}
                variant="outline"
                disabled={isLoading}
              >
                Try Another
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default JoinCompanyByLink