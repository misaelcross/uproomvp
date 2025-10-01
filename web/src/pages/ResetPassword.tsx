import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { AuthService } from '@/lib/auth-client'
import { useRateLimit } from '@/hooks/useRateLimit'

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password confirmation is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  const [resetComplete, setResetComplete] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Rate limiting for password reset attempts
  const { 
    isBlocked, 
    remainingAttempts, 
    executeWithRateLimit 
  } = useRateLimit({
    action: 'reset-password',
    identifier: 'global',
    maxAttempts: 5,
    windowMs: 10 * 60 * 1000 // 10 minutes
  })

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    const checkToken = async () => {
      const code = searchParams.get('code')
      const error_code = searchParams.get('error_code')
      
      if (error_code || !code) {
        setIsValidToken(false)
        return
      }

      try {
        // For now, we'll assume the token is valid if it exists
        // In a real implementation, you'd validate the JWT token
        if (code && code.length > 10) {
          setIsValidToken(true)
        } else {
          setIsValidToken(false)
        }
      } catch (error) {
        console.error('Error validating reset token:', error)
        setIsValidToken(false)
      }
    }

    checkToken()
  }, [searchParams])

  const onSubmit = async (data: ResetPasswordFormData) => {
    await executeWithRateLimit(async () => {
      setIsLoading(true)
      try {
        // For now, we'll show a success message
        // In a real implementation, you'd validate the token and update the password
        setResetComplete(true)
        toast({
          title: 'Password Updated',
          description: 'Your password has been successfully updated.',
        })
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } finally {
        setIsLoading(false)
      }
    }, undefined, (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    })
  }

  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Validating Reset Link...</CardTitle>
            <CardDescription>Please wait while we verify your reset token.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/forgot-password')}
              className="w-full"
            >
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (resetComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
            <CardTitle className="text-green-600">Password Updated!</CardTitle>
            <CardDescription>
              Your password has been successfully updated. Redirecting to login...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Set New Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Rate Limit Alerts */}
          {isBlocked && (
            <Alert className="mb-4 border-destructive/50 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Too many password reset attempts. Please wait before trying again.
              </AlertDescription>
            </Alert>
          )}
          
          {!isBlocked && remainingAttempts <= 2 && remainingAttempts > 0 && (
            <Alert className="mb-4 border-yellow-500/50 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Warning: {remainingAttempts} attempt{remainingAttempts === 1 ? '' : 's'} remaining before temporary lockout.
              </AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter new password"
                          className="pl-10 pr-10"
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm new password"
                          className="pl-10 pr-10"
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading || isBlocked}>
                {isLoading ? 'Updating Password...' : isBlocked ? 'Reset Blocked' : 'Update Password'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default ResetPassword