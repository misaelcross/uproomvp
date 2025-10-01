import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/contexts/CompanyContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, Settings, Plus, LogOut, BarChart3, MessageCircle, Link } from 'lucide-react'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { currentCompany, userCompanies, userRole, isLoading } = useCompany()

  console.log('🔍 Dashboard: Rendering with state:', {
    user: user?.id,
    currentCompany: currentCompany?.id,
    userCompaniesCount: userCompanies.length,
    userRole,
    isLoading
  })

  // Note: Removed automatic redirection to allow users to see their companies on main domain

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {currentCompany?.name || 'Uproom'}
                </h1>
                {currentCompany && (
                  <p className="text-sm text-muted-foreground">
                    {currentCompany.subdomain}.uproom.com
                  </p>
                )}
              </div>
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
        {!currentCompany && userCompanies.length === 0 ? (
          // No Company State
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Uproom</h2>
            <p className="text-muted-foreground mb-8">
              Get started by creating your company workspace or joining an existing one.
            </p>
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Button onClick={() => navigate('/create-company')} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Create Company
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/join-company-by-link')} className="border-border/60 text-foreground hover:bg-muted">
                <Link className="h-4 w-4 mr-2" />
                Join by Link
              </Button>
            </div>
          </div>
        ) : userCompanies.length > 0 && !currentCompany ? (
          // User has companies but none selected - show company selection
          <div className="space-y-8">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-2xl font-bold text-foreground text-left">Your Workspaces</h2>
              <Button onClick={() => navigate('/create-company')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
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
                        window.location.href = `${window.location.protocol}//${company.subdomain}.${window.location.host}/login`
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
        ) : (
          // Company Dashboard
          <div className="space-y-8">
            {/* Welcome Section */}
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Welcome back to {currentCompany.name}
              </h2>
              <p className="text-muted-foreground">
                Here's what's happening in your workspace today.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-card/50 border-border/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Team Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">0</div>
                  <p className="text-xs text-muted-foreground">
                    Active members in your workspace
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Messages</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">0</div>
                  <p className="text-xs text-muted-foreground">
                    Messages sent this week
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Your Role</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize text-foreground">{userRole}</div>
                  <p className="text-xs text-muted-foreground">
                    Your access level
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Team Members */}
            <Card className="bg-card/50 border-border/40">
              <CardHeader>
                <CardTitle className="text-foreground">Team Members</CardTitle>
                <CardDescription className="text-muted-foreground">
                  People in your {currentCompany.name} workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentCompany?.members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {member.user?.full_name?.charAt(0) || member.user?.email?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {member.user?.full_name || member.user?.email}
                          </p>
                          <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-muted text-muted-foreground">
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card/50 border-border/40">
              <CardHeader>
                <CardTitle className="text-foreground">Quick Actions</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Common tasks and settings for your workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button variant="outline" className="justify-start border-border/60 text-foreground hover:bg-muted">
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Team Member
                  </Button>
                  <Button variant="outline" className="justify-start border-border/60 text-foreground hover:bg-muted">
                    <Settings className="h-4 w-4 mr-2" />
                    Company Settings
                  </Button>
                  <Button variant="outline" className="justify-start border-border/60 text-foreground hover:bg-muted">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Members
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard