import React, { useState, useEffect } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { SubdomainService } from '@/lib/subdomain'
import { cn } from '@/lib/utils'

interface SubdomainCheckerProps {
  value: string
  onChange: (value: string) => void
  onValidationChange: (isValid: boolean, isAvailable: boolean) => void
  className?: string
}

const SubdomainChecker: React.FC<SubdomainCheckerProps> = ({
  value,
  onChange,
  onValidationChange,
  className
}) => {
  const [isChecking, setIsChecking] = useState(false)
  const [validation, setValidation] = useState<{
    isValid: boolean
    isAvailable: boolean
    message: string
  } | null>(null)
  const [alternatives, setAlternatives] = useState<string[]>([])

  useEffect(() => {
    const checkSubdomain = async () => {
      if (!value || value.length < 3) {
        setValidation(null)
        setAlternatives([])
        onValidationChange(false, false)
        return
      }

      setIsChecking(true)
      
      try {
        const result = await SubdomainService.validateSubdomain(value)
        setValidation(result)
        onValidationChange(result.isValid, result.isAvailable)

        // If subdomain is taken, generate alternatives
        if (result.isValid && !result.isAvailable) {
          const alts = await SubdomainService.generateAlternatives(value, 3)
          setAlternatives(alts)
        } else {
          setAlternatives([])
        }
      } catch (error) {
        console.error('Error validating subdomain:', error)
        setValidation({
          isValid: false,
          isAvailable: false,
          message: 'Error checking subdomain availability'
        })
        onValidationChange(false, false)
      } finally {
        setIsChecking(false)
      }
    }

    const timeoutId = setTimeout(checkSubdomain, 500) // Debounce
    return () => clearTimeout(timeoutId)
  }, [value, onValidationChange])

  const getStatusIcon = () => {
    if (isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
    }
    
    if (!validation) {
      return null
    }

    if (validation.isValid && validation.isAvailable) {
      return <Check className="h-4 w-4 text-green-500" />
    }

    return <X className="h-4 w-4 text-red-500" />
  }

  const getStatusColor = () => {
    if (!validation) return 'border-gray-300'
    if (validation.isValid && validation.isAvailable) return 'border-green-500'
    return 'border-red-500'
  }

  const getPreviewUrl = () => {
    if (!value || !validation?.isValid) return null
    return SubdomainService.getSubdomainUrl(value, 'https')
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <div className="flex">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-neutral-800 text-gray-500 text-sm">
            https://
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              'flex-1 min-w-0 block w-full px-3 py-2 rounded-none border focus:ring-blue-500 focus:border-neutral-500 text-sm bg-neutral-800',
              getStatusColor()
            )}
            placeholder="your-company"
          />
          <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-neutral-800 text-gray-500 text-sm">
            .uproom.com
          </span>
          <div className="absolute right-6 top-1/2 transform -translate-y-1/2 mr-24">
            {getStatusIcon()}
          </div>
        </div>
      </div>

      {/* Validation message */}
      {validation && (
        <p className={cn(
          'text-sm',
          validation.isValid && validation.isAvailable ? 'text-green-600' : 'text-red-600'
        )}>
          {validation.message}
        </p>
      )}

      {/* Preview URL - Removed as requested */}
      {/* Alternative suggestions */}
      {alternatives.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Suggested alternatives:</p>
          <div className="flex flex-wrap gap-2">
            {alternatives.map((alt) => (
              <button
                key={alt}
                onClick={() => onChange(alt)}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
              >
                {alt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SubdomainChecker