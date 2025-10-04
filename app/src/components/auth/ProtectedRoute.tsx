'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft, Settings } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission: keyof ReturnType<typeof usePermissions>;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  fallback,
  redirectTo = '/'
}) => {
  const router = useRouter();
  const permissions = usePermissions();
  const { currentCompany } = useCompany();

  const hasPermission = permissions[permission];

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold">Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-gray-600">
              <p>
                Apenas administradores da workspace <strong>{currentCompany?.name}</strong> podem acessar as configurações.
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={() => router.push(redirectTo)}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/')}
                className="w-full"
              >
                <Settings className="w-4 h-4 mr-2" />
                Ir para Configurações Gerais
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

// Componente específico para proteger a página de settings
export const SettingsProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute permission="canAccessSettings">
      {children}
    </ProtectedRoute>
  );
};
