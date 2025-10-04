'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubdomain } from '@/hooks/useSubdomain';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function WorkspaceRegisterPage() {
  const router = useRouter();
  const { user, loading, signUp } = useAuth();
  const { subdomain, company, isLoading: subdomainLoading } = useSubdomain();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      console.log('🔍 WorkspaceRegister: Usuário já autenticado, redirecionando para dashboard');
      router.push('/');
    }
  }, [user, loading, router]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await signUp(email, password, fullName);
      
      if (result.error) {
        setError(result.error);
      } else {
        if (result.requiresConfirmation) {
          setSuccess(result.message || 'Account created successfully! Please check your email to confirm your account.');
        } else {
          console.log('✅ WorkspaceRegister: Registro realizado com sucesso');
          // Redirect will be handled by the useEffect above
        }
      }
    } catch (error) {
      console.error('❌ WorkspaceRegister: Erro no registro:', error);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading states
  if (loading || subdomainLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Loading workspace...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no subdomain, redirect to main domain
  if (!subdomain) {
    const mainDomain = process.env.NEXT_PUBLIC_DEV_DOMAIN || 'localhost:3000';
    const protocol = window.location.protocol;
    window.location.href = `${protocol}//${mainDomain}/register`;
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {company ? `Join ${company.name}` : `Join ${subdomain}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            Create an account to access this workspace
          </p>
        </div>

        {/* Register Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Sign up to join this workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-4">
          <div className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="text-primary hover:underline"
            >
              Sign in
            </Link>
          </div>
          
          <div className="flex items-center justify-center">
            <Link 
              href={`${window.location.protocol}//${process.env.NEXT_PUBLIC_DEV_DOMAIN || 'localhost:3000'}`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to main site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
