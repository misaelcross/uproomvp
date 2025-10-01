// Client-side invitation service that makes API calls instead of using Prisma directly
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
  private static readonly API_BASE = '/api/invitations'

  /**
   * Validate invitation token without accepting it
   */
  static async validateInvitation(token: string): Promise<InvitationResult> {
    try {
      const response = await fetch(`${this.API_BASE}/validate/${token}`)
      const data = await response.json()
      return data
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
      const response = await fetch(`${this.API_BASE}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, userId })
      })

      const data = await response.json()
      return data
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
      const response = await fetch(`${this.API_BASE}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()
      return result
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
      const response = await fetch(`${this.API_BASE}/user/${userId}`)
      const data = await response.json()
      return data
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
      const response = await fetch(`${this.API_BASE}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      })

      const data = await response.json()
      return data
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
      const response = await fetch(`${this.API_BASE}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationId, senderId })
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      return {
        success: false,
        message: 'Failed to cancel invitation'
      }
    }
  }
}
