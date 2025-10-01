import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

// Tipos
export interface Company {
  id: string;
  name: string;
  subdomain: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members?: CompanyMember[];
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

export interface CreateCompanyData {
  name: string;
  subdomain: string;
  description?: string;
}

export interface UpdateCompanyData {
  name?: string;
  description?: string;
}

// Hooks para empresas
export const useCompanies = () => {
  return useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await api.get('/api/companies');
      return response.data.companies;
    },
  });
};

export const useCompany = (id: string) => {
  return useQuery<Company>({
    queryKey: ['companies', id],
    queryFn: async () => {
      const response = await api.get(`/api/companies/${id}`);
      return response.data.company;
    },
    enabled: !!id,
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCompanyData) => {
      const response = await api.post('/api/companies', data);
      return response.data.company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCompanyData }) => {
      const response = await api.put(`/api/companies/${id}`, data);
      return response.data.company;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies', id] });
    },
  });
};

export const useCheckSubdomain = (subdomain: string) => {
  return useQuery<{ available: boolean }>({
    queryKey: ['subdomain-check', subdomain],
    queryFn: async () => {
      const response = await api.get(`/api/companies/check-subdomain/${subdomain}`);
      return response.data;
    },
    enabled: !!subdomain,
  });
};
