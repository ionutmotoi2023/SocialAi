'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Building2, Users, Trash2, AlertTriangle } from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-plans'

// Form validation schema
const editTenantSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  domain: z.string().optional().refine(
    (val) => !val || /^[a-z0-9-]+\.[a-z]{2,}$/.test(val),
    'Domain must be valid (e.g., example.com)'
  ),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  industry: z.string().optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
})

type EditTenantFormValues = z.infer<typeof editTenantSchema>

interface TenantUser {
  id: string
  name: string | null
  email: string
  role: string
}

interface TenantSubscription {
  plan: string
  status: string
  postsUsed: number
  usersUsed: number
  aiCreditsUsed: number
  postsLimit: number
  usersLimit: number
  aiCreditsLimit: number
}

interface EditTenantFormProps {
  tenantId: string
  initialData: {
    name: string
    domain: string | null
    website: string | null
    industry: string | null
    description: string | null
  }
  subscription?: TenantSubscription
  users?: TenantUser[]
  onSuccess?: () => void
  onCancel?: () => void
  onDelete?: () => void
}

export function EditTenantForm({ 
  tenantId, 
  initialData, 
  subscription,
  users = [],
  onSuccess, 
  onCancel,
  onDelete 
}: EditTenantFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<EditTenantFormValues>({
    resolver: zodResolver(editTenantSchema),
    defaultValues: {
      name: initialData.name,
      domain: initialData.domain || '',
      website: initialData.website || '',
      industry: initialData.industry || '',
      description: initialData.description || '',
      plan: (subscription?.plan as any) || 'FREE',
    },
  })

  const selectedPlan = form.watch('plan')

  async function onSubmit(data: EditTenantFormValues) {
    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/super-admin/tenants/${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          domain: data.domain || undefined,
          website: data.website || undefined,
          industry: data.industry || undefined,
          description: data.description || undefined,
          plan: data.plan,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update tenant')
      }

      toast({
        title: 'Tenant updated successfully',
        description: `${data.name} has been updated`,
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard/super-admin')
        router.refresh()
      }
    } catch (error: any) {
      console.error('Error updating tenant:', error)
      toast({
        title: 'Failed to update tenant',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirm(
      `⚠️ DANGER: Are you sure you want to DELETE "${initialData.name}"?\n\n` +
      `This will permanently delete:\n` +
      `• ${users.length} user(s)\n` +
      `• All posts and content\n` +
      `• All configurations\n` +
      `• Subscription and billing history\n\n` +
      `This action CANNOT be undone!\n\n` +
      `Type the tenant name to confirm.`
    )) {
      return
    }

    // Additional confirmation
    const confirmation = prompt(`Type "${initialData.name}" to confirm deletion:`)
    if (confirmation !== initialData.name) {
      toast({
        title: 'Deletion cancelled',
        description: 'Tenant name did not match',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsDeleting(true)

      const response = await fetch(`/api/super-admin/tenants/${tenantId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Tenant deleted',
          description: `${initialData.name} has been permanently deleted`,
        })

        if (onDelete) {
          onDelete()
        } else {
          router.push('/dashboard/super-admin')
          router.refresh()
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete tenant')
      }
    } catch (error: any) {
      toast({
        title: 'Failed to delete tenant',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Company Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Building2 className="h-5 w-5" />
              <h3>Company Information</h3>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormDescription>
                    The legal name of the company or organization
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="acme.com" {...field} />
                    </FormControl>
                    <FormDescription>Company domain</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://acme.com" {...field} />
                    </FormControl>
                    <FormDescription>Full website URL</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Real Estate">Real Estate</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Consulting">Consulting</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Primary industry sector</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the company..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description (max 500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Subscription Plan Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Subscription Plan</h3>

            {subscription && (
              <Card className="bg-muted/50">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Usage</p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-sm">
                          Posts: {subscription.postsUsed}/{subscription.postsLimit}
                        </span>
                        <span className="text-sm">
                          Users: {subscription.usersUsed}/{subscription.usersLimit}
                        </span>
                        <span className="text-sm">
                          Credits: {subscription.aiCreditsUsed}/{subscription.aiCreditsLimit}
                        </span>
                      </div>
                    </div>
                    <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {subscription.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <FormField
              control={form.control}
              name="plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Plan *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a subscription plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{plan.name}</span>
                            <span className="text-sm text-muted-foreground ml-4">
                              {plan.priceDisplay}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {selectedPlan && (
                      <div className="mt-2 space-y-1">
                        <p className="font-medium">{SUBSCRIPTION_PLANS[selectedPlan].description}</p>
                        <p className="text-sm">
                          New limits: {SUBSCRIPTION_PLANS[selectedPlan].limits.posts} posts, {' '}
                          {SUBSCRIPTION_PLANS[selectedPlan].limits.users} users, {' '}
                          {SUBSCRIPTION_PLANS[selectedPlan].limits.aiCredits} AI credits/month
                        </p>
                      </div>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>

              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>

            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Tenant
            </Button>
          </div>
        </form>
      </Form>

      {/* Users Section */}
      {users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users ({users.length})
            </CardTitle>
            <CardDescription>
              Users belonging to this tenant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{user.name || 'Unnamed User'}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant="outline">{user.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Deleting this tenant will permanently remove:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>{users.length} user account(s)</li>
              <li>All posts and content</li>
              <li>All AI configurations and training data</li>
              <li>Subscription and billing history</li>
              <li>All brand assets and integrations</li>
            </ul>
            <p className="text-sm font-semibold text-destructive mt-4">
              This action cannot be undone!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
