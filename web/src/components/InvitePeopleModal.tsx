import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Copy, Check, Users, Link, ExternalLink } from 'lucide-react'
import { useToast } from '../hooks/use-toast'
import { useCompany } from '../contexts/CompanyContext'

interface InvitePeopleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const InvitePeopleModal: React.FC<InvitePeopleModalProps> = ({ open, onOpenChange }) => {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const { currentCompany } = useCompany()

  // Debug: Log when modal opens
  useEffect(() => {
    if (open) {
      console.log('🚀 InvitePeopleModal opened, currentCompany:', currentCompany)
    }
  }, [open, currentCompany])

  // Generate the company subdomain link
  const getInviteLink = () => {
    console.log('🔗 Generating invite link, currentCompany:', currentCompany)
    
    // For development, create a simple join link even without subdomain
    const currentDomain = window.location.hostname
    const currentPort = window.location.port
    const protocol = window.location.protocol
    
    let inviteUrl = ''
    
    if (currentDomain === 'localhost') {
      // Development environment - use join page with company ID
      if (currentCompany?.id) {
        inviteUrl = `${protocol}//${currentDomain}:${currentPort}/join?id=${currentCompany.id}`
      } else {
        inviteUrl = `${protocol}//${currentDomain}:${currentPort}/join`
      }
    } else if (currentCompany?.subdomain) {
      // Production environment - use subdomain if available
      const baseDomain = currentDomain.replace(/^[^.]+\./, '') // Remove subdomain if present
      inviteUrl = `${protocol}//${currentCompany.subdomain}.${baseDomain}`
    } else {
      // Fallback - use join page with company ID
      inviteUrl = `${protocol}//${currentDomain}/join${currentCompany?.id ? `?id=${currentCompany.id}` : ''}`
    }
    
    console.log('✅ Generated invite link:', inviteUrl)
    return inviteUrl
  }

  const inviteLink = getInviteLink()

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "The invite link has been copied to your clipboard.",
      })
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive"
      })
    }
  }

  const openInNewTab = () => {
    window.open(inviteLink, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Invite People to {currentCompany?.name}
          </DialogTitle>
          <DialogDescription>
            Share this link with people you want to invite to your company. They can use it to join directly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Link className="h-4 w-4" />
                Company Invite Link
              </CardTitle>
              <CardDescription className="text-xs">
                Anyone with this link can join your company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="invite-link" className="text-xs font-medium">
                  Invite Link
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="invite-link"
                    value={inviteLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openInNewTab}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview Link
                </Button>
                <Button
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">How it works:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Share this link with people you want to invite</li>
                <li>They'll be taken to your company's join page</li>
                <li>They can create an account or sign in to join</li>
                <li>You'll see them in your team members list once they join</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default InvitePeopleModal