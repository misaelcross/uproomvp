import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, MessageCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useRateLimit } from '@/hooks/useRateLimit'

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password confirmation is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signUp } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const {
    isBlocked,
    remainingAttempts,
    executeWithRateLimit
  } = useRateLimit({
    action: 'register',
    identifier: form.watch('email') || 'unknown',
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000 // 15 minutes
  })

  const onSubmit = async (data: RegisterFormData) => {
    if (isBlocked) {
      toast({
        title: 'Registration Blocked',
        description: 'Too many registration attempts. Please wait before trying again.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    
    try {
      await executeWithRateLimit(
        async () => {
          console.log('Attempting registration with:', { email: data.email })
          const result = await signUp(data.email, data.password)
          
          console.log('Registration result:', result)
          
          if (result.error) {
            console.error('Registration error details:', {
              message: result.error,
              details: result
            })
            
            let errorMessage = result.error
            
            // Provide more specific error messages
            if (result.error.includes('Invalid login credentials')) {
              errorMessage = 'Invalid email or password format'
            } else if (result.error.includes('User already registered')) {
              errorMessage = 'An account with this email already exists'
            } else if (result.error.includes('Password should be at least')) {
              errorMessage = 'Password must be at least 6 characters long'
            } else if (result.error.includes('Unable to validate email address')) {
              errorMessage = 'Please enter a valid email address'
            } else if (result.error.includes('Database error')) {
              errorMessage = 'Database connection error. Please check your Supabase configuration.'
            }
            
            throw new Error(errorMessage)
          }
          
          // Handle email confirmation requirement
          if (result.requiresConfirmation) {
            throw new Error(result.message || 'Please check your email to confirm your account.')
          }
          
          return { success: true }
        },
        () => {
          toast({
            title: 'Registration Successful!',
            description: 'Please check your email to verify your account.',
          })
          navigate('/login')
        },
        (error) => {
          toast({
            title: 'Registration Failed',
            description: error.message,
            variant: 'destructive',
          })
        }
      )
    } catch (error) {
      // Error already handled by executeWithRateLimit
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),transparent)]" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors">
            <span className="text-xl font-semibold">Uproom</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-border/40 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-foreground">Create Account</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your information to create your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Rate Limit Alerts */}
            {isBlocked && (
              <Alert className="mb-4 border-destructive/50 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Too many failed attempts. Please wait before trying again.
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10 bg-background/50 border-border/60 text-foreground placeholder:text-muted-foreground focus:border-primary"
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create a password"
                            className="pl-10 pr-10 bg-background/50 border-border/60 text-foreground placeholder:text-muted-foreground focus:border-primary"
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
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
                      <FormLabel className="text-foreground">Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            className="pl-10 pr-10 bg-background/50 border-border/60 text-foreground placeholder:text-muted-foreground focus:border-primary"
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={isLoading}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isBlocked}>
                  {isLoading ? 'Creating account...' : isBlocked ? 'Registration Blocked' : 'Create Account'}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link
                to="/login"
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Register