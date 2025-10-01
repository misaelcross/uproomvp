/**
 * CORS Configuration for Uproom Frontend
 * Handles cross-origin requests for subdomain-based company workspaces
 */

export interface CorsConfig {
  allowedOrigins: (string | RegExp)[]
  allowedMethods: string[]
  allowedHeaders: string[]
  credentials: boolean
}

export class CorsManager {
  private static readonly config: CorsConfig = {
    allowedOrigins: [
      // Local development
      'http://localhost:8080',
      'https://localhost:8080',
      'http://127.0.0.1:8080',
      'https://127.0.0.1:8080',
      
      // Production domains - company subdomains
      /^https:\/\/.*\.uproom\.com$/,
      /^http:\/\/.*\.uproom\.com$/,
      
      // Development subdomains
      /^http:\/\/.*\.localhost:8080$/,
      /^https:\/\/.*\.localhost:8080$/,
      
      // Main domain
      'https://uproom.com',
      'http://uproom.com'
    ],
    allowedMethods: [
      'GET',
      'POST', 
      'PUT',
      'DELETE',
      'OPTIONS',
      'PATCH',
      'HEAD'
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Client-Info',
      'apikey',
      'X-Supabase-Auth',
      'Cache-Control',
      'Pragma'
    ],
    credentials: true
  }

  /**
   * Check if an origin is allowed
   */
  static isOriginAllowed(origin: string): boolean {
    return this.config.allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin
      }
      return allowed.test(origin)
    })
  }

  /**
   * Get CORS headers for a request
   */
  static getCorsHeaders(origin?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Access-Control-Allow-Methods': this.config.allowedMethods.join(', '),
      'Access-Control-Allow-Headers': this.config.allowedHeaders.join(', '),
      'Access-Control-Allow-Credentials': this.config.credentials.toString(),
      'Access-Control-Max-Age': '86400' // 24 hours
    }

    if (origin && this.isOriginAllowed(origin)) {
      headers['Access-Control-Allow-Origin'] = origin
    }

    return headers
  }

  /**
   * Get the configuration object
   */
  static getConfig(): CorsConfig {
    return { ...this.config }
  }

  /**
   * Validate subdomain format for CORS
   */
  static isValidSubdomain(subdomain: string): boolean {
    // Basic subdomain validation
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/
    return subdomainRegex.test(subdomain) && subdomain.length >= 3 && subdomain.length <= 63
  }

  /**
   * Get allowed origin pattern for a specific environment
   */
  static getOriginPattern(environment: 'development' | 'production'): RegExp {
    if (environment === 'development') {
      return /^https?:\/\/.*\.localhost:8080$/
    }
    return /^https:\/\/.*\.uproom\.com$/
  }
}

/**
 * Middleware function to add CORS headers to fetch requests
 */
export const addCorsHeaders = (headers: HeadersInit = {}): HeadersInit => {
  const corsHeaders = CorsManager.getCorsHeaders()
  return {
    ...headers,
    ...corsHeaders
  }
}

/**
 * Enhanced fetch wrapper with CORS support
 */
export const corsEnabledFetch = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const enhancedOptions: RequestInit = {
    ...options,
    credentials: 'include',
    headers: addCorsHeaders(options.headers)
  }

  return fetch(url, enhancedOptions)
}