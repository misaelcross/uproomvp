// Client-side company service that makes API calls instead of using Prisma directly
import { Company, UserRole, CompanyMember, User } from '@prisma/client'
import api from './api'

export interface CompanyData {
  name: string
  subdomain: string
  description?: string
  logoUrl?: string
  websiteUrl?: string
}

export interface CompanyMemberData {
  userId: string
  companyId: string
  role: UserRole
}

export interface InvitationData {
  email: string
  role: UserRole
  companyId: string
  senderId: string
}

export class CompanyService {
  private static readonly API_BASE = '/api/companies'

  /**
   * Get user's companies
   */
  static async getUserCompanies(userId: string): Promise<{ companies: Company[]; error?: string }> {
    try {
      const response = await api.get(`${this.API_BASE}/user/${userId}`)
      return response.data
    } catch (error) {
      console.error('Error getting user companies:', error)
      return { companies: [], error: 'Failed to load companies' }
    }
  }

  /**
   * Create new company
   */
  static async createCompany(data: CompanyData, ownerId: string): Promise<{ company?: Company; error?: string }> {
    try {
      const response = await api.post(`${this.API_BASE}`, data)
      return response.data
    } catch (error: any) {
      console.error('Error creating company:', error)
      
      // Extract detailed error message from response
      if (error.response?.data?.details) {
        return { error: `Validation failed: ${error.response.data.details}` }
      }
      
      if (error.response?.data?.error) {
        return { error: error.response.data.error }
      }
      
      if (error.response?.status === 400) {
        return { error: 'Invalid data provided. Please check your input.' }
      }
      
      return { error: 'Failed to create company' }
    }
  }

  /**
   * Update company
   */
  static async updateCompany(companyId: string, data: Partial<CompanyData>): Promise<{ company?: Company; error?: string }> {
    try {
      const response = await api.put(`${this.API_BASE}/${companyId}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating company:', error)
      return { error: 'Failed to update company' }
    }
  }

  /**
   * Get company by subdomain
   */
  static async getCompanyBySubdomain(subdomain: string): Promise<{ company?: Company; error?: string }> {
    try {
      const response = await api.get(`${this.API_BASE}/subdomain/${subdomain}`)
      return response.data
    } catch (error) {
      console.error('Error getting company by subdomain:', error)
      return { error: 'Failed to load company' }
    }
  }

  /**
   * Get company members
   */
  static async getCompanyMembers(companyId: string): Promise<{ members: CompanyMember[]; error?: string }> {
    try {
      const response = await api.get(`${this.API_BASE}/${companyId}/members`)
      return response.data
    } catch (error) {
      console.error('Error getting company members:', error)
      return { members: [], error: 'Failed to load company members' }
    }
  }

  /**
   * Get user role in company
   */
  static async getUserRole(companyId: string, userId: string): Promise<{ role?: UserRole; error?: string }> {
    try {
      const response = await api.get(`${this.API_BASE}/${companyId}/members/${userId}/role`)
      return response.data
    } catch (error) {
      console.error('Error getting user role:', error)
      return { error: 'Failed to get user role' }
    }
  }

  /**
   * Check subdomain availability
   */
  static async checkSubdomainAvailability(subdomain: string): Promise<{ available: boolean; error?: string }> {
    try {
      const response = await api.get(`${this.API_BASE}/check-subdomain/${subdomain}`)
      return response.data
    } catch (error) {
      console.error('Error checking subdomain availability:', error)
      return { available: false, error: 'Failed to check subdomain availability' }
    }
  }

  /**
   * Invite user to company
   */
  static async inviteUser(data: InvitationData): Promise<{ invitation?: any; error?: string }> {
    try {
      const response = await api.post(`${this.API_BASE}/${data.companyId}/invite`, data)
      return response.data
    } catch (error) {
      console.error('Error inviting user:', error)
      return { error: 'Failed to send invitation' }
    }
  }

  /**
   * Update member role
   */
  static async updateMemberRole(memberId: string, role: UserRole): Promise<{ member?: CompanyMember; error?: string }> {
    try {
      const response = await api.put(`${this.API_BASE}/members/${memberId}`, { role })
      return response.data
    } catch (error) {
      console.error('Error updating member role:', error)
      return { error: 'Failed to update member role' }
    }
  }

  /**
   * Remove member from company
   */
  static async removeMember(memberId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.delete(`${this.API_BASE}/members/${memberId}`)
      return response.data
    } catch (error) {
      console.error('Error removing member:', error)
      return { success: false, error: 'Failed to remove member' }
    }
  }

  /**
   * Accept invitation
   */
  static async acceptInvitation(token: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.post(`${this.API_BASE}/invitations/accept`, { token, userId })
      return response.data
    } catch (error) {
      console.error('Error accepting invitation:', error)
      return { success: false, error: 'Failed to accept invitation' }
    }
  }
}
