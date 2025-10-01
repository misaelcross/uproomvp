import { CompanyService } from './company-client'

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
      const { available } = await CompanyService.checkSubdomainAvailability(subdomain)
      return available
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
    
    // For localhost development with port
    if (hostname.includes('localhost')) {
      // Check for subdomain.localhost:port format
      if (parts.length >= 2 && parts[1] === 'localhost') {
        return parts[0]
      }
      return null
    }
    
    // For production (subdomain.domain.com)
    if (parts.length >= 3) {
      return parts[0]
    }
    
    // For development with custom domains
    if (parts.length === 2 && !['localhost', '127.0.0.1'].includes(parts[0])) {
      return parts[0]
    }
    
    return null
  }

  /**
   * Check if current environment supports subdomains
   */
  static supportsSubdomains(): boolean {
    if (typeof window === 'undefined') return false
    
    const hostname = window.location.hostname
    
    // Production environment
    if (hostname.includes('uproom.com')) {
      return true
    }
    
    // Development with localhost subdomains
    if (hostname.includes('localhost') && hostname !== 'localhost') {
      return true
    }
    
    return false
  }

  /**
   * Get workspace URL with proper subdomain handling
   */
  static getWorkspaceUrl(subdomain: string, path: string = ''): string {
    const protocol = window.location.protocol
    const port = window.location.port
    
    let domain: string
    
    if (process.env.NODE_ENV === 'production') {
      domain = process.env.VITE_DOMAIN || 'uproom.com'
    } else {
      domain = port ? `localhost:${port}` : 'localhost:8080'
    }
    
    const baseUrl = `${protocol}//${subdomain}.${domain}`
    return path ? `${baseUrl}${path.startsWith('/') ? path : '/' + path}` : baseUrl
  }
}