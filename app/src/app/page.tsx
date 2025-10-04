'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Clock, 
  Shield, 
  Users, 
  AlertTriangle,
  Calendar,
  Pin,
  BarChart3,
  Settings,
  Zap,
  Eye,
  Building2,
  Plus,
  ArrowRight
} from "lucide-react";
import Navbar from "@/components/main/Navbar";
import WorkspaceRouter from "@/components/workspace/WorkspaceRouter";
import WorkspaceDashboard from "@/components/workspace/WorkspaceDashboard";
import Link from "next/link";

const LandingPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { userCompanies, isLoading } = useCompany();
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [filter, setFilter] = useState<'all' | 'owner' | 'member'>('all');

  // Debug logs
  console.log('🔍 LandingPage: Renderizando com:', {
    user: !!user,
    loading,
    userCompanies: userCompanies.length,
    isLoading,
    userCompaniesData: userCompanies
  });

  const handleGetStarted = () => {
    // Navigation will be handled by Next.js Link
  };

  const handleCreateCompany = () => {
    setIsCreatingCompany(true);
    router.push('/create-company');
  };

  const handleGoToWorkspace = (subdomain: string) => {
    const workspaceUrl = process.env.NODE_ENV === 'development' 
      ? `http://${subdomain}.localhost:3000`
      : `https://${subdomain}.${process.env.NEXT_PUBLIC_WORKSPACE_DOMAIN || 'uproom.com'}`;
    
    console.log('🚀 LandingPage.handleGoToWorkspace:', {
      subdomain,
      workspaceUrl,
      isDev: process.env.NODE_ENV === 'development'
    });
    window.location.href = workspaceUrl;
  };

  // Filtrar workspaces baseado no filtro selecionado
  const filteredCompanies = userCompanies.filter(company => {
    if (filter === 'all') return true;
    if (filter === 'owner') return company.isOwner || company.userRole === 'OWNER';
    if (filter === 'member') return !company.isOwner && company.userRole !== 'OWNER';
    return true;
  });

  useEffect(() => {
    if (!user && !loading) {
      // User not authenticated - show landing page
    }
  }, [user, loading, router]);

  // Loading states
  if (loading || isLoading) {
    return (
      <WorkspaceRouter>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      </WorkspaceRouter>
    );
  }

  // If user is authenticated, show dashboard instead of landing page
  if (user) {
    return (
      <WorkspaceRouter>
        <div className="min-h-screen bg-background">
          <Navbar />
          
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
                <Button 
                  onClick={handleCreateCompany} 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isCreatingCompany}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isCreatingCompany ? 'Preparing...' : 'Create Workspace'}
                </Button>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {isCreatingCompany ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-6">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Creating Your Workspace</h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    We're setting up your workspace and preparing everything for your team.
                  </p>
                  <Button 
                    disabled
                    className="bg-primary/50 text-primary-foreground cursor-not-allowed"
                  >
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Workspace...
                  </Button>
                </div>
              </div>
            ) : userCompanies.length === 0 ? (
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">No Workspaces Yet</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Create your first workspace to start collaborating with your team and organizing your projects.
                </p>
                <Button 
                  onClick={handleCreateCompany}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isCreatingCompany}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isCreatingCompany ? 'Preparing...' : 'Create Your First Workspace'}
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex justify-between items-center w-full">
                  <h2 className="text-2xl font-bold text-foreground text-left">Your Workspaces</h2>
                </div>

                {/* Filtros */}
                <div className="flex gap-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                    size="sm"
                  >
                    Todos ({userCompanies.length})
                  </Button>
                  <Button
                    variant={filter === 'owner' ? 'default' : 'outline'}
                    onClick={() => setFilter('owner')}
                    size="sm"
                  >
                    Dono ({userCompanies.filter(c => c.isOwner || c.userRole === 'OWNER').length})
                  </Button>
                  <Button
                    variant={filter === 'member' ? 'default' : 'outline'}
                    onClick={() => setFilter('member')}
                    size="sm"
                  >
                    Membro ({userCompanies.filter(c => !c.isOwner && c.userRole !== 'OWNER').length})
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCompanies.map((company) => (
                    <Card key={company.id} className="bg-card/50 border-border/40 hover:bg-card/70 transition-colors group">
                      <CardHeader className="text-center">
                        <div className="mx-auto mb-4">
                          {company.logo ? (
                            <img 
                              src={company.logo} 
                              alt={`${company.name} logo`}
                              className="h-16 w-16 rounded-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                              <Building2 className="h-8 w-8 text-primary" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <CardTitle className="text-lg text-foreground">{company.name}</CardTitle>
                          {company.isOwner || company.userRole === 'OWNER' ? (
                            <Badge className="bg-purple-600 text-white">
                              Owner
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Member
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-muted-foreground">
                          {company.description || `${company.subdomain}.${process.env.NEXT_PUBLIC_WORKSPACE_DOMAIN || 'uproom.com'}`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            0 members
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Button 
                            onClick={() => handleGoToWorkspace(company.subdomain)}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground group-hover:bg-primary/80"
                          >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Go to Workspace
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </WorkspaceRouter>
    );
  }

  return (
    <WorkspaceRouter>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        />
        <div className="absolute inset-0 bg-card" />
        
        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Stop Guessing.{" "}
              <span className="text-primary">Start Collaborating.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              The communication platform that tells you <em>when</em> to talk, not just <em>how</em>. 
              End the constant interruptions and digital guesswork. Reclaim your team&apos;s focus and flow.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6 rounded-lg shadow-glow transition-smooth hover:shadow-card-hover"
                  onClick={handleGetStarted}
                >
                  Create Your Workspace for Free
                </Button>
              </Link>
              <Button variant="ghost" size="lg" className="text-lg px-8 py-6 rounded-lg">
                Request a Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Your Team Is &quot;Online,&quot; But Are They <em>Available</em>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              You know the feeling. The green dot is lit, but your message hangs in the void for hours. 
              The modern workplace is a minefield of digital distractions and communication anxiety.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: AlertTriangle,
                title: "The Interruption Tax",
                description: "You need to ask a &quot;quick question,&quot; but you hesitate, afraid of derailing a colleague&apos;s deep work. Productivity is lost on both sides."
              },
              {
                icon: MessageCircle,
                title: "The Black Hole",
                description: "You send an urgent message and get... silence. Are they in a meeting? On a break? Ignoring you? The uncertainty kills momentum."
              },
              {
                icon: Clock,
                title: "The Constant Updates",
                description: "Manually typing \"brb, lunch\" or \"in a meeting until 3 PM\" across multiple channels is tedious, repetitive, and easy to forget."
              },
              {
                icon: Zap,
                title: "The Notification Noise",
                description: "A flood of non-urgent messages pulls your attention away from critical tasks. The cost of context-switching is draining your team&apos;s energy."
              }
            ].map((problem, index) => (
              <Card key={index} className="p-6 bg-transparent border-border rounded-lg hover:shadow-card-hover transition-smooth">
                <problem.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">{problem.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{problem.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Status System Features */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Communicate with Context, Not Just Text
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our Intelligent Status System goes beyond a simple green dot. It creates a shared understanding 
              of your team&apos;s availability, protecting focus and encouraging smarter communication.
            </p>
          </div>

          <div className="space-y-16">
            {[
              {
                icon: Eye,
                title: "The 7 Statuses of Work",
                problem: "The ambiguity of &quot;Online.&quot; Is your teammate free for a quick chat or in the middle of a complex task?",
                solution: "Go from &quot;Available&quot; to &quot;Focus,&quot; &quot;Meeting,&quot; or &quot;Emergency&quot; with a single click. Every status is color-coded, giving your team an instant, visual cue of your availability. Stop interrupting, start synchronizing."
              },
              {
                icon: Settings,
                title: "Custom Status Messages & Automation",
                problem: "The repetitive chore of explaining why you&apos;re busy and the mental load of remembering to update your status.",
                solution: "Let the system do the work. Automatically set to &quot;Away&quot; after inactivity or &quot;Offline&quot; when you close the app. Set a custom message like &quot;Finishing the Q3 report&quot; so your team knows exactly what you&apos;re focused on without having to ask."
              },
              {
                icon: Calendar,
                title: "Scheduled Status",
                problem: "Forgetting to set your status before a scheduled meeting or focus block, leading to interruptions at the worst possible time.",
                solution: "Plan your focus. Schedule your status in advance— \"In a meeting from 2-3 PM\" or \"Focus block until noon.\" Your status updates automatically, creating a predictable and respectful work environment."
              }
            ].map((feature, index) => (
              <div key={index} className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12`}>
                <div className="flex-1">
                  <Card className="p-8 bg-transparent border-border rounded-lg">
                    <feature.icon className="w-16 h-16 text-primary mb-6" />
                    <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                    <div className="space-y-4">
                      <div>
                        <Badge variant="destructive" className="mb-2">Pain it Kills</Badge>
                        <p className="text-muted-foreground">{feature.problem}</p>
                      </div>
                      <div>
                        <Badge variant="default" className="mb-2">Solution</Badge>
                        <p className="leading-relaxed">{feature.solution}</p>
                      </div>
                    </div>
                  </Card>
                </div>
                <div className="flex-1">
                  <div className="w-full h-64 bg-transparent rounded-lg border border-border flex items-center justify-center">
                    <feature.icon className="w-24 h-24 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Messaging Features */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Messaging That Respects Your Time
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Finally, a chat tool that understands not every message is a fire alarm. 
              Our platform integrates status directly into the messaging experience.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Status-Aware Messaging",
                problem: "Sending an important message that gets buried because the recipient is in &quot;Focus&quot; mode, or getting bombarded with notifications during a presentation.",
                solution: "Get a gentle warning before messaging someone in &quot;Focus&quot; mode. For critical updates, override their status. For everything else, let the message wait. We can even hold notifications for users in &quot;Do Not Disturb,&quot; delivering them once they become available."
              },
              {
                icon: Users,
                title: "Organized Group Conversations",
                problem: "Chaotic, company-wide channels where project-specific conversations get lost.",
                solution: "Create dedicated groups for projects, teams, or topics. Filter the user directory to see only group members and their real-time status, making it easy to find the right person at the right time."
              },
              {
                icon: Pin,
                title: "Pinned Messages & History",
                problem: "Crucial information—links, deadlines, feedback—getting buried in an endless scroll of chat history.",
                solution: "Keep important information front-and-center by pinning up to three messages to the top of any conversation. Easily search and paginate through your message history to find exactly what you need."
              }
            ].map((feature, index) => (
              <Card key={index} className="p-8 bg-transparent border-border rounded-lg hover:shadow-card-hover transition-smooth">
                <feature.icon className="w-16 h-16 text-primary mb-6" />
                <h3 className="text-2xl font-bold mb-6">{feature.title}</h3>
                <div className="space-y-4">
                  <div>
                    <Badge variant="destructive" className="mb-2">Pain it Kills</Badge>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.problem}</p>
                  </div>
                  <div>
                    <Badge variant="default" className="mb-2">Solution</Badge>
                    <p className="text-sm leading-relaxed">{feature.solution}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Management Features */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              A Bird&apos;s-Eye View of Your Team&apos;s Flow
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Empower your managers and admins with the tools they need to build a transparent, 
              productive, and secure workspace.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                icon: Settings,
                title: "Centralized Admin Dashboard",
                problem: "The administrative headache of managing users, permissions, and settings across fragmented tools.",
                solution: "Invite, remove, and manage user roles (Owner, Admin, Member, Team Lead) from one simple interface. Configure company-wide policies and maintain full control over your workspace."
              },
              {
                icon: BarChart3,
                title: "Status History & Time Tracking Reports",
                problem: "Manually tracking work hours or trying to understand team capacity without invasive surveillance software.",
                solution: "View status history to gain insights into team workflow and workload distribution. Export status logs as simple time-tracking reports for individuals or groups, perfect for client billing or internal resource planning."
              },
              {
                icon: Shield,
                title: "Secure and Scalable by Design",
                problem: "The constant worry about data security, unauthorized access, and system downtime.",
                solution: "From rate limiting and environment secrets to daily backups and SSL encryption, we handle the security so you can focus on your work. Your conversations and data are protected with enterprise-grade security standards."
              }
            ].map((feature, index) => (
              <Card key={index} className="p-8 bg-transparent border-border rounded-lg hover:shadow-card-hover transition-smooth">
                <feature.icon className="w-16 h-16 text-primary mb-6" />
                <h3 className="text-2xl font-bold mb-6">{feature.title}</h3>
                <div className="space-y-4">
                  <div>
                    <Badge variant="destructive" className="mb-2">Pain it Kills</Badge>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.problem}</p>
                  </div>
                  <div>
                    <Badge variant="default" className="mb-2">Solution</Badge>
                    <p className="text-sm leading-relaxed">{feature.solution}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Build a More Focused Team?
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Leave the communication chaos behind. Join the companies that are replacing distraction with direction. 
              Sign up in 60 seconds.
            </p>
            
            <Link href="/register">
              <Button size="lg" className="text-lg px-12 py-6 rounded-lg shadow-glow transition-smooth hover:shadow-card-hover">
                Start Your Free Trial Today
              </Button>
            </Link>
          </div>
        </div>
      </section>
      </div>
    </WorkspaceRouter>
  );
};

export default LandingPage;