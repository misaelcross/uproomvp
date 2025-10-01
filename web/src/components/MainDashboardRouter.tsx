import React, { useEffect } from 'react'
import { useSubdomain } from '@/hooks/useSubdomain'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/contexts/CompanyContext'
import ProtectedRoute from './ProtectedRoute'
import MainDashboard from './MainDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home, Building2, Users, Plus, Link } from 'lucide-react'
import { SubdomainService } from '@/lib/subdomain'

const MainDashboardRouter: React.FC = () => {
  const { subdomain, company, isLoading, isValidWorkspace } = useSubdomain()
  const { user } = useAuth()
  const { currentCompany, userCompanies, isLoading: companyLoading } = useCompany()

  useEffect(() => {
    // If we're on a subdomain and user is authenticated, they should use their workspace
    if (!isLoading && subdomain && user && company && isValidWorkspace) {
      const isMemberOfThisCompany = userCompanies?.some(uc => uc.id === company.id)
      
      if (isMemberOfThisCompany) {
        // Redirect to the company workspace root (which shows MainDashboard)
        window.location.href = SubdomainService.getWorkspaceUrl(subdomain)
        return
      }
    }

    // Removed the automatic redirect for main domain users with currentCompany
    // This allows authenticated organization members to access /maindashboard and see all their workspaces
  }, [isLoading, companyLoading, subdomain, isValidWorkspace, company, user, userCompanies, currentCompany])

  // Show loading while checking subdomain and company status
  if (isLoading || companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If we're on a subdomain, show message to use workspace
  if (subdomain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <AlertTriangle className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Use Your Workspace</CardTitle>
            <CardDescription>
              You're in a workspace subdomain. Use your workspace dashboard instead.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Access your organization's main dashboard through your workspace.
            </p>
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={() => {
                  window.location.href = SubdomainService.getWorkspaceUrl(subdomain)
                }}
                className="w-full"
              >
                Go to Workspace
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = `${window.location.protocol}//${window.location.host.split('.').slice(-2).join('.')}`}
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Main Site
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Only allow access to /maindashboard from main domain for authenticated users with companies
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access the main dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/login'}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentCompany && userCompanies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>No Organization Found</CardTitle>
            <CardDescription>
              You need to belong to an organization to access the main dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/create-company'}
            >
              Create Organization
            </Button>
            <Button 
              variant="outline"
              className="w-full" 
              onClick={() => window.location.href = '/join-company-by-link'}
            >
              Join Organization
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If user has multiple companies, show workspace selection
  if (userCompanies.length > 1) {
    return (
      <ProtectedRoute>
        <WorkspaceSelection userCompanies={userCompanies} />
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <MainDashboard companyId={currentCompany.id} company={currentCompany} />
    </ProtectedRoute>
  )
}

const WorkspaceSelection: React.FC<{ userCompanies: any[] }> = ({ userCompanies }) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Your Workspaces
                </h1>
                <p className="text-sm text-muted-foreground">
                  Choose a workspace to get started
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-2xl font-bold text-foreground text-left">Your Workspaces</h2>
            <Button onClick={() => window.location.href = '/create-company'} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Create Company
            </Button>
          </div>
          
          {/* Company Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userCompanies.map((company) => (
              <Card key={company.id} className="bg-card/50 border-border/40 hover:bg-card/70 transition-colors">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4">
                    {company.logo_url ? (
                      <img 
                        src={company.logo_url} 
                        alt={`${company.name} logo`}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-primary" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg text-foreground">{company.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {company.description || `${company.subdomain}.uproom.com`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {company.members?.length || 0} members
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      window.location.href = SubdomainService.getWorkspaceUrl(company.subdomain, '/login')
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Go to Workspace
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default MainDashboardRouter