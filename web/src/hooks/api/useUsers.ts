import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

// Tipos
export interface User {
  id: string;
  name?: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  companyMemberships?: CompanyMembership[];
}

export interface CompanyMembership {
  id: string;
  companyId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  createdAt: string;
  company: {
    id: string;
    name: string;
    subdomain: string;
  };
}

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  createdAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
  };
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
}

export interface SearchUsersParams {
  email: string;
  companyId?: string;
}

// Hooks para usuários
export const useProfile = () => {
  return useQuery<User>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/api/users/profile');
      return response.data.user;
    },
  });
};

export const useCompanyMembers = (companyId: string) => {
  return useQuery<CompanyMember[]>({
    queryKey: ['company-members', companyId],
    queryFn: async () => {
      const response = await api.get(`/api/users/company/${companyId}`);
      return response.data.members;
    },
    enabled: !!companyId,
  });
};

export const useSearchUsers = (params: SearchUsersParams) => {
  return useQuery<User[]>({
    queryKey: ['search-users', params],
    queryFn: async () => {
      const response = await api.get('/api/users/search', { params });
      return response.data.users;
    },
    enabled: !!params.email,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await api.put('/api/users/profile', data);
      return response.data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
