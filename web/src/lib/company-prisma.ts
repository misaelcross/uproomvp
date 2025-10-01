import { prisma } from './prisma'
import { Company, UserRole, CompanyMember, User } from '@prisma/client'

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
  /**
   * Get user's companies
   */
  static async getUserCompanies(userId: string): Promise<{ companies: Company[]; error?: string }> {
    try {
      const memberships = await prisma.companyMember.findMany({
        where: {
          userId,
          isActive: true
        },
        include: {
          company: true
        }
      })

      const companies = memberships.map(membership => membership.company)
      return { companies }
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
      // Check if subdomain is available
      const existingCompany = await prisma.company.findUnique({
        where: { subdomain: data.subdomain }
      })

      if (existingCompany) {
        return { error: 'Subdomain is already taken' }
      }

      // Create company and add owner as member
      const company = await prisma.company.create({
        data: {
          name: data.name,
          subdomain: data.subdomain,
          description: data.description,
          logoUrl: data.logoUrl,
          websiteUrl: data.websiteUrl,
          members: {
            create: {
              userId: ownerId,
              role: 'OWNER'
            }
          }
        }
      })

      return { company }
    } catch (error) {
      console.error('Error creating company:', error)
      return { error: 'Failed to create company' }
    }
  }

  /**
   * Update company
   */
  static async updateCompany(companyId: string, data: Partial<CompanyData>): Promise<{ company?: Company; error?: string }> {
    try {
      const company = await prisma.company.update({
        where: { id: companyId },
        data: {
          name: data.name,
          description: data.description,
          logoUrl: data.logoUrl,
          websiteUrl: data.websiteUrl
        }
      })

      return { company }
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
      const company = await prisma.company.findUnique({
        where: { subdomain }
      })

      if (!company) {
        return { error: 'Company not found' }
      }

      return { company }
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
      const members = await prisma.companyMember.findMany({
        where: {
          companyId,
          isActive: true
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatar: true
            }
          }
        }
      })

      return { members }
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
      const membership = await prisma.companyMember.findUnique({
        where: {
          userId_companyId: {
            userId,
            companyId
          }
        }
      })

      if (!membership) {
        return { error: 'User is not a member of this company' }
      }

      return { role: membership.role }
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
      const existingCompany = await prisma.company.findUnique({
        where: { subdomain }
      })

      return { available: !existingCompany }
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
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      })

      // Generate invitation token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

      const invitation = await prisma.invitation.create({
        data: {
          email: data.email,
          role: data.role,
          token,
          companyId: data.companyId,
          senderId: data.senderId,
          receiverId: existingUser?.id,
          expiresAt
        }
      })

      return { invitation }
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
      const member = await prisma.companyMember.update({
        where: { id: memberId },
        data: { role }
      })

      return { member }
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
      await prisma.companyMember.update({
        where: { id: memberId },
        data: { isActive: false }
      })

      return { success: true }
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
      const invitation = await prisma.invitation.findUnique({
        where: { token }
      })

      if (!invitation) {
        return { success: false, error: 'Invalid invitation token' }
      }

      if (invitation.status !== 'PENDING') {
        return { success: false, error: 'Invitation has already been processed' }
      }

      if (new Date() > invitation.expiresAt) {
        return { success: false, error: 'Invitation has expired' }
      }

      // Add user to company
      await prisma.companyMember.create({
        data: {
          userId,
          companyId: invitation.companyId,
          role: invitation.role
        }
      })

      // Update invitation status
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          receiverId: userId
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error accepting invitation:', error)
      return { success: false, error: 'Failed to accept invitation' }
    }
  }
}
