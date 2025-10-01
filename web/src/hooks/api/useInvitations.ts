import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

// Tipos
export interface Invitation {
  id: string;
  email: string;
  companyId: string;
  role: 'MEMBER' | 'ADMIN';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  token: string;
  invitedById: string;
  createdAt: string;
  invitedBy: {
    id: string;
    name?: string;
    email: string;
  };
}

export interface CreateInvitationData {
  email: string;
  companyId: string;
  role?: 'MEMBER' | 'ADMIN';
}

export interface AcceptInvitationData {
  token: string;
}

// Hooks para convites
export const useCompanyInvitations = (companyId: string) => {
  return useQuery<Invitation[]>({
    queryKey: ['invitations', 'company', companyId],
    queryFn: async () => {
      const response = await api.get(`/api/invitations/company/${companyId}`);
      return response.data.invitations;
    },
    enabled: !!companyId,
  });
};

export const useCreateInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInvitationData) => {
      const response = await api.post('/api/invitations', data);
      return response.data.invitation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['invitations', 'company', variables.companyId] 
      });
    },
  });
};

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AcceptInvitationData) => {
      const response = await api.post('/api/invitations/accept', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
};

export const useDeleteInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/invitations/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
};
