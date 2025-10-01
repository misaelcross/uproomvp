// Client-side auth service that makes API calls instead of using Prisma directly
export interface AuthUser {
  id: string
  email: string
  fullName?: string
  avatar?: string
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  token?: string
  error?: string
}

export class AuthService {
  private static readonly API_BASE = '/api/auth'

  /**
   * Sign up new user
   */
  static async signUp(email: string, password: string, fullName?: string): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.API_BASE}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, fullName })
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Sign up error:', error)
      return {
        success: false,
        error: 'Failed to create user account'
      }
    }
  }

  /**
   * Sign in user
   */
  static async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.API_BASE}/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Sign in error:', error)
      return {
        success: false,
        error: 'Failed to sign in'
      }
    }
  }

  /**
   * Get user by token
   */
  static async getUserByToken(token: string): Promise<AuthUser | null> {
    try {
      const response = await fetch(`${this.API_BASE}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) return null

      const data = await response.json()
      return data.user
    } catch (error) {
      console.error('Get user by token error:', error)
      return null
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Reset password error:', error)
      return {
        success: false,
        error: 'Failed to reset password'
      }
    }
  }

  /**
   * Update password
   */
  static async updatePassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, newPassword })
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Update password error:', error)
      return {
        success: false,
        error: 'Failed to update password'
      }
    }
  }
}
