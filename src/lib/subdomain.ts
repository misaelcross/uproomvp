import { supabase } from './supabase'

export interface SubdomainValidation {
  isValid: boolean
  isAvailable: boolean
  message: string
}

export class SubdomainService {
  // Reserved subdomains that cannot be used
  private static readonly RESERVED_SUBDOMAINS = [
    'www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog', 'shop', 'store',
    'support', 'help', 'docs', 'dev', 'test', 'staging', 'prod', 'production',
    'dashboard', 'portal', 'login', 'register', 'auth', 'account', 'profile',
    'settings', 'config', 'status', 'health', 'ping', 'webhook', 'callback',
    'assets', 'static', 'cdn', 'media', 'images', 'files', 'uploads'
  ]

  /**
   * Generate a subdomain from company name
   */
  static generateSubdomain(companyName: string): string {
    return companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 30) // Limit length
  }

  /**
   * Validate subdomain format
   */
  static validateFormat(subdomain: string): { isValid: boolean; message: string } {
    // Check length
    if (subdomain.length < 3) {
      return { isValid: false, message: 'Subdomain must be at least 3 characters long' }
    }
    
    if (subdomain.length > 30) {
      return { isValid: false, message: 'Subdomain must be no more than 30 characters long' }
    }

    // Check format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return { isValid: false, message: 'Subdomain can only contain lowercase letters, numbers, and hyphens' }
    }

    // Check that it doesn't start or end with hyphen
    if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
      return { isValid: false, message: 'Subdomain cannot start or end with a hyphen' }
    }

    // Check for consecutive hyphens
    if (subdomain.includes('--')) {
      return { isValid: false, message: 'Subdomain cannot contain consecutive hyphens' }
    }

    // Check if reserved
    if (this.RESERVED_SUBDOMAINS.includes(subdomain)) {
      return { isValid: false, message: 'This subdomain is reserved and cannot be used' }
    }

    return { isValid: true, message: 'Valid subdomain format' }
  }

  /**
   * Check if subdomain is available
   */
  static async checkAvailability(subdomain: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id')
        .eq('subdomain', subdomain)
        .single()

      if (error && error.code === 'PGRST116') {
        // No rows returned, subdomain is available
        return true
      }

      if (error) {
        console.error('Error checking subdomain availability:', error)
        return false
      }

      // If we got data, subdomain is taken
      return false
    } catch (error) {
      console.error('Error checking subdomain availability:', error)
      return false
    }
  }

  /**
   * Validate subdomain (format + availability)
   */
  static async validateSubdomain(subdomain: string): Promise<SubdomainValidation> {
    // First check format
    const formatValidation = this.validateFormat(subdomain)
    if (!formatValidation.isValid) {
      return {
        isValid: false,
        isAvailable: false,
        message: formatValidation.message
      }
    }

    // Then check availability
    const isAvailable = await this.checkAvailability(subdomain)
    
    return {
      isValid: true,
      isAvailable,
      message: isAvailable ? 'Subdomain is available' : 'Subdomain is already taken'
    }
  }

  /**
   * Generate alternative subdomains if the preferred one is taken
   */
  static async generateAlternatives(baseSubdomain: string, count: number = 5): Promise<string[]> {
    const alternatives: string[] = []
    
    for (let i = 1; i <= count; i++) {
      const alternative = `${baseSubdomain}-${i}`
      const validation = await this.validateSubdomain(alternative)
      
      if (validation.isValid && validation.isAvailable) {
        alternatives.push(alternative)
      }
    }

    return alternatives
  }

  /**
   * Get the full URL for a subdomain
   */
  static getSubdomainUrl(subdomain: string, protocol: string = 'https'): string {
    const domain = process.env.NODE_ENV === 'production' 
      ? process.env.VITE_DOMAIN || 'uproom.com'
      : 'localhost:8080'
    
    return `${protocol}://${subdomain}.${domain}`
  }

  /**
   * Extract subdomain from current URL
   */
  static getCurrentSubdomain(): string | null {
    if (typeof window === 'undefined') return null
    
    const hostname = window.location.hostname
    const parts = hostname.split('.')
    
    // For localhost development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return null
    }
    
    // For production (subdomain.domain.com)
    if (parts.length >= 3) {
      return parts[0]
    }
    
    return null
  }
}