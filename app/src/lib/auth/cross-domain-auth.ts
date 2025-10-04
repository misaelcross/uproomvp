// Cross-domain authentication service
// This handles authentication sharing between main domain and subdomains

export class CrossDomainAuth {
  private static readonly AUTH_COOKIE_NAME = 'auth_token'
  private static readonly AUTH_COOKIE_DOMAIN = process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_DOMAIN || 'uproom.com'
    : 'localhost'

  /**
   * Set authentication token in a cookie that can be shared across subdomains
   */
  static setAuthToken(token: string) {
    // Set in localStorage for current domain
    localStorage.setItem('auth_token', token)
    
    // Also set in cookie for cross-domain sharing
    const expires = new Date()
    expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000)) // 7 days
    
    // Get the base domain for cookie sharing
    const baseDomain = this.getBaseDomainForCookie()
    
    console.log('🔍 CrossDomainAuth: setAuthToken', {
      token: token ? 'exists' : 'null',
      baseDomain,
      protocol: window.location.protocol,
      isSecure: window.location.protocol === 'https:'
    })
    
    // For localhost, don't set domain to allow subdomain sharing
    if (baseDomain.includes('localhost')) {
      document.cookie = `${this.AUTH_COOKIE_NAME}=${token}; expires=${expires.toUTCString()}; path=/; samesite=lax`
    } else {
      document.cookie = `${this.AUTH_COOKIE_NAME}=${token}; expires=${expires.toUTCString()}; domain=${baseDomain}; path=/; secure=${window.location.protocol === 'https:'}; samesite=lax`
    }
    
    console.log('🔍 CrossDomainAuth: Cookie set:', document.cookie)
  }

  /**
   * Get authentication token from localStorage or cookie
   */
  static getAuthToken(): string | null {
    // First try localStorage
    const localToken = localStorage.getItem('auth_token')
    console.log('🔍 CrossDomainAuth: localStorage token:', localToken ? 'exists' : 'null')
    
    if (localToken) {
      return localToken
    }

    // If not in localStorage, try to get from cookie
    const cookies = document.cookie.split(';')
    console.log('🔍 CrossDomainAuth: All cookies:', document.cookie)
    console.log('🔍 CrossDomainAuth: Looking for cookie:', this.AUTH_COOKIE_NAME)
    
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === this.AUTH_COOKIE_NAME) {
        console.log('🔍 CrossDomainAuth: Found cookie token:', value ? 'exists' : 'null')
        // Set in localStorage for future use
        localStorage.setItem('auth_token', value)
        return value
      }
    }

    console.log('🔍 CrossDomainAuth: No token found')
    return null
  }

  /**
   * Get base domain for cookie sharing
   */
  static getBaseDomainForCookie(): string {
    const hostname = window.location.hostname
    console.log('🔍 CrossDomainAuth: getBaseDomainForCookie hostname:', hostname)
    
    // For localhost development - use .localhost for subdomain sharing
    if (hostname.includes('localhost')) {
      return '.localhost'
    }
    
    // For Vercel deployment
    if (hostname.includes('vercel.app')) {
      return '.vercel.app'
    }
    
    // For production domains - use environment variables
    const workspaceDomain = process.env.NEXT_PUBLIC_WORKSPACE_DOMAIN || 'uproom.com'
    const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'starvibe.space'
    
    if (hostname.includes(workspaceDomain)) {
      return `.${workspaceDomain}`
    }
    
    if (hostname.includes(mainDomain)) {
      return `.${mainDomain}`
    }
    
    // Fallback to current domain
    return hostname
  }

  /**
   * Clear authentication token from both localStorage and cookie
   */
  static clearAuthToken() {
    localStorage.removeItem('auth_token')
    const baseDomain = this.getBaseDomainForCookie()
    document.cookie = `${this.AUTH_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${baseDomain}; path=/;`
  }

  /**
   * Sync logout across all domains
   */
  static syncLogout() {
    console.log('🔍 CrossDomainAuth: Iniciando sync logout...')
    
    // Clear local storage and cookies
    this.clearAuthToken()
    console.log('🧹 CrossDomainAuth: Tokens locais limpos')
    
    // If we're on a subdomain, also clear the main domain
    if (this.isSubdomain()) {
      const mainDomain = this.getMainDomain()
      const protocol = window.location.protocol
      
      console.log('🔍 CrossDomainAuth: Em subdomínio, limpando domínio principal:', mainDomain)
      
      // Use a hidden iframe to clear the main domain's auth
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = `${protocol}//${mainDomain}/auth/clear`
      document.body.appendChild(iframe)
      
      // Remove iframe after a short delay
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe)
        }
        console.log('✅ CrossDomainAuth: Sync logout concluído')
      }, 1000)
    } else {
      console.log('✅ CrossDomainAuth: Sync logout concluído (domínio principal)')
    }
  }

  /**
   * Sync login across domains
   */
  static syncLogin(token: string) {
    // Set token in current domain
    this.setAuthToken(token)
    
    // If we're on main domain, also set for subdomains via cookie
    if (!this.isSubdomain()) {
      // The cookie will be available to all subdomains
      this.setAuthToken(token)
    }
  }

  /**
   * Check if we're on a subdomain
   */
  static isSubdomain(): boolean {
    const hostname = window.location.hostname
    console.log('🔍 CrossDomainAuth: isSubdomain check:', { hostname, includesDot: hostname.includes('.'), includesLocalhost: hostname.includes('localhost') })
    
    // For localhost development, check if it's a subdomain like kayda.localhost
    if (hostname.includes('localhost')) {
      const parts = hostname.split('.')
      return parts.length > 1 && parts[0] !== 'localhost'
    }
    
    return hostname.includes('.') && !hostname.includes('localhost')
  }

  /**
   * Get main domain from current hostname
   */
  static getMainDomain(): string {
    const hostname = window.location.hostname
    
    // For Vercel deployment
    if (hostname.includes('vercel.app')) {
      return process.env.NEXT_PUBLIC_VERCEL_DOMAIN || 'uproomvp.vercel.app'
    }
    
    // For localhost development
    if (hostname.includes('localhost')) {
      return process.env.NEXT_PUBLIC_DEV_DOMAIN || 'localhost:3000'
    }
    
    // For production with custom domain
    return process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'starvibe.space'
  }

  /**
   * Redirect to main domain for authentication
   */
  static redirectToMainDomainForAuth() {
    const mainDomain = this.getMainDomain()
    const protocol = window.location.protocol
    const currentPath = window.location.pathname
    const currentHost = window.location.host
    
    // Validate the current host to avoid malformed URLs
    if (!currentHost || currentHost.length < 3) {
      console.error('Invalid host detected:', currentHost)
      // Fallback to main domain without return URL
      window.location.href = `${protocol}//${mainDomain}/login`
      return
    }
    
    // Prevent redirect loops by checking if we're already on a login page
    if (currentPath.includes('/login') || currentPath.includes('/register')) {
      console.warn('Already on auth page, skipping redirect to prevent loop')
      // If already on an auth page, do NOT redirect again. Just return.
      return
    }
    
    const returnUrl = encodeURIComponent(`${protocol}//${currentHost}${currentPath}`)
    
    // Validate the return URL before using it
    try {
      const decodedUrl = decodeURIComponent(returnUrl)
      const url = new URL(decodedUrl)
      
      // Additional check: prevent redirect to login pages
      if (url.pathname.includes('/login') || url.pathname.includes('/register')) {
        console.warn('Return URL points to auth page, redirecting without return URL to prevent loop')
        window.location.href = `${protocol}//${mainDomain}/login`
        return
      }
      
      window.location.href = `${protocol}//${mainDomain}/login?returnUrl=${returnUrl}`
    } catch (error) {
      console.error('Invalid return URL:', returnUrl, error)
      // Fallback to main domain without return URL
      window.location.href = `${protocol}//${mainDomain}/login`
    }
  }

  /**
   * Handle authentication redirect after login
   */
  static handleAuthRedirect() {
    const urlParams = new URLSearchParams(window.location.search)
    const returnUrl = urlParams.get('returnUrl')
    
    if (returnUrl) {
      try {
        // Decode and validate the return URL
        const decodedUrl = decodeURIComponent(returnUrl)
        const url = new URL(decodedUrl)
        
        // Prevent redirect loops by checking if return URL points to auth pages
        if (url.pathname.includes('/login') || url.pathname.includes('/register')) {
          console.warn('Return URL points to auth page, redirecting to dashboard to prevent loop')
          window.location.href = '/'
          return
        }
        
        // Validate that the return URL is from a trusted domain
        const currentHost = window.location.hostname
        const returnHost = url.hostname
        
        // Allow redirects to subdomains of the same base domain
        const workspaceDomain = process.env.NEXT_PUBLIC_WORKSPACE_DOMAIN || 'uproom.com'
        const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'starvibe.space'
        
        const isTrustedDomain = returnHost === currentHost || 
                               returnHost.endsWith(`.${mainDomain}`) ||
                               returnHost.endsWith(`.${workspaceDomain}`) ||
                               returnHost.includes('localhost')
        
        if (isTrustedDomain) {
          window.location.href = decodedUrl
        } else {
          console.warn('Untrusted return URL:', decodedUrl)
          window.location.href = '/'
        }
      } catch (error) {
        console.error('Invalid return URL:', returnUrl, error)
        window.location.href = '/'
      }
    } else {
      // No returnUrl - stay on current page (don't redirect automatically)
      console.log('🔍 CrossDomainAuth: No returnUrl, staying on current page')
    }
  }
}
