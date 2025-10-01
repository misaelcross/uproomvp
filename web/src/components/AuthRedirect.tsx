import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/contexts/CompanyContext'

interface AuthRedirectProps {
  children: React.ReactNode
  redirectTo?: string
}

const AuthRedirect: React.FC<AuthRedirectProps> = ({ 
  children, 
  redirectTo = '/maindashboard' 
}) => {
  const { user, loading } = useAuth()
  const { userCompanies, isLoading: companyLoading } = useCompany()
  const navigate = useNavigate()

  useEffect(() => {
    // Only redirect if user is authenticated and not loading
    if (!loading && !companyLoading && user) {
      navigate(redirectTo, { replace: true })
    }
  }, [user, loading, companyLoading, navigate, redirectTo])

  // Show loading while checking auth status
  if (loading || companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is authenticated, don't render children (will redirect)
  if (user) {
    return null
  }

  // If user is not authenticated, render children
  return <>{children}</>
}

export default AuthRedirect
