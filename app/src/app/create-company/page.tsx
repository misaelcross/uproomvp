'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useAuthHook } from '@/hooks/useAuth';
import { useCompany } from '@/contexts/CompanyContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  Check, 
  X, 
  Loader2, 
  AlertTriangle, 
  Plus,
  ArrowRight
} from 'lucide-react';
import Navbar from '@/components/main/Navbar';

// Constantes de validação exatamente como no web
const VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  SUBDOMAIN_MIN_LENGTH: 3,
  SUBDOMAIN_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 500,
} as const;

// Subdomínios reservados exatamente como no web
const RESERVED_SUBDOMAINS = [
  'api', 'admin', 'app', 'mail', 'ftp', 'blog', 'shop', 'store',
  'support', 'help', 'docs', 'dev', 'test', 'staging', 'prod', 'production',
  'dashboard', 'portal', 'login', 'register', 'auth', 'account', 'profile',
  'settings', 'config', 'status', 'health', 'ping', 'webhook', 'callback',
  'assets', 'static', 'cdn', 'media', 'images', 'files', 'uploads'
];

export default function CreateCompanyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAuthenticated, isLoading: authLoading } = useAuthHook();
  const { createCompany, checkSubdomainAvailability } = useCompany();
  
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    description: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState<{
    isValid: boolean;
    isAvailable: boolean;
    message: string;
  } | null>(null);
  const [alternatives, setAlternatives] = useState<string[]>([]);

  // Watch/debounce para subdomínio EXATAMENTE como no web
  useEffect(() => {
    const checkSubdomain = async () => {
      if (!formData.subdomain || formData.subdomain.length < 3) {
        setSubdomainStatus(null);
        setAlternatives([]);
        return;
      }

      setIsCheckingSubdomain(true);
      
      try {
        // Usar SubdomainService.validateSubdomain EXATAMENTE como no web
        const result = await validateSubdomainComplete(formData.subdomain);
        setSubdomainStatus(result);

        // If subdomain is taken, generate alternatives - EXATAMENTE como no web
        if (result.isValid && !result.isAvailable) {
          const alts = generateAlternatives(formData.subdomain, 3);
          setAlternatives(alts);
        } else {
          setAlternatives([]);
        }
      } catch (error) {
        console.error('Error validating subdomain:', error);
        setSubdomainStatus({
          isValid: false,
          isAvailable: false,
          message: 'Error checking subdomain availability'
        });
        setAlternatives([]);
      } finally {
        setIsCheckingSubdomain(false);
      }
    };

    const timeoutId = setTimeout(checkSubdomain, 500); // Debounce EXATAMENTE como no web
    return () => clearTimeout(timeoutId);
  }, [formData.subdomain]);

  // Validação completa EXATAMENTE como SubdomainService.validateSubdomain no web
  const validateSubdomainComplete = async (subdomain: string): Promise<{
    isValid: boolean;
    isAvailable: boolean;
    message: string;
  }> => {
    // First check format - EXATAMENTE como no web
    const formatValidation = validateSubdomainFormat(subdomain);
    if (!formatValidation.isValid) {
      return {
        isValid: false,
        isAvailable: false,
        message: formatValidation.message
      };
    }

    // Then check availability - EXATAMENTE como no web
    try {
      const result = await checkSubdomainAvailability(subdomain);
      return {
        isValid: true,
        isAvailable: result.available,
        message: result.available ? 'Subdomínio disponível' : 'Subdomínio já está em uso'
      };
    } catch (error) {
      console.error('Error checking subdomain availability:', error);
      return {
        isValid: true,
        isAvailable: false,
        message: 'Erro ao verificar disponibilidade'
      };
    }
  };

  // Validação de formato de subdomínio exatamente como no web
  const validateSubdomainFormat = (subdomain: string): { isValid: boolean; message: string } => {
    if (subdomain.length < 3) {
      return { isValid: false, message: 'Subdomínio deve ter pelo menos 3 caracteres' };
    }
    
    if (subdomain.length > 30) {
      return { isValid: false, message: 'Subdomínio deve ter no máximo 30 caracteres' };
    }

    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return { isValid: false, message: 'Subdomínio pode conter apenas letras minúsculas, números e hífens' };
    }

    if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
      return { isValid: false, message: 'Subdomínio não pode começar ou terminar com hífen' };
    }

    if (subdomain.includes('--')) {
      return { isValid: false, message: 'Subdomínio não pode conter hífens consecutivos' };
    }

    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      return { isValid: false, message: 'Este subdomínio é reservado e não pode ser usado' };
    }

    return { isValid: true, message: 'Formato de subdomínio válido' };
  };

  // Gerar alternativas exatamente como no web
  const generateAlternatives = (baseSubdomain: string, count: number = 5): string[] => {
    const alternatives: string[] = [];
    
    for (let i = 1; i <= count; i++) {
      const alternative = `${baseSubdomain}-${i}`;
      const validation = validateSubdomainFormat(alternative);
      
      if (validation.isValid) {
        alternatives.push(alternative);
      }
    }

    return alternatives;
  };

  // Validação em tempo real
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'name':
        if (value.length < VALIDATION.NAME_MIN_LENGTH) {
          newErrors.name = `Nome deve ter pelo menos ${VALIDATION.NAME_MIN_LENGTH} caracteres`;
        } else if (value.length > VALIDATION.NAME_MAX_LENGTH) {
          newErrors.name = `Nome deve ter no máximo ${VALIDATION.NAME_MAX_LENGTH} caracteres`;
        } else {
          delete newErrors.name;
        }
        break;
      case 'subdomain':
        if (value.length < VALIDATION.SUBDOMAIN_MIN_LENGTH) {
          newErrors.subdomain = `Subdomínio deve ter pelo menos ${VALIDATION.SUBDOMAIN_MIN_LENGTH} caracteres`;
        } else if (value.length > VALIDATION.SUBDOMAIN_MAX_LENGTH) {
          newErrors.subdomain = `Subdomínio deve ter no máximo ${VALIDATION.SUBDOMAIN_MAX_LENGTH} caracteres`;
        } else if (value && !/^[a-z0-9-]+$/.test(value)) {
          newErrors.subdomain = 'Subdomínio deve conter apenas letras minúsculas, números e hífens';
        } else {
          delete newErrors.subdomain;
        }
        break;
      case 'description':
        if (value.length > VALIDATION.DESCRIPTION_MAX_LENGTH) {
          newErrors.description = `Descrição deve ter no máximo ${VALIDATION.DESCRIPTION_MAX_LENGTH} caracteres`;
        } else {
          delete newErrors.description;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Se mudou o nome, gerar subdomínio automaticamente
    if (name === 'name' && value) {
      const generatedSubdomain = generateSubdomainFromName(value);
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        subdomain: generatedSubdomain
      }));
      
      // Validar ambos os campos
      validateField('name', value);
      validateField('subdomain', generatedSubdomain);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      validateField(name, value);
    }
  };

  // Gerar subdomínio a partir do nome - exatamente como no web
  const generateSubdomainFromName = (companyName: string): string => {
    return companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 30); // Limit length
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.length < VALIDATION.NAME_MIN_LENGTH) {
      newErrors.name = `Nome deve ter pelo menos ${VALIDATION.NAME_MIN_LENGTH} caracteres`;
    } else if (formData.name.length > VALIDATION.NAME_MAX_LENGTH) {
      newErrors.name = `Nome deve ter no máximo ${VALIDATION.NAME_MAX_LENGTH} caracteres`;
    }
    
    if (!formData.subdomain.trim()) {
      newErrors.subdomain = 'Subdomínio é obrigatório';
    } else if (formData.subdomain.length < VALIDATION.SUBDOMAIN_MIN_LENGTH) {
      newErrors.subdomain = `Subdomínio deve ter pelo menos ${VALIDATION.SUBDOMAIN_MIN_LENGTH} caracteres`;
    } else if (formData.subdomain.length > VALIDATION.SUBDOMAIN_MAX_LENGTH) {
      newErrors.subdomain = `Subdomínio deve ter no máximo ${VALIDATION.SUBDOMAIN_MAX_LENGTH} caracteres`;
    } else if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
      newErrors.subdomain = 'Subdomínio deve conter apenas letras minúsculas, números e hífens';
    }
    
    if (formData.description && formData.description.length > VALIDATION.DESCRIPTION_MAX_LENGTH) {
      newErrors.description = `Descrição deve ter no máximo ${VALIDATION.DESCRIPTION_MAX_LENGTH} caracteres`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }
    
    if (subdomainStatus && !subdomainStatus.isAvailable) {
      setError('Subdomínio não está disponível');
      return;
    }
    
    setIsLoading(true);

    try {
      const result = await createCompany({
        name: formData.name.trim(),
        subdomain: formData.subdomain.trim().toLowerCase(),
        description: formData.description.trim() || undefined
      });

      if (result.success) {
        setSuccess('Workspace criado com sucesso!');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setError(result.error || 'Erro ao criar workspace');
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-background mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Loading state exatamente como no web
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-card/50 border-2 border-border/40">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">Criar seu Workspace</CardTitle>
              <CardDescription className="text-muted-foreground">
                Configure seu novo workspace para começar a colaborar com sua equipe
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert>
                    <Check className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">
                    Nome do Workspace *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Ex: Minha Empresa"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className={`${errors.name ? 'border-2 border-red-500 focus:border-red-500' : ''}`}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.name.length}/{VALIDATION.NAME_MAX_LENGTH} caracteres
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="subdomain" className="text-sm font-medium text-foreground">
                    Subdomínio *
                  </label>
                  <div className="relative">
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border-2 border-r-0 border-gray-300 bg-background text-gray-500 text-sm">
                        https://
                      </span>
                    <Input
                      id="subdomain"
                      name="subdomain"
                      type="text"
                        placeholder="your-company"
                      value={formData.subdomain}
                      onChange={handleInputChange}
                      required
                        className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none border-2 focus:ring-blue-500 focus:border-neutral-500 text-sm bg-background ${
                          subdomainStatus?.isValid && subdomainStatus?.isAvailable ? 'border-green-500' : 
                          subdomainStatus?.isValid && !subdomainStatus?.isAvailable ? 'border-red-500' : 
                          'border-gray-300'
                        }`}
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border-2 border-l-0 border-gray-300 bg-background text-gray-500 text-sm">
                      .${process.env.NEXT_PUBLIC_WORKSPACE_DOMAIN || 'uproom.com'}
                    </span>
                      <div className="absolute right-6 top-1/2 transform -translate-y-1/2 mr-24">
                        {isCheckingSubdomain ? (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        ) : subdomainStatus?.isValid && subdomainStatus?.isAvailable ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : subdomainStatus?.isValid && !subdomainStatus?.isAvailable ? (
                          <X className="h-4 w-4 text-red-500" />
                        ) : null}
                      </div>
                    </div>
                  </div>
                  
                  {errors.subdomain && (
                    <p className="text-sm text-red-600">{errors.subdomain}</p>
                  )}
                  
                  {subdomainStatus && (
                    <p className={`text-sm ${
                      subdomainStatus.isValid && subdomainStatus.isAvailable ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {subdomainStatus.message}
                    </p>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    {formData.subdomain.length}/{VALIDATION.SUBDOMAIN_MAX_LENGTH} caracteres
                  </p>
                  
                  {/* Alternativas exatamente como no web */}
                  {alternatives.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Sugestões alternativas:</p>
                      <div className="flex flex-wrap gap-2">
                        {alternatives.map((alt) => (
                          <button
                            key={alt}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, subdomain: alt }))}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                          >
                            {alt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium text-foreground">
                    Descrição (opcional)
                  </label>
                  <Input
                    id="description"
                    name="description"
                    type="text"
                    placeholder="Breve descrição do seu workspace"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`${errors.description ? 'border-2 border-red-500 focus:border-red-500' : ''}`}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/{VALIDATION.DESCRIPTION_MAX_LENGTH} caracteres
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.push('/')}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isLoading || (subdomainStatus && !subdomainStatus.isAvailable) || Object.keys(errors).length > 0}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Building2 className="h-4 w-4 mr-2" />
                        Criar Workspace
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}