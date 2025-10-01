export type UserRole = 'owner' | 'admin' | 'member'

export interface Company {
  id: string
  name: string
  subdomain: string
  description?: string
  logo_url?: string
  website_url?: string
  owner_id: string
  created_at: string
  updated_at: string
  members?: CompanyMember[]
}

export interface CompanyMember {
  id: string
  user_id: string
  company_id: string
  role: UserRole
  invited_by?: string
  invited_at: string
  joined_at?: string
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Joined data
  user?: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
  }
}

export interface CompanyInvitation {
  id: string
  company_id: string
  email: string
  role: UserRole
  invited_by: string
  token: string
  expires_at: string
  accepted_at?: string
  created_at: string
  
  // Joined data
  company?: Company
  inviter?: {
    id: string
    email: string
    full_name?: string
  }
}

export interface CreateCompanyData {
  name: string
  subdomain: string
  description?: string
}

export interface InviteUserData {
  email: string
  role: UserRole
  company_id: string
}

export interface UpdateCompanyData {
  name?: string
  description?: string
  logo_url?: string
  website_url?: string
}

export interface UpdateMemberRoleData {
  member_id: string
  role: UserRole
}