import React, { useEffect } from 'react'
import { useSubdomain } from '@/hooks/useSubdomain'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/contexts/CompanyContext'
import ProtectedRoute from './ProtectedRoute'
import Dashboard from '@/pages/Dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home } from 'lucide-react'
import { SubdomainService } from '@/lib/subdomain'

const DashboardRouter: React.FC = () => {
  const { subdomain, company, isLoading, isValidWorkspace } = useSubdomain()
  const { user } = useAuth()
  const { currentCompany, userCompanies, isLoading: companyLoading } = useCompany()

  useEffect(() => {
    // If we're on a subdomain, restrict access to /dashboard
    if (!isLoading && subdomain) {
      // If user is authenticated and belongs to this company, redirect to main dashboard
      if (user && company && isValidWorkspace) {
        const isMemberOfThisCompany = userCompanies?.some(uc => uc.id === company.id)
        
        if (isMemberOfThisCompany) {
          // Stay on the same subdomain, just redirect to root
          window.location.href = `${window.location.protocol}//${window.location.host}/`
          return
        }
      }
      // For all subdomain users, redirect to main domain maindashboard
      const mainDomain = window.location.host.split('.').slice(-2).join('.')
      window.location.href = `${window.location.protocol}//${mainDomain}/maindashboard`
      return
    }

    // Removed automatic redirection to allow users to see their workspaces on main domain
    // Users can now choose which workspace to access from the main dashboard
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

  // If we're on a subdomain, show access restriction message
  if (subdomain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-xl">Access Restricted</CardTitle>
            <CardDescription>
              The dashboard is not available from this workspace subdomain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Please use your workspace dashboard or visit the main site.
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

  // Only allow access to /dashboard from main domain (no subdomain)
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  )
}

export default DashboardRouter