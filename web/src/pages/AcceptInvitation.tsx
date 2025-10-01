import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, Building2, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { InvitationService } from '@/lib/invitations-client'
import { SubdomainService } from '@/lib/subdomain'

const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    invitation?: any
  } | null>(null)

  useEffect(() => {
    if (!token) {
      setResult({
        success: false,
        message: 'Invalid invitation link'
      })
      setIsLoading(false)
      return
    }

    // If user is not authenticated, redirect to login with return URL
    if (!user) {
      const returnUrl = encodeURIComponent(window.location.pathname)
      navigate(`/login?returnUrl=${returnUrl}`)
      return
    }

    // Auto-accept invitation if user is authenticated
    handleAcceptInvitation()
  }, [token, user, navigate])

  const handleAcceptInvitation = async () => {
    if (!token) return

    setIsAccepting(true)
    
    try {
      const result = await InvitationService.acceptInvitation(token)
      setResult(result)

      if (result.success) {
        toast({
          title: 'Welcome to the team!',
          description: result.message,
        })

        // Redirect to company workspace after a short delay
        if (result.invitation?.company) {
          setTimeout(() => {
            const workspaceUrl = SubdomainService.getWorkspaceUrl(result.invitation.company.subdomain)
            window.location.href = workspaceUrl
          }, 2000)
        }
      } else {
        toast({
          title: 'Unable to accept invitation',
          description: result.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error accepting invitation:', error)
      setResult({
        success: false,
        message: 'An unexpected error occurred'
      })
      
      toast({
        title: 'Error',
        description: 'Failed to accept invitation. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsAccepting(false)
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setResult(null)
    setIsLoading(true)
    handleAcceptInvitation()
  }

  const handleGoToLogin = () => {
    const returnUrl = encodeURIComponent(window.location.pathname)
    navigate(`/login?returnUrl=${returnUrl}`)
  }

  const handleGoHome = () => {
    navigate('/')
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">
                {isAccepting ? 'Accepting invitation...' : 'Loading invitation...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No token
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is not valid or has been corrupted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGoHome} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <UserPlus className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to accept this invitation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGoToLogin} className="w-full">
              Sign In
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show result
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
            result?.success ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {result?.success ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </div>
          <CardTitle className="text-xl">
            {result?.success ? 'Welcome to the Team!' : 'Invitation Error'}
          </CardTitle>
          <CardDescription>
            {result?.success 
              ? 'You have successfully joined the company workspace.'
              : 'There was a problem accepting your invitation.'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert className={result?.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <AlertDescription className={result?.success ? 'text-green-800' : 'text-red-800'}>
              {result?.message}
            </AlertDescription>
          </Alert>

          {result?.success ? (
            <div className="space-y-2">
              {result.invitation?.company && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">{result.invitation.company.name}</p>
                    <p className="text-sm text-blue-700">
                      Redirecting to workspace...
                    </p>
                  </div>
                </div>
              )}
              <Button 
                onClick={() => {
                  if (result.invitation?.company) {
                    const workspaceUrl = SubdomainService.getWorkspaceUrl(result.invitation.company.subdomain)
                    window.location.href = workspaceUrl
                  } else {
                    handleGoHome()
                  }
                }} 
                className="w-full"
              >
                Go to Workspace
              </Button>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <Button onClick={handleRetry} className="w-full">
                Try Again
              </Button>
              <Button variant="outline" onClick={handleGoHome} className="w-full">
                Go to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AcceptInvitation