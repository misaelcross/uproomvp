import React, { useEffect } from 'react'
import { useSubdomain } from '@/hooks/useSubdomain'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/contexts/CompanyContext'
import ProtectedRoute from './ProtectedRoute'
import MainDashboard from './MainDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home } from 'lucide-react'

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
        window.location.href = `${window.location.protocol}//${subdomain}.${window.location.host}`
        return
      }
    }

    // Removed the automatic redirect for main domain users with currentCompany
    // This allows authenticated organization members to access /maindashboard
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
                onClick={() => window.location.href = `${window.location.protocol}//${subdomain}.${window.location.host}`}
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

  if (!currentCompany) {
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

  return (
    <ProtectedRoute>
      <MainDashboard companyId={currentCompany.id} company={currentCompany} />
    </ProtectedRoute>
  )
}

export default MainDashboardRouter