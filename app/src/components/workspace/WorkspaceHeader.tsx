'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  ChevronDown, 
  Settings, 
  UserPlus, 
  LogOut, 
  Building2,
  Mail,
  User
} from 'lucide-react';

interface WorkspaceHeaderProps {
  company: any;
}

export default function WorkspaceHeader({ company }: WorkspaceHeaderProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { inviteUser, userRole } = useCompany();
  const { toast } = useToast();
  
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [isInviting, setIsInviting] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    setIsInviting(true);
    try {
      const result = await inviteUser(inviteEmail, inviteRole);
      
      if (result.success) {
        toast({
          title: 'Invitation Sent',
          description: `Invitation sent to ${inviteEmail}`,
        });
        setInviteEmail('');
        setIsInviteDialogOpen(false);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send invitation',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const getCompanyInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      {/* Header */}
      <header className="bg-background border-b border-border/40 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Workspace Info */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {company?.logo_url ? (
                <img 
                  src={company.logo_url} 
                  alt={`${company.name} logo`}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-semibold text-foreground">{company?.name || 'Workspace'}</h1>
                <p className="text-xs text-muted-foreground">
                  {company?.subdomain ? `${company.subdomain}.uproom.com` : 'Workspace URL'}
                </p>
              </div>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {/* User Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 h-auto p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>
                      {getUserInitials(user?.fullName || user?.email || 'User')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-foreground">
                      {user?.fullName || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setIsInviteDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Invite Member</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsSettingsDialogOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Invite User Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join this workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={inviteRole} onValueChange={(value: 'MEMBER' | 'ADMIN') => setInviteRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Member</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ADMIN">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>Admin</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser} disabled={isInviting}>
              {isInviting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workspace Settings</DialogTitle>
            <DialogDescription>
              Manage your workspace settings and preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Workspace Name</Label>
              <Input value={company?.name || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Your Role</Label>
              <Input 
                value={userRole === 'OWNER' ? 'Owner' : userRole === 'ADMIN' ? 'Admin' : 'Member'} 
                disabled 
              />
            </div>
            <div className="space-y-2">
              <Label>Workspace URL</Label>
              <Input value={`${company?.subdomain}.localhost:3000`} disabled />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
