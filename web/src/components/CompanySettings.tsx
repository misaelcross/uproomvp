import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Building2, 
  Users, 
  Mail, 
  Save, 
  Loader2, 
  Settings,
  UserPlus,
  Globe,
  AlertCircle
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/hooks/use-toast'
import { CompanyService } from '@/lib/company-client'
import { useAuth } from '@/contexts/AuthContext'
import InviteUserDialog from './InviteUserDialog'
import InvitationsList from './InvitationsList'
import TeamMembersList from './TeamMembersList'

const companySettingsSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  description: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63, 'Subdomain must be less than 63 characters')
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens')
})

type CompanySettingsForm = z.infer<typeof companySettingsSchema>

interface Company {
  id: string
  name: string
  description?: string
  website?: string
  subdomain: string
  created_at: string
  owner_id: string
}

interface CompanySettingsProps {
  companyId: string
}

const CompanySettings: React.FC<CompanySettingsProps> = ({ companyId }) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm<CompanySettingsForm>({
    resolver: zodResolver(companySettingsSchema)
  })

  useEffect(() => {
    loadCompanyData()
  }, [companyId])

  const loadCompanyData = async () => {
    try {
      setIsLoading(true)
      
      // TODO: Implement company loading with Prisma
      console.log('Company loading needs to be implemented with Prisma')
      
      // For now, set a placeholder company
      const placeholderCompany = {
        id: companyId,
        name: 'Loading...',
        description: '',
        website: '',
        subdomain: 'loading',
        created_at: new Date().toISOString(),
        owner_id: user?.id || ''
      }
      
      setCompany(placeholderCompany)
      reset({
        name: placeholderCompany.name,
        description: placeholderCompany.description,
        website: placeholderCompany.website,
        subdomain: placeholderCompany.subdomain
      })
    } catch (error) {
      console.error('Error loading company:', error)
      toast({
        title: 'Error',
        description: 'Failed to load company data',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: CompanySettingsForm) => {
    try {
      setIsSaving(true)

      // Check if subdomain is available (if changed)
      if (data.subdomain !== company?.subdomain) {
        const { available, error: subdomainError } = await CompanyService.checkSubdomainAvailability(data.subdomain)
        
        if (subdomainError || !available) {
          toast({
            title: 'Subdomain not available',
            description: 'This subdomain is already taken. Please choose another one.',
            variant: 'destructive'
          })
          return
        }
      }

      const { company: updatedCompany, error } = await CompanyService.updateCompany(companyId, {
        name: data.name,
        description: data.description,
        websiteUrl: data.website
      })

      if (error) {
        console.error('Error updating company:', error)
        toast({
          title: 'Error updating company',
          description: error,
          variant: 'destructive'
        })
        return
      }

      toast({
        title: 'Settings saved',
        description: 'Company settings have been updated successfully.',
      })

      // Reload company data to get updated values
      await loadCompanyData()
    } catch (error) {
      console.error('Error saving company settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to save company settings',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInvitationChange = () => {
    // Refresh invitations list when an invitation is sent/cancelled
    // The InvitationsList component will handle its own refresh
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading company settings...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!company) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Company not found or you don't have permission to view these settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const isOwner = user?.id === company.owner_id

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <Settings className="h-6 w-6" />
            <span>Company Settings</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your company profile and team members
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Team</span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Invitations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Update your company's basic information and branding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Enter company name"
                      disabled={!isOwner}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subdomain">Subdomain</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="subdomain"
                        {...register('subdomain')}
                        placeholder="your-company"
                        disabled={!isOwner}
                      />
                      <span className="text-sm text-gray-500">.uproom.com</span>
                    </div>
                    {errors.subdomain && (
                      <p className="text-sm text-red-600">{errors.subdomain.message}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      This will be your company's unique workspace URL
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <Input
                      id="website"
                      {...register('website')}
                      placeholder="https://your-company.com"
                      disabled={!isOwner}
                    />
                  </div>
                  {errors.website && (
                    <p className="text-sm text-red-600">{errors.website.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Tell us about your company..."
                    rows={4}
                    disabled={!isOwner}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                {isOwner && (
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={!isDirty || isSaving}
                      className="flex items-center space-x-2"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </Button>
                  </div>
                )}

                {!isOwner && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Only the company owner can modify these settings.
                    </AlertDescription>
                  </Alert>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Management</CardTitle>
                    <CardDescription>
                      Invite new members and manage existing team members
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setShowInviteDialog(true)}
                    className="flex items-center space-x-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Invite User</span>
                  </Button>
                </div>
              </CardHeader>
            </Card>
            
            <TeamMembersList companyId={companyId} />
          </div>
        </TabsContent>

        <TabsContent value="invitations">
          <InvitationsList 
            companyId={companyId} 
            onInvitationChange={handleInvitationChange}
          />
        </TabsContent>
      </Tabs>

      <InviteUserDialog
        companyId={companyId}
        companyName={company?.name || 'Company'}
        onInviteSent={handleInvitationChange}
      />
    </div>
  )
}

export default CompanySettings