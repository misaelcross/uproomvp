import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './database'
import { config } from './config'
import { User } from '@prisma/client'

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
  private static readonly JWT_SECRET = config.JWT_SECRET
  private static readonly JWT_EXPIRES_IN = config.JWT_EXPIRES_IN

  /**
   * Hash password
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  /**
   * Verify password
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  /**
   * Generate JWT token
   */
  static generateToken(user: AuthUser): string {
    const payload = { 
      userId: user.id, 
      email: user.email 
    };
    return jwt.sign(payload, this.JWT_SECRET, { 
      expiresIn: '7d' 
    });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): { userId: string; email: string } | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as { userId: string; email: string }
    } catch {
      return null
    }
  }

  /**
   * Sign up new user
   */
  static async signUp(email: string, password: string, fullName?: string): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists'
        }
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password)

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName
        }
      })

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        fullName: user.fullName || undefined,
        avatar: user.avatar || undefined
      }

      const token = this.generateToken(authUser)

      return {
        success: true,
        user: authUser,
        token
      }
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
      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password'
        }
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.password)
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password'
        }
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        fullName: user.fullName || undefined,
        avatar: user.avatar || undefined
      }

      const token = this.generateToken(authUser)

      return {
        success: true,
        user: authUser,
        token
      }
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
      const decoded = this.verifyToken(token)
      if (!decoded) return null

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      })

      if (!user) return null

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName || undefined,
        avatar: user.avatar || undefined
      }
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
      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email },
        this.JWT_SECRET,
        { expiresIn: '1h' }
      )

      // TODO: Send reset email with token
      console.log('Reset token for', email, ':', resetToken)

      return { success: true }
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
      const hashedPassword = await this.hashPassword(newPassword)
      
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      })

      return { success: true }
    } catch (error) {
      console.error('Update password error:', error)
      return {
        success: false,
        error: 'Failed to update password'
      }
    }
  }
}
