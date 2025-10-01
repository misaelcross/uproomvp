import React, { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Send, 
  Paperclip, 
  Smile, 
  X,
  FileText,
  Image as ImageIcon,
  File,
  AlertCircle
} from 'lucide-react'
import { realtimeService } from '../lib/realtime'
import { 
  validateMessage, 
  validateAttachments, 
  MAX_MESSAGE_LENGTH,
  MAX_ATTACHMENTS 
} from '../utils/messageValidation'

interface MessageInputProps {
  conversationId?: string
  onSendMessage?: (content: string, attachments?: File[]) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  className = ""
}) => {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    // Clear previous validation errors
    setValidationErrors([])
    
    // Validate message content
    const messageValidation = validateMessage(message)
    const attachmentValidation = validateAttachments(attachments)
    
    const allErrors = [...messageValidation.errors, ...attachmentValidation.errors]
    
    // If there are validation errors, show them and don't send
    if (allErrors.length > 0) {
      setValidationErrors(allErrors)
      return
    }
    
    // Check if we have content to send
    if (!messageValidation.sanitizedContent && attachments.length === 0) {
      setValidationErrors(['Please enter a message or attach a file'])
      return
    }
    
    setSending(true)
    
    try {
      // Use sanitized content
      const contentToSend = messageValidation.sanitizedContent || ''
      
      // If conversationId is provided, use realtime service
      if (conversationId) {
        await realtimeService.sendMessage(conversationId, contentToSend)
      }
      
      // Call the optional callback
      if (onSendMessage) {
        onSendMessage(contentToSend, attachments)
      }
      
      // Clear the input
      setMessage('')
      setAttachments([])
      setValidationErrors([])
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setValidationErrors(['Failed to send message. Please try again.'])
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Validate new files before adding
    const newAttachments = [...attachments, ...files]
    const validation = validateAttachments(newAttachments)
    
    if (validation.isValid) {
      setAttachments(newAttachments)
      setValidationErrors([])
    } else {
      setValidationErrors(validation.errors)
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />
    } else if (file.type.includes('text') || file.type.includes('document')) {
      return <FileText className="h-4 w-4" />
    } else {
      return <File className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }

  return (
    <Card className={`p-4 ${className}`}>
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert className="mb-3 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-2 pr-1">
              {getFileIcon(file)}
              <span className="text-xs max-w-32 truncate">{file.name}</span>
              <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-red-100"
                onClick={() => removeAttachment(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-end space-x-2">
        {/* Message Input */}
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[40px] max-h-[120px] resize-none border-0 shadow-none focus-visible:ring-0 p-2"
            style={{ height: 'auto' }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          {/* File Attachment */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="h-8 w-8 p-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Emoji Picker (Placeholder) */}
          <Button
            variant="ghost"
            size="sm"
            disabled={true}
            className="h-8 w-8 p-0"
            title="Emoji picker (coming soon)"
          >
            <Smile className="h-4 w-4" />
          </Button>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={disabled || sending || (!message.trim() && attachments.length === 0)}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
      />

      {/* Character Count */}
      {message.length > 0 && (
        <div className={`mt-2 text-xs text-right ${
          message.length > MAX_MESSAGE_LENGTH ? 'text-red-500' : 'text-gray-500'
        }`}>
          {message.length} / {MAX_MESSAGE_LENGTH} characters
          {attachments.length > 0 && (
            <span className="ml-2">
              • {attachments.length} / {MAX_ATTACHMENTS} files
            </span>
          )}
        </div>
      )}
    </Card>
  )
}

export default MessageInput