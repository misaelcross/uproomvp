import { useState, useEffect } from 'react'
import { SubdomainService } from '@/lib/subdomain'
import { CompanyService } from '@/lib/company-client'
import { Company } from '@prisma/client'

export interface SubdomainState {
  subdomain: string | null
  company: Company | null
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
        
        const subdomain = SubdomainService.getCurrentSubdomain()
        
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
        const formatValidation = SubdomainService.validateFormat(subdomain)
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
        const { company, error } = await CompanyService.getCompanyBySubdomain(subdomain)

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
    const url = SubdomainService.getWorkspaceUrl(subdomain)
    window.location.href = url
  }

  const redirectToMainDomain = () => {
    const protocol = window.location.protocol
    const domain = process.env.NODE_ENV === 'production' 
      ? process.env.VITE_DOMAIN || 'uproom.com'
      : 'localhost:8080'
    
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