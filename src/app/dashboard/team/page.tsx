'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Users, UserPlus, Mail, Trash2, Shield, Clock, CheckCircle, XCircle
} from 'lucide-react'

interface TeamMember {
  id: string
  name: string | null
  email: string
  role: string
  avatar: string | null
  createdAt: string
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  expiresAt: string
  createdAt: string
  invitedBy: {
    name: string | null
    email: string
  }
}

export default function TeamPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('EDITOR')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [membersRes, invitationsRes] = await Promise.all([
        fetch('/api/team/members'),
        fetch('/api/team/invitations')
      ])

      if (membersRes.ok) {
        const data = await membersRes.json()
        setMembers(data.members || [])
      }

      if (invitationsRes.ok) {
        const data = await invitationsRes.json()
        setInvitations(data.invitations || [])
      }
    } catch (error) {
      console.error('Failed to fetch team data:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendInvitation = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address',
        variant: 'destructive'
      })
      return
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      })
      return
    }

    setInviting(true)
    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      })

      if (response.ok) {
        const data = await response.json()
        setInvitations([data.invitation, ...invitations])
        setInviteEmail('')
        toast({
          title: 'Invitation sent',
          description: `Invitation sent to ${inviteEmail}`
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send invitation')
      }
    } catch (error: any) {
      toast({
        title: 'Failed to send invitation',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setInviting(false)
    }
  }

  const cancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/team/invitations/${invitationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setInvitations(invitations.filter(inv => inv.id !== invitationId))
        toast({
          title: 'Invitation cancelled',
          description: 'The invitation has been cancelled'
        })
      }
    } catch (error) {
      toast({
        title: 'Failed to cancel',
        description: 'Could not cancel the invitation',
        variant: 'destructive'
      })
    }
  }

  const removeMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return

    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMembers(members.filter(m => m.id !== memberId))
        toast({
          title: 'Member removed',
          description: 'Team member has been removed'
        })
      }
    } catch (error) {
      toast({
        title: 'Failed to remove',
        description: 'Could not remove team member',
        variant: 'destructive'
      })
    }
  }

  const updateRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/team/members/${memberId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      if (response.ok) {
        setMembers(members.map(m => 
          m.id === memberId ? { ...m, role: newRole } : m
        ))
        toast({
          title: 'Role updated',
          description: 'Member role has been updated'
        })
      }
    } catch (error) {
      toast({
        title: 'Failed to update',
        description: 'Could not update member role',
        variant: 'destructive'
      })
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'TENANT_ADMIN':
        return 'bg-red-500'
      case 'EDITOR':
        return 'bg-blue-500'
      case 'VIEWER':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>
      case 'ACCEPTED':
        return <Badge className="bg-green-500 gap-1"><CheckCircle className="h-3 w-3" />Accepted</Badge>
      case 'DECLINED':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Declined</Badge>
      case 'EXPIRED':
        return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" />Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Only show to admins
  if (session?.user?.role !== 'TENANT_ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              Only administrators can manage team members
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-muted-foreground mt-2">
          Invite team members and manage their roles
        </p>
      </div>

      {/* Invite Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </CardTitle>
          <CardDescription>
            Send an invitation to add a new member to your workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="teammate@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendInvitation()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Role
              </label>
              <select
                className="w-full h-10 px-3 border border-input bg-background rounded-md"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
                <option value="TENANT_ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <Button 
            onClick={sendInvitation}
            disabled={inviting}
            className="w-full"
          >
            <Mail className="h-4 w-4 mr-2" />
            {inviting ? 'Sending...' : 'Send Invitation'}
          </Button>

          <div className="text-sm text-muted-foreground pt-2">
            <p><strong>Role permissions:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>Admin:</strong> Full access, can manage team and settings</li>
              <li><strong>Editor:</strong> Can create and edit posts, manage content</li>
              <li><strong>Viewer:</strong> Read-only access to posts and analytics</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Team Members ({members.length})</h2>
        
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading team members...
          </div>
        ) : members.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
              <p className="text-muted-foreground">
                Invite your first team member to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {members.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name || ''} className="h-12 w-12 rounded-full" />
                        ) : (
                          <span className="text-lg font-semibold text-primary">
                            {(member.name || member.email).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{member.name || 'No name'}</h3>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={getRoleBadgeColor(member.role)}>
                        {member.role.replace('_', ' ')}
                      </Badge>
                      
                      {member.id !== session?.user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Pending Invitations ({invitations.length})</h2>
          <div className="grid gap-4">
            {invitations.map((invitation) => (
              <Card key={invitation.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{invitation.email}</span>
                        {getStatusBadge(invitation.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Invited by {invitation.invitedBy.name || invitation.invitedBy.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {invitation.role.replace('_', ' ')}
                      </Badge>
                      
                      {invitation.status === 'PENDING' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelInvitation(invitation.id)}
                        >
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
