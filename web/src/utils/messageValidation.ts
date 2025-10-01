// Message validation and sanitization utilities

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedContent?: string
}

// Maximum message length (adjust as needed)
export const MAX_MESSAGE_LENGTH = 2000

// Minimum message length (excluding whitespace)
export const MIN_MESSAGE_LENGTH = 1

// Allowed file types for attachments
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

// Maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024

// Maximum number of attachments per message
export const MAX_ATTACHMENTS = 5

/**
 * Sanitize message content to prevent XSS attacks
 */
export function sanitizeMessage(content: string): string {
  if (!content) return ''
  
  // Remove HTML tags and encode special characters
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

/**
 * Validate message content
 */
export function validateMessage(content: string): ValidationResult {
  const errors: string[] = []
  
  // Check if content exists
  if (!content || typeof content !== 'string') {
    errors.push('Message content is required')
    return { isValid: false, errors }
  }
  
  // Sanitize content
  const sanitizedContent = sanitizeMessage(content)
  
  // Check minimum length (after sanitization and trimming)
  if (sanitizedContent.length < MIN_MESSAGE_LENGTH) {
    errors.push('Message cannot be empty')
  }
  
  // Check maximum length
  if (sanitizedContent.length > MAX_MESSAGE_LENGTH) {
    errors.push(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`)
  }
  
  // Check for suspicious patterns that might indicate XSS attempts
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onload, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:text\/html/i
  ]
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      errors.push('Message contains potentially unsafe content')
      break
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedContent: errors.length === 0 ? sanitizedContent : undefined
  }
}

/**
 * Validate file attachments
 */
export function validateAttachments(files: File[]): ValidationResult {
  const errors: string[] = []
  
  // Check number of files
  if (files.length > MAX_ATTACHMENTS) {
    errors.push(`Cannot attach more than ${MAX_ATTACHMENTS} files`)
  }
  
  // Validate each file
  for (const file of files) {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      errors.push(`File type "${file.type}" is not allowed`)
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024)
      errors.push(`File "${file.name}" exceeds maximum size of ${maxSizeMB}MB`)
    }
    
    // Check for suspicious file names
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com']
    const fileName = file.name.toLowerCase()
    
    for (const ext of suspiciousExtensions) {
      if (fileName.endsWith(ext)) {
        errors.push(`File type "${ext}" is not allowed for security reasons`)
        break
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Format timestamp for display
 */
export function formatMessageTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return 'Just now'
  }
  
  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  }
  
  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  }
  
  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  }
  
  // More than a week - show actual date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

/**
 * Format detailed timestamp for tooltips
 */
export function formatDetailedTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * Check if a message was sent recently (within last 5 minutes)
 */
export function isRecentMessage(timestamp: string | Date): boolean {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const now = new Date()
  const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60)
  
  return diffInMinutes <= 5
}