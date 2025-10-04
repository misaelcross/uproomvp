'use client';

import React, { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useCompany } from '@/contexts/CompanyContext';
import { Shield, User, Crown } from 'lucide-react';

export const UserRoleBadge: React.FC = () => {
  const { userRole, currentCompany, isLoading } = useCompany();

  // Debug log
  useEffect(() => {
    console.log('🔍 UserRoleBadge: userRole:', userRole);
    console.log('🔍 UserRoleBadge: currentCompany:', currentCompany?.name);
    console.log('🔍 UserRoleBadge: isLoading:', isLoading);
  }, [userRole, currentCompany, isLoading]);

  if (isLoading) {
    // Mostrar um placeholder enquanto carrega
    return (
      <Badge variant="secondary" className="flex items-center gap-1 bg-gray-600/50 text-white animate-pulse">
        <User className="w-3 h-3" />
        <span className="text-xs font-medium">...</span>
      </Badge>
    );
  }

  if (!userRole) {
    console.log('⚠️ UserRoleBadge: userRole is null or undefined (after loading)');
    return null;
  }

  const isOwner = userRole === 'OWNER';
  const isAdmin = userRole === 'ADMIN';
  const isMember = userRole === 'MEMBER';

  return (
    <Badge 
      variant={isOwner || isAdmin ? 'default' : 'secondary'}
      className={`flex items-center gap-1 ${
        isOwner
          ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-white hover:from-yellow-700 hover:to-yellow-600' 
          : isAdmin 
          ? 'bg-blue-600 text-white hover:bg-blue-700' 
          : 'bg-gray-600 text-white hover:bg-gray-700'
      }`}
    >
      {isOwner ? (
        <Crown className="w-3 h-3" />
      ) : isAdmin ? (
        <Shield className="w-3 h-3" />
      ) : (
        <User className="w-3 h-3" />
      )}
      <span className="text-xs font-medium">
        {isOwner ? 'Owner' : isAdmin ? 'Admin' : 'Member'}
      </span>
    </Badge>
  );
};
