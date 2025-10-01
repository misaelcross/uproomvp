import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import SubdomainChecker from '@/components/SubdomainChecker'
import { useCompany } from '@/contexts/CompanyContext'

const createCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  description: z.string().optional(),
  subdomain: z.string().min(3, 'Subdomain must be at least 3 characters')
})

type CreateCompanyForm = z.infer<typeof createCompanySchema>

const CreateCompany: React.FC = () => {
  const navigate = useNavigate()
  const { createCompany } = useCompany()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subdomainValid, setSubdomainValid] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState(false)

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
    if (watchedName && !watchedSubdomain) {
      const generated = watchedName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 30)
      setValue('subdomain', generated)
    }
  }, [watchedName, watchedSubdomain, setValue])

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
        navigate('/dashboard')
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center">
            <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Create Your Company</h1>
            <p className="mt-2 text-gray-600">
              Set up your company workspace and get started with your team
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Tell us about your company to create your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
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
                <Label htmlFor="subdomain">Workspace URL *</Label>
                <SubdomainChecker
                  value={watchedSubdomain || ''}
                  onChange={(value) => setValue('subdomain', value)}
                  onValidationChange={handleSubdomainValidation}
                />
                {errors.subdomain && (
                  <p className="text-sm text-red-600">{errors.subdomain.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Tell us about your company..."
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !subdomainValid || !subdomainAvailable}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Company'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Your company workspace will be created</li>
              <li>• You'll be set as the company owner</li>
              <li>• You can start inviting team members</li>
              <li>• Your workspace will be accessible at your custom subdomain</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CreateCompany