'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { SettingsProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader';
import {
  ArrowLeft,
  Building2,
  Users,
  Settings as SettingsIcon,
  Globe,
  Mail,
  Shield,
  Trash2,
  Save,
  Upload,
  X
} from 'lucide-react';

export default function WorkspaceSettings() {
  return (
    <SettingsProtectedRoute>
      <WorkspaceSettingsContent />
    </SettingsProtectedRoute>
  );
}

function WorkspaceSettingsContent() {
  const router = useRouter();
  const { currentCompany, userRole } = useCompany();
  const { toast } = useToast();

  // Form states
  const [workspaceName, setWorkspaceName] = useState(currentCompany?.name || '');
  const [workspaceDescription, setWorkspaceDescription] = useState(currentCompany?.description || '');
  const [workspaceUrl, setWorkspaceUrl] = useState(currentCompany?.subdomain || '');
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(currentCompany?.logo || null);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Aqui você implementaria a lógica para salvar as configurações
      // Por enquanto, apenas simular o salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Configurações salvas',
        description: 'As configurações da workspace foram atualizadas com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!confirm('Tem certeza que deseja excluir esta workspace? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      // Implementar lógica de exclusão da workspace
      toast({
        title: 'Workspace excluída',
        description: 'A workspace foi excluída com sucesso.',
      });
      router.push('/');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir a workspace.',
        variant: 'destructive',
      });
    }
  };

  const getCompanyInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Workspace Header */}
      <WorkspaceHeader company={currentCompany} />
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Configurações da Workspace</h1>
              <p className="text-gray-400">Gerencie as configurações e preferências da sua workspace</p>
            </div>
          </div>
          <Badge variant="outline" className="text-gray-300 border-2 border-gray-600">
            {userRole === 'ADMIN' ? 'Administrador' : 'Membro'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-background border-2 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg">Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-background"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Informações Gerais
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-background"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Membros
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-background"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Permissões
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-background"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Domínio
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Gerais */}
            <Card className="bg-background border-2 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Informações Gerais
                </CardTitle>
                <CardDescription>
                  Configure as informações básicas da sua workspace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo da Workspace */}
                <div className="space-y-4">
                  <Label>Logo da Workspace</Label>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-background rounded-lg flex items-center justify-center overflow-hidden">
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt="Logo da workspace"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-lg">
                          {getCompanyInitials(workspaceName)}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                        className="border-2 border-gray-600 text-gray-300 hover:text-white"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Alterar Logo
                      </Button>
                      {logoPreview && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLogoPreview(null);
                            setLogoFile(null);
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nome da Workspace */}
                <div className="space-y-2">
                  <Label htmlFor="workspace-name">Nome da Workspace</Label>
                  <Input
                    id="workspace-name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Digite o nome da workspace"
                    className="bg-background border-2 border-zinc-700 text-white"
                  />
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="workspace-description">Descrição</Label>
                  <Textarea
                    id="workspace-description"
                    value={workspaceDescription}
                    onChange={(e) => setWorkspaceDescription(e.target.value)}
                    placeholder="Descreva sua workspace..."
                    className="bg-background border-2 border-zinc-700 text-white"
                    rows={3}
                  />
                </div>

                {/* URL da Workspace */}
                <div className="space-y-2">
                  <Label htmlFor="workspace-url">URL da Workspace</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">https://</span>
                    <Input
                      id="workspace-url"
                      value={workspaceUrl}
                      onChange={(e) => setWorkspaceUrl(e.target.value)}
                      placeholder="nome-da-workspace"
                      className="bg-background border-2 border-zinc-700 text-white"
                    />
                    <span className="text-gray-400">.localhost:3000</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Esta URL será usada para acessar sua workspace
                  </p>
                </div>

                {/* Botões de Ação */}
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="border-2 border-gray-600 text-gray-300"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Seção Perigosa - Apenas para Admins */}
            {userRole === 'ADMIN' && (
              <Card className="bg-background border-red-800">
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center">
                    <Trash2 className="w-5 h-5 mr-2" />
                    Zona Perigosa
                  </CardTitle>
                  <CardDescription>
                    Ações irreversíveis que afetam toda a workspace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                      <h4 className="font-semibold text-red-400 mb-2">Excluir Workspace</h4>
                      <p className="text-sm text-gray-300 mb-4">
                        Esta ação irá excluir permanentemente a workspace e todos os dados associados. 
                        Esta ação não pode ser desfeita.
                      </p>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteWorkspace}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Workspace
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
