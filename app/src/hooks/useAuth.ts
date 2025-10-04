import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Verificar se o token é válido
        const response = await fetch(`${API_URL}/auth/session`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else if (response.status === 401) {
          // Token expirado ou inválido
          localStorage.removeItem('auth_token');
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    router.push('/login');
  };

  return {
    isAuthenticated,
    isLoading,
    logout
  };
};
