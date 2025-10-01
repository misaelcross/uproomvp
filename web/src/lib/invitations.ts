import { prisma } from './prisma'
import { MailgunService } from './mailgun'
import { SubdomainService } from './subdomain'
import { UserRole } from '@prisma/client'

export interface InvitationResult {
  success: boolean
  message: string
  invitation?: any
}

export interface InviteUserData {
  email: string
  role: UserRole
  companyId: string
  senderId: string
}

export class InvitationService {
  /**
   * Validate invitation token without accepting it
   */
  static async validateInvitation(token: string): Promise<InvitationResult> {
    try {
      const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: {
          company: true,
          sender: {
            select: {
              id: true,
              email: true,
              fullName: true
            }
          }
        }
      })

      if (!invitation) {
        return {
          success: false,
          message: 'Invalid invitation token'
        }
      }

      // Check if invitation has expired
      if (invitation.expiresAt <= new Date()) {
        return {
          success: false,
          message: 'Invitation has expired'
        }
      }

      // Check if already accepted
      if (invitation.status === 'ACCEPTED') {
        return {
          success: false,
          message: 'Invitation has already been accepted'
        }
      }

      return {
        success: true,
        message: 'Valid invitation',
        invitation
      }
    } catch (error) {
      console.error('Error validating invitation:', error)
      return {
        success: false,
        message: 'Failed to validate invitation'
      }
    }
  }

  /**
   * Accept invitation
   */
  static async acceptInvitation(token: string, userId: string): Promise<InvitationResult> {
    try {
      const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: {
          company: true
        }
      })

      if (!invitation) {
        return {
          success: false,
          message: 'Invalid invitation token'
        }
      }

      if (invitation.status !== 'PENDING') {
        return {
          success: false,
          message: 'Invitation has already been processed'
        }
      }

      if (invitation.expiresAt <= new Date()) {
        return {
          success: false,
          message: 'Invitation has expired'
        }
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

      return {
        success: true,
        message: 'Invitation accepted successfully'
      }
    } catch (error) {
      console.error('Error accepting invitation:', error)
      return {
        success: false,
        message: 'Failed to accept invitation'
      }
    }
  }

  /**
   * Send invitation email
   */
  static async sendInvitation(data: InviteUserData): Promise<InvitationResult> {
    try {
      // Generate invitation token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      })

      // Create invitation
      const invitation = await prisma.invitation.create({
        data: {
          email: data.email,
          role: data.role,
          token,
          companyId: data.companyId,
          senderId: data.senderId,
          receiverId: existingUser?.id,
          expiresAt
        },
        include: {
          company: true,
          sender: {
            select: {
              id: true,
              email: true,
              fullName: true
            }
          }
        }
      })

      // Get company workspace URL
      const workspaceUrl = SubdomainService.getWorkspaceUrl(invitation.company.subdomain)
      const invitationUrl = `${workspaceUrl}/accept-invitation?token=${token}`

      // Send email
      const emailSent = await MailgunService.sendInvitationEmail({
        recipientEmail: data.email,
        recipientName: existingUser?.fullName,
        companyName: invitation.company.name,
        inviterName: invitation.sender.fullName || invitation.sender.email,
        inviterEmail: invitation.sender.email,
        invitationToken: token,
        invitationUrl,
        role: data.role
      })

      if (!emailSent) {
        return {
          success: false,
          message: 'Failed to send invitation email'
        }
      }

      return {
        success: true,
        message: 'Invitation sent successfully',
        invitation
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      return {
        success: false,
        message: 'Failed to send invitation'
      }
    }
  }

  /**
   * Get user's pending invitations
   */
  static async getUserInvitations(userId: string): Promise<InvitationResult> {
    try {
      const invitations = await prisma.invitation.findMany({
        where: {
          receiverId: userId,
          status: 'PENDING'
        },
        include: {
          company: true,
          sender: {
            select: {
              id: true,
              email: true,
              fullName: true
            }
          }
        }
      })

      return {
        success: true,
        message: 'Invitations retrieved successfully',
        invitation: invitations
      }
    } catch (error) {
      console.error('Error getting user invitations:', error)
      return {
        success: false,
        message: 'Failed to get invitations'
      }
    }
  }

  /**
   * Decline invitation
   */
  static async declineInvitation(token: string): Promise<InvitationResult> {
    try {
      const invitation = await prisma.invitation.findUnique({
        where: { token }
      })

      if (!invitation) {
        return {
          success: false,
          message: 'Invalid invitation token'
        }
      }

      if (invitation.status !== 'PENDING') {
        return {
          success: false,
          message: 'Invitation has already been processed'
        }
      }

      await prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'DECLINED'
        }
      })

      return {
        success: true,
        message: 'Invitation declined successfully'
      }
    } catch (error) {
      console.error('Error declining invitation:', error)
      return {
        success: false,
        message: 'Failed to decline invitation'
      }
    }
  }

  /**
   * Cancel invitation
   */
  static async cancelInvitation(invitationId: string, senderId: string): Promise<InvitationResult> {
    try {
      const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId }
      })

      if (!invitation) {
        return {
          success: false,
          message: 'Invitation not found'
        }
      }

      if (invitation.senderId !== senderId) {
        return {
          success: false,
          message: 'You are not authorized to cancel this invitation'
        }
      }

      if (invitation.status !== 'PENDING') {
        return {
          success: false,
          message: 'Invitation has already been processed'
        }
      }

      await prisma.invitation.update({
        where: { id: invitationId },
        data: {
          status: 'DECLINED'
        }
      })

      return {
        success: true,
        message: 'Invitation cancelled successfully'
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      return {
        success: false,
        message: 'Failed to cancel invitation'
      }
    }
  }
}