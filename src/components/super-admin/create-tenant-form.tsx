'use client'

import { useState } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import { Loader2, Building2 } from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-plans'

// Form validation schema
const createTenantSchema = z.object({
  // Tenant information
  name: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  domain: z.string().optional().refine(
    (val) => !val || /^[a-z0-9-]+\.[a-z]{2,}$/.test(val),
    'Domain must be valid (e.g., example.com)'
  ),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  industry: z.string().optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  
  // Subscription plan
  plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  
  // Admin user (optional - can be created later)
  createAdmin: z.boolean().default(false),
  adminEmail: z.string().email('Must be a valid email').optional().or(z.literal('')),
  adminName: z.string().min(2).max(100).optional().or(z.literal('')),
})

type CreateTenantFormValues = z.infer<typeof createTenantSchema>

interface CreateTenantFormProps {
  onSuccess?: (tenantId: string) => void
  onCancel?: () => void
}

export function CreateTenantForm({ onSuccess, onCancel }: CreateTenantFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateTenantFormValues>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: '',
      domain: '',
      website: '',
      industry: '',
      description: '',
      plan: 'STARTER',
      createAdmin: false,
      adminEmail: '',
      adminName: '',
    },
  })

  const createAdmin = form.watch('createAdmin')
  const selectedPlan = form.watch('plan')

  async function onSubmit(data: CreateTenantFormValues) {
    try {
      setIsSubmitting(true)

      // Prepare payload
      const payload: any = {
        name: data.name,
        domain: data.domain || undefined,
        website: data.website || undefined,
        industry: data.industry || undefined,
        description: data.description || undefined,
        plan: data.plan,
      }

      // Add admin user if requested
      if (data.createAdmin && data.adminEmail && data.adminName) {
        payload.adminUser = {
          email: data.adminEmail,
          name: data.adminName,
        }
      }

      const response = await fetch('/api/super-admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create tenant')
      }

      toast({
        title: 'Tenant created successfully',
        description: `${data.name} has been created with ${data.plan} plan`,
      })

      // Call success callback or redirect
      if (onSuccess) {
        onSuccess(result.tenant.id)
      } else {
        router.push('/dashboard/super-admin')
        router.refresh()
      }
    } catch (error: any) {
      console.error('Error creating tenant:', error)
      toast({
        title: 'Failed to create tenant',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
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
                  <FormDescription>Company domain (e.g., acme.com)</FormDescription>
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
                        Limits: {SUBSCRIPTION_PLANS[selectedPlan].limits.posts} posts, {' '}
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

        {/* Admin User Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Administrator Account (Optional)</h3>

          <FormField
            control={form.control}
            name="createAdmin"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Create admin user</FormLabel>
                  <FormDescription>
                    Create an initial admin user for this tenant
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {createAdmin && (
            <div className="space-y-4 pl-7">
              <FormField
                control={form.control}
                name="adminEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@acme.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Email address for the admin user
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adminName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormDescription>
                      Full name of the admin user
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <p className="text-sm text-muted-foreground">
                Note: In demo mode, any password will work for login.
              </p>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center gap-4 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Tenant
          </Button>

          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
