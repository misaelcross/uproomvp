import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, UserPlus, Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { InvitationService } from '@/lib/invitations-client'
import { UserRole } from '@/types/company'

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'member'] as const, {
    required_error: 'Please select a role'
  })
})

type InviteFormData = z.infer<typeof inviteSchema>

interface InviteUserDialogProps {
  companyId: string
  companyName: string
  onInviteSent?: () => void
  trigger?: React.ReactNode
}

const InviteUserDialog: React.FC<InviteUserDialogProps> = ({
  companyId,
  companyName,
  onInviteSent,
  trigger
}) => {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'member'
    }
  })

  const onSubmit = async (data: InviteFormData) => {
    setIsLoading(true)
    setResult(null)

    try {
      const result = await InvitationService.inviteUser({
        email: data.email,
        role: data.role,
        company_id: companyId
      })

      setResult(result)

      if (result.success) {
        toast({
          title: 'Invitation sent!',
          description: `An invitation has been sent to ${data.email}`,
        })
        
        form.reset()
        onInviteSent?.()
        
        // Close dialog after a short delay to show success message
        setTimeout(() => {
          setOpen(false)
          setResult(null)
        }, 2000)
      } else {
        toast({
          title: 'Failed to send invitation',
          description: result.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      setResult({
        success: false,
        message: 'An unexpected error occurred'
      })
      
      toast({
        title: 'Error',
        description: 'Failed to send invitation. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      setOpen(newOpen)
      if (!newOpen) {
        form.reset()
        setResult(null)
      }
    }
  }

  const defaultTrigger = (
    <Button>
      <UserPlus className="mr-2 h-4 w-4" />
      Invite User
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite User to {companyName}</DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new team member to your workspace.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="colleague@company.com"
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">
                        <div className="flex flex-col">
                          <span>Member</span>
                          <span className="text-xs text-gray-500">Can participate in conversations</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex flex-col">
                          <span>Admin</span>
                          <span className="text-xs text-gray-500">Can manage users and settings</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {result && (
              <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center">
                  {result.success ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={`ml-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.message}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || (result?.success === true)}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Invitation...
                  </>
                ) : result?.success ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Invitation Sent!
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default InviteUserDialog