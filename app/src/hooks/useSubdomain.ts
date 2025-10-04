import { useState, useEffect } from 'react'

export interface SubdomainState {
  subdomain: string | null
  company: any | null
  isLoading: boolean
  error: string | null
  isValidWorkspace: boolean
}

export const useSubdomain = () => {
  const [state, setState] = useState<SubdomainState>({
    subdomain: null,
    company: null,
    isLoading: true,
    error: null,
    isValidWorkspace: false
  })

  useEffect(() => {
    const detectAndLoadSubdomain = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }))
        
        const subdomain = getCurrentSubdomain()
        
        if (!subdomain) {
          // No subdomain detected - this is the main domain
          setState({
            subdomain: null,
            company: null,
            isLoading: false,
            error: null,
            isValidWorkspace: false
          })
          return
        }

        // Validate subdomain format
        const formatValidation = validateFormat(subdomain)
        if (!formatValidation.isValid) {
          setState({
            subdomain,
            company: null,
            isLoading: false,
            error: `Invalid subdomain: ${formatValidation.message}`,
            isValidWorkspace: false
          })
          return
        }

        // Load company data for this subdomain
        const { company, error } = await getCompanyBySubdomain(subdomain)

        if (error) {
          setState({
            subdomain,
            company: null,
            isLoading: false,
            error: error,
            isValidWorkspace: false
          })
          return
        }

        // Successfully loaded company
        setState({
          subdomain,
          company,
          isLoading: false,
          error: null,
          isValidWorkspace: true
        })

      } catch (error) {
        console.error('Error detecting subdomain:', error)
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to detect workspace'
        }))
      }
    }

    detectAndLoadSubdomain()
  }, [])

  const redirectToWorkspace = (subdomain: string) => {
    const url = getWorkspaceUrl(subdomain)
    window.location.href = url
  }

  const redirectToMainDomain = () => {
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    
    // For Vercel deployment
    if (hostname.includes('vercel.app')) {
      const vercelDomain = process.env.NEXT_PUBLIC_VERCEL_DOMAIN || 'uproomvp.vercel.app'
      window.location.href = `${protocol}//${vercelDomain}`
      return
    }
    
    // For localhost development
    if (hostname.includes('localhost')) {
      const devDomain = process.env.NEXT_PUBLIC_DEV_DOMAIN || 'localhost:3000'
      window.location.href = `${protocol}//${devDomain}`
      return
    }
    
    // For production with custom domain
    const domain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'starvibe.space'
    window.location.href = `${protocol}//${domain}`
  }

  return {
    ...state,
    redirectToWorkspace,
    redirectToMainDomain,
    refresh: () => {
      setState(prev => ({ ...prev, isLoading: true }))
      // Trigger re-detection
      window.location.reload()
    }
  }
}

// Helper functions
const getCurrentSubdomain = (): string | null => {
  if (typeof window === 'undefined') return null
  
  const hostname = window.location.hostname
  const parts = hostname.split('.')
  
  // For localhost development
  if (hostname.includes('localhost')) {
    if (parts.length >= 2 && parts[1] === 'localhost') {
      const subdomain = parts[0]
      if (subdomain !== 'localhost' && subdomain !== 'www') {
        return subdomain
      }
    }
    return null
  }
  
  // For production
  if (parts.length >= 3) {
    const subdomain = parts[0]
    if (subdomain !== 'www') {
      return subdomain
    }
  }
  
  return null
}

const validateFormat = (subdomain: string) => {
  // Basic validation - can be extended
  if (!subdomain || subdomain.length < 2) {
    return { isValid: false, message: 'Subdomain too short' }
  }
  
  if (!/^[a-zA-Z0-9-]+$/.test(subdomain)) {
    return { isValid: false, message: 'Invalid characters in subdomain' }
  }
  
  return { isValid: true, message: 'Valid subdomain' }
}

const getCompanyBySubdomain = async (subdomain: string) => {
  try {
    const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '')
    const response = await fetch(`${API_URL}/companies/subdomain/${subdomain}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        return { company: null, error: 'Workspace not found' }
      }
      return { company: null, error: 'Failed to load workspace' }
    }
    
    const data = await response.json()
    return { company: data.company, error: null }
  } catch (error) {
    console.error('Error loading company by subdomain:', error)
    return { company: null, error: 'Failed to load company' }
  }
}

const getWorkspaceUrl = (subdomain: string) => {
  const protocol = window.location.protocol
  const hostname = window.location.hostname
  
  // For localhost development
  if (hostname.includes('localhost')) {
    const devDomain = process.env.NEXT_PUBLIC_DEV_DOMAIN || 'localhost:3000'
    return `${protocol}//${subdomain}.${devDomain}`
  }
  
  // For Vercel deployment
  if (hostname.includes('vercel.app')) {
    const vercelDomain = process.env.NEXT_PUBLIC_VERCEL_DOMAIN || 'uproomvp.vercel.app'
    return `${protocol}//${subdomain}.${vercelDomain}`
  }
  
  // For production - use workspace domain from environment
  const workspaceDomain = process.env.NEXT_PUBLIC_WORKSPACE_DOMAIN || 'uproom.com'
  return `${protocol}//${subdomain}.${workspaceDomain}`
}
