'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  DollarSign, 
  Save, 
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Star
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'

interface PlanConfig {
  id?: string
  plan: string
  name: string
  description: string
  price: number
  priceDisplay: string
  postsLimit: number
  usersLimit: number
  aiCreditsLimit: number
  features: string[]
  popular: boolean
  stripePriceId?: string
}

const DEFAULT_PLANS = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']

export default function PricingManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [plans, setPlans] = useState<PlanConfig[]>([])
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard')
      return
    }

    fetchPlans()
  }, [session, status, router])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/super-admin/pricing')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error)
      toast({
        title: 'Error',
        description: 'Failed to load pricing configuration',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSavePlan = async (planData: PlanConfig) => {
    setSaving(true)
    try {
      const response = await fetch('/api/super-admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save plan')
      }

      toast({
        title: 'Success',
        description: `Plan ${planData.name} saved successfully`
      })

      setEditingPlan(null)
      fetchPlans()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save plan',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleResetToDefaults = async () => {
    if (!confirm('Reset all pricing to default values? This will overwrite any custom changes.')) {
      return
    }

    try {
      const response = await fetch('/api/super-admin/pricing/reset', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to reset pricing')
      }

      toast({
        title: 'Success',
        description: 'Pricing reset to defaults'
      })

      fetchPlans()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset pricing',
        variant: 'destructive'
      })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading pricing configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pricing Management</h1>
          <p className="text-muted-foreground mt-1">
            Configure subscription plans, pricing, and features
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetToDefaults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={fetchPlans}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Important Notes</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-200 mt-2 space-y-1 list-disc list-inside">
                <li>Changes take effect immediately on the pricing page</li>
                <li>Existing subscriptions are NOT affected until they upgrade/downgrade</li>
                <li>Price must be in cents (e.g., 2900 = $29.00)</li>
                <li>Remember to update Stripe product prices separately</li>
                <li>Features support markdown formatting</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DEFAULT_PLANS.map((planKey) => {
          const plan = plans.find(p => p.plan === planKey)
          const isEditing = editingPlan?.plan === planKey

          return (
            <Card key={planKey} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {plan?.name || planKey}
                      {plan?.popular && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </CardTitle>
                    <CardDescription>{plan?.description || 'No description'}</CardDescription>
                  </div>
                  <Badge variant={plan ? 'default' : 'secondary'}>
                    {plan ? 'Configured' : 'Default'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isEditing ? (
                  <>
                    {/* View Mode */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="text-2xl font-bold">{plan?.priceDisplay || 'Not set'}</p>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Posts</p>
                          <p className="font-semibold">{plan?.postsLimit || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Users</p>
                          <p className="font-semibold">{plan?.usersLimit || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">AI Credits</p>
                          <p className="font-semibold">{plan?.aiCreditsLimit || 0}</p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Features</p>
                        <ul className="text-sm space-y-1">
                          {plan?.features?.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                          {(plan?.features?.length || 0) > 3 && (
                            <li className="text-muted-foreground">
                              + {(plan?.features?.length || 0) - 3} more...
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={() => setEditingPlan(plan || {
                        plan: planKey,
                        name: planKey,
                        description: '',
                        price: 0,
                        priceDisplay: 'Free',
                        postsLimit: 0,
                        usersLimit: 0,
                        aiCreditsLimit: 0,
                        features: [],
                        popular: false
                      })}
                    >
                      Edit Plan
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Edit Mode */}
                    <PlanEditForm
                      plan={editingPlan}
                      onSave={handleSavePlan}
                      onCancel={() => setEditingPlan(null)}
                      saving={saving}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// Separate component for edit form
function PlanEditForm({ 
  plan, 
  onSave, 
  onCancel, 
  saving 
}: { 
  plan: PlanConfig
  onSave: (plan: PlanConfig) => void
  onCancel: () => void
  saving: boolean
}) {
  const [formData, setFormData] = useState<PlanConfig>(plan)
  const [featuresText, setFeaturesText] = useState(plan.features?.join('\n') || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Parse features from textarea
    const features = featuresText
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0)

    onSave({
      ...formData,
      features,
      price: parseInt(formData.price.toString()) || 0,
      postsLimit: parseInt(formData.postsLimit.toString()) || 0,
      usersLimit: parseInt(formData.usersLimit.toString()) || 0,
      aiCreditsLimit: parseInt(formData.aiCreditsLimit.toString()) || 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Plan Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Professional"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="For growing businesses"
          required
        />
      </div>

      {/* Price */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price (cents)</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
            placeholder="9900"
            required
          />
          <p className="text-xs text-muted-foreground">
            {formData.price > 0 ? `$${(formData.price / 100).toFixed(2)}` : 'Free'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priceDisplay">Price Display</Label>
          <Input
            id="priceDisplay"
            value={formData.priceDisplay}
            onChange={(e) => setFormData({...formData, priceDisplay: e.target.value})}
            placeholder="$99/month"
            required
          />
        </div>
      </div>

      {/* Limits */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postsLimit">Posts Limit</Label>
          <Input
            id="postsLimit"
            type="number"
            value={formData.postsLimit}
            onChange={(e) => setFormData({...formData, postsLimit: parseInt(e.target.value) || 0})}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="usersLimit">Users Limit</Label>
          <Input
            id="usersLimit"
            type="number"
            value={formData.usersLimit}
            onChange={(e) => setFormData({...formData, usersLimit: parseInt(e.target.value) || 0})}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="aiCreditsLimit">AI Credits</Label>
          <Input
            id="aiCreditsLimit"
            type="number"
            value={formData.aiCreditsLimit}
            onChange={(e) => setFormData({...formData, aiCreditsLimit: parseInt(e.target.value) || 0})}
            required
          />
        </div>
      </div>

      {/* Features */}
      <div className="space-y-2">
        <Label htmlFor="features">Features (one per line)</Label>
        <Textarea
          id="features"
          value={featuresText}
          onChange={(e) => setFeaturesText(e.target.value)}
          placeholder="200 posts per month&#10;10 users&#10;2,000 AI credits"
          rows={6}
          required
        />
        <p className="text-xs text-muted-foreground">
          Each line becomes a feature bullet point
        </p>
      </div>

      {/* Popular Badge */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="popular">Popular Badge</Label>
          <p className="text-xs text-muted-foreground">
            Show "Most Popular" badge on pricing page
          </p>
        </div>
        <Switch
          id="popular"
          checked={formData.popular}
          onCheckedChange={(checked) => setFormData({...formData, popular: checked})}
        />
      </div>

      {/* Stripe Price ID */}
      <div className="space-y-2">
        <Label htmlFor="stripePriceId">Stripe Price ID (optional)</Label>
        <Input
          id="stripePriceId"
          value={formData.stripePriceId || ''}
          onChange={(e) => setFormData({...formData, stripePriceId: e.target.value})}
          placeholder="price_..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Saving...' : 'Save Plan'}
        </Button>
      </div>
    </form>
  )
}
