'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Building2, Save, Globe, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CompanyProfile {
  name: string
  domain?: string
  website?: string
  industry?: string
  description?: string
}

export default function CompanyProfileTab() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<CompanyProfile>({
    name: '',
    domain: '',
    website: '',
    industry: '',
    description: '',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/settings/company-profile')
      if (response.ok) {
        const data = await response.json()
        setProfile({
          name: data.name || '',
          domain: data.domain || '',
          website: data.website || '',
          industry: data.industry || '',
          description: data.description || '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch company profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    if (!profile.name.trim()) {
      toast({
        title: 'Validation error',
        description: 'Company name is required',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/settings/company-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      if (response.ok) {
        toast({
          title: 'Profile saved',
          description: 'Company profile has been updated successfully',
        })
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save company profile',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-500" />
          Company Profile
        </h2>
        <p className="text-muted-foreground mt-1">
          Basic information about your company used across the platform
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This information is used for Brand Variables auto-extraction and throughout the application.
          Make sure to keep it up to date.
        </AlertDescription>
      </Alert>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Basic details about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., TechFlow Solutions"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Your company's official name
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                placeholder="e.g., techflow.com"
                value={profile.domain || ''}
                onChange={(e) => setProfile({ ...profile, domain: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Your company domain (optional)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">
                Website <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Globe className="h-10 w-10 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <Input
                    id="website"
                    placeholder="https://yourcompany.com"
                    value={profile.website || ''}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Used for brand scraping
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              placeholder="e.g., SaaS, E-commerce, Healthcare, etc."
              value={profile.industry || ''}
              onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Your company's industry or sector
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Company Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of what your company does..."
              rows={4}
              value={profile.description || ''}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              A brief overview of your company's mission and services
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Usage Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">How This Information is Used</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800">
          <p>• <strong>Company Name:</strong> Used as fallback for Brand Variables</p>
          <p>• <strong>Website:</strong> Source for Brand Training scraping</p>
          <p>• <strong>Industry:</strong> Helps generate relevant content and target audience</p>
          <p>• <strong>Description:</strong> Provides context to AI for better content generation</p>
          <p className="pt-2 text-blue-900 font-semibold">
            💡 Complete this profile before using Brand Training and Brand Variables features
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={saveProfile}
          disabled={saving || !profile.name.trim()}
        >
          <Save className="h-5 w-5 mr-2" />
          {saving ? 'Saving...' : 'Save Company Profile'}
        </Button>
      </div>
    </div>
  )
}
