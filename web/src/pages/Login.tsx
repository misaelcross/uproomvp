import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, MessageCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useRateLimit } from '@/hooks/useRateLimit'
import { useSubdomain } from '@/hooks/useSubdomain'
import AuthRedirect from '@/components/AuthRedirect'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { subdomain, company, isValidWorkspace } = useSubdomain()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const {
    isBlocked,
    remainingAttempts,
    message: rateLimitMessage,
    executeWithRateLimit
  } = useRateLimit({
    action: 'login',
    identifier: form.watch('email') || 'unknown',
    onBlocked: (result) => {
      toast({
        title: 'Too Many Attempts',
        description: result.message,
        variant: 'destructive',
      })
    },
    onWarning: (result) => {
      toast({
        title: 'Warning',
        description: result.message,
        variant: 'default',
      })
    }
  })

  const onSubmit = async (data: LoginFormData) => {
    if (isBlocked) {
      toast({
        title: 'Login Blocked',
        description: rateLimitMessage,
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    
    try {
      await executeWithRateLimit(
        async () => {
          const { error } = await signIn(data.email, data.password)
          if (error) {
            throw new Error(error.message)
          }
          return { success: true }
        },
        () => {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully logged in.',
          })
          
          // Check if we're on a subdomain - if so, stay on subdomain after login
          if (subdomain && company && isValidWorkspace) {
            // Use a simple timeout to ensure the auth state is fully updated
            setTimeout(() => {
              window.location.href = `${window.location.protocol}//${window.location.host}/`
            }, 100)
          } else {
            // On main domain, redirect to main dashboard to show all workspaces
            navigate('/maindashboard')
          }
        },
        (error) => {
          toast({
            title: 'Login Failed',
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
    <AuthRedirect>
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
            <CardTitle className="text-2xl font-bold text-foreground">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your credentials to access your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(isBlocked || (remainingAttempts <= 2 && remainingAttempts > 0)) && (
              <Alert className={`mb-4 ${isBlocked ? 'border-destructive' : 'border-yellow-500'}`}>
                <AlertTriangle className={`h-4 w-4 ${isBlocked ? 'text-destructive' : 'text-yellow-500'}`} />
                <AlertDescription className={isBlocked ? 'text-destructive' : 'text-yellow-600'}>
                  {isBlocked 
                    ? rateLimitMessage 
                    : `Warning: ${remainingAttempts} login attempts remaining before temporary lockout.`
                  }
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
                            placeholder="Enter your password"
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

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isBlocked}>
                  {isLoading ? 'Signing in...' : isBlocked ? 'Login Blocked' : 'Sign In'}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <Link to="/forgot-password" className="text-primary hover:text-primary/80 transition-colors">
                Forgot your password?
              </Link>
            </div>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link
                to="/register"
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </AuthRedirect>
  )
}

export default Login