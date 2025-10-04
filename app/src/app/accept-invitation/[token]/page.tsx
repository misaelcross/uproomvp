'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, User, Shield, Mail, Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface InvitationData {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  company: {
    id: string;
    name: string;
    subdomain: string;
    description?: string;
  };
  invitedBy: {
    id: string;
    fullName: string;
    email: string;
  };
}

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, signIn } = useAuth();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = params.token as string;

  useEffect(() => {
    if (token) {
      validateInvitation();
    }
  }, [token]);

  const validateInvitation = async () => {
    try {
      setLoading(true);
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');
      
      const response = await fetch(`${apiUrl}/invitations/validate/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setInvitation(result.invitation);
        setError(null);
      } else {
        setError(result.message || 'Convite inválido');
      }
    } catch (err) {
      console.error('Erro ao validar convite:', err);
      setError('Erro ao carregar convite');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!user) {
      // Usuário não está logado, redirecionar para login com returnUrl
      const currentUrl = window.location.href;
      const loginUrl = `/login?returnUrl=${encodeURIComponent(currentUrl)}`;
      router.push(loginUrl);
      return;
    }

    try {
      setAccepting(true);
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');
      const authToken = localStorage.getItem('auth_token');
      
      if (!authToken) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(`${apiUrl}/invitations/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'x-workspace-subdomain': invitation?.company.subdomain || '',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Convite Aceito!',
          description: `Você foi adicionado à workspace ${invitation?.company.name}`,
        });

        // Redirecionar para a workspace
        const workspaceDomain = process.env.NEXT_PUBLIC_WORKSPACE_DOMAIN || 'uproom.com'
        const devDomain = process.env.NEXT_PUBLIC_DEV_DOMAIN || 'localhost:3000'
        
        const workspaceUrl = process.env.NODE_ENV === 'development' 
          ? `http://${invitation?.company.subdomain}.${devDomain}`
          : `https://${invitation?.company.subdomain}.${workspaceDomain}`;
        
        window.location.href = workspaceUrl;
      } else {
        throw new Error(result.error || 'Falha ao aceitar convite');
      }
    } catch (err) {
      console.error('Erro ao aceitar convite:', err);
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Falha ao aceitar convite',
        variant: 'destructive',
      });
    } finally {
      setAccepting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Building2 className="w-4 h-4" />;
      case 'ADMIN':
        return <Shield className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-600';
      case 'ADMIN':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'Owner';
      case 'ADMIN':
        return 'Admin';
      default:
        return 'Member';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-white">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-500">Convite Inválido</CardTitle>
            <CardDescription>
              {error || 'Este convite não é válido ou já expirou.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/')} 
              className="w-full"
              variant="outline"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Building2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">Convite para Workspace</CardTitle>
          <CardDescription>
            Você foi convidado para participar de uma workspace
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Informações da Workspace */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-semibold text-white">{invitation.company.name}</p>
                <p className="text-sm text-gray-400">{invitation.company.subdomain}</p>
              </div>
            </div>

            {invitation.company.description && (
              <p className="text-sm text-gray-300 ml-8">
                {invitation.company.description}
              </p>
            )}

            {/* Role */}
            <div className="flex items-center space-x-3 ml-8">
              {getRoleIcon(invitation.role)}
              <Badge className={`${getRoleColor(invitation.role)} text-white`}>
                {getRoleLabel(invitation.role)}
              </Badge>
            </div>

            {/* Convite por */}
            <div className="flex items-center space-x-3 ml-8">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-400">Convidado por</p>
                <p className="text-sm text-white">{invitation.invitedBy.fullName}</p>
              </div>
            </div>

            {/* Email do convite */}
            {invitation.email && (
              <div className="flex items-center space-x-3 ml-8">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Email do convite</p>
                  <p className="text-sm text-white">{invitation.email}</p>
                </div>
              </div>
            )}

            {/* Data de expiração */}
            <div className="flex items-center space-x-3 ml-8">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-400">Expira em</p>
                <p className="text-sm text-white">
                  {new Date(invitation.expiresAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="space-y-3">
            {!user ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-400 text-center">
                  Você precisa estar logado para aceitar o convite
                </p>
                <Button 
                  onClick={handleAcceptInvitation}
                  className="w-full"
                >
                  Fazer Login e Aceitar
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleAcceptInvitation}
                disabled={accepting}
                className="w-full"
              >
                {accepting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Aceitando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aceitar Convite
                  </>
                )}
              </Button>
            )}

            <Button 
              onClick={() => router.push('/')} 
              variant="outline"
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
