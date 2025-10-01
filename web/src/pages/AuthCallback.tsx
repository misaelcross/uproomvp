import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

const AuthCallback = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash and search params
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const searchParams = new URLSearchParams(window.location.search)
        
        // Check for error in URL
        const error = hashParams.get('error') || searchParams.get('error')
        const errorDescription = hashParams.get('error_description') || searchParams.get('error_description')
        
        if (error) {
          setError(errorDescription || 'Authentication failed')
          setLoading(false)
          return
        }

        // Handle the auth callback
        const { data, error: authError } = await supabase.auth.getSession()
        
        if (authError) {
          setError(authError.message)
          setLoading(false)
          return
        }

        if (data.session) {
          setSuccess(true)
          toast({
            title: 'Email Confirmed!',
            description: 'Your account has been successfully verified.',
          })
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard')
          }, 2000)
        } else {
          setError('No session found. Please try logging in again.')
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [navigate, toast])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Verifying your email...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {success ? 'Email Verified!' : 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {success 
              ? 'Your account has been successfully verified.'
              : 'There was a problem verifying your email.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                You will be redirected to the dashboard shortly.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'An unexpected error occurred during verification.'}
              </AlertDescription>
            </Alert>
          )}
          
          {!success && (
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md transition-colors"
              >
                Try Registering Again
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AuthCallback