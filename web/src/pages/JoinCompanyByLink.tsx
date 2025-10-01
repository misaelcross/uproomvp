import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { ArrowLeft, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCompany } from '../contexts/CompanyContext'
import JoinCompanyByLink from '../components/JoinCompanyByLink'

const JoinCompanyByLinkPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { currentCompany, userRole } = useCompany()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
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
                className="text-foreground hover:bg-muted"
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
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <JoinCompanyByLink />
          </div>
        </div>
      </main>
    </div>
  )
}

export default JoinCompanyByLinkPage