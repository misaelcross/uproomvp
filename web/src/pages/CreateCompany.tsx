import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Building2, Loader2, LogOut, Plus } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'
import SubdomainChecker from '../components/SubdomainChecker'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../contexts/AuthContext'

const createCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  description: z.string().optional(),
  subdomain: z.string().min(3, 'Subdomain must be at least 3 characters')
})

type CreateCompanyForm = z.infer<typeof createCompanySchema>

const CreateCompany: React.FC = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { createCompany, userRole } = useCompany()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subdomainValid, setSubdomainValid] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<CreateCompanyForm>({
    resolver: zodResolver(createCompanySchema)
  })

  const watchedName = watch('name')
  const watchedSubdomain = watch('subdomain')

  // Auto-generate subdomain from company name
  React.useEffect(() => {
    if (watchedName) {
      const generated = watchedName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        .substring(0, 30) // Limit length
      setValue('subdomain', generated)
    }
  }, [watchedName, setValue])

  const onSubmit = async (data: CreateCompanyForm) => {
    if (!subdomainValid || !subdomainAvailable) {
      setError('Please choose a valid and available subdomain')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await createCompany({
        name: data.name,
        description: data.description,
        subdomain: data.subdomain
      })

      if (result.error) {
        setError(result.error)
      } else {
        // Redirect to the company's subdomain login page
        window.location.href = `${window.location.protocol}//${data.subdomain}.${window.location.host}/login`
      }
    } catch (error) {
      console.error('Error creating company:', error)
      setError('Failed to create company. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubdomainValidation = (isValid: boolean, isAvailable: boolean) => {
    setSubdomainValid(isValid)
    setSubdomainAvailable(isAvailable)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user?.email}</p>
                {userRole && (
                  <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </Badge>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="border-border/60 text-foreground hover:bg-muted">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Create Your Company Title */}
          <div className="w-full text-left">
            <h2 className="text-2xl font-bold text-foreground">Create Your Company</h2>
          </div>

          {/* Form */}
          <div className="max-w-2xl mx-auto">
            <Card className="bg-card/50 border-border/40">
              <CardHeader>
                <CardTitle className="text-foreground">Company Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">Company Name</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Enter your company name"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Subdomain */}
                  <div className="space-y-2">
                    <Label htmlFor="subdomain" className="text-foreground">Workspace URL</Label>
                    <SubdomainChecker
                      value={watchedSubdomain || ''}
                      onChange={(value) => setValue('subdomain', value)}
                      onValidationChange={handleSubdomainValidation}
                    />
                    <p className="text-sm text-muted-foreground">
                      Once created, your team will be able to access your workspace at{' '}
                      <span className="font-mono bg-muted px-1 py-0.5 rounded text-foreground">
                        {watchedSubdomain || 'your-company'}.uproom.com
                      </span>
                    </p>
                    {errors.subdomain && (
                      <p className="text-sm text-red-600">{errors.subdomain.message}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-foreground">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Tell us about your company..."
                      rows={3}
                    />
                  </div>

                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-800">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isLoading || !subdomainValid || !subdomainAvailable}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Company...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Company
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CreateCompany