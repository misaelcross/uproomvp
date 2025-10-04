import { useCompany } from '@/contexts/CompanyContext';
import { UserRole } from '@/lib/types';

interface Permission {
  canAccessSettings: boolean;
  canInviteUsers: boolean;
  canManageMembers: boolean;
  canDeleteCompany: boolean;
  canCreateGroups: boolean;
  canManageGroups: boolean;
}

export const usePermissions = (): Permission => {
  const { userRole } = useCompany();

  const isAdmin = userRole === 'ADMIN' || userRole === 'OWNER';
  const isMember = userRole === 'MEMBER';

  return {
    // Apenas ADMINs podem acessar configurações
    canAccessSettings: isAdmin,
    
    // Apenas ADMINs podem convidar usuários
    canInviteUsers: isAdmin,
    
    // Apenas ADMINs podem gerenciar membros
    canManageMembers: isAdmin,
    
    // Apenas ADMINs podem deletar a empresa
    canDeleteCompany: isAdmin,
    
    // Todos podem criar grupos
    canCreateGroups: isAdmin || isMember,
    
    // Apenas ADMINs podem gerenciar grupos (deletar, modificar)
    canManageGroups: isAdmin,
  };
};

// Hook para verificar uma permissão específica
export const usePermission = (permission: keyof Permission): boolean => {
  const permissions = usePermissions();
  return permissions[permission];
};

// Hook para verificar se o usuário é admin
export const useIsAdmin = (): boolean => {
  const { userRole } = useCompany();
  return userRole === 'ADMIN' || userRole === 'OWNER';
};

// Hook para verificar se o usuário é membro
export const useIsMember = (): boolean => {
  const { userRole } = useCompany();
  return userRole === 'MEMBER';
};
