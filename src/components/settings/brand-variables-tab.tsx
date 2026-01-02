'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Save, Sparkles, Info, RefreshCw, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface BrandVariables {
  companyName?: string
  companyTagline?: string
  targetAudience?: string
  keyProducts?: string
  uniqueValue?: string
  foundedYear?: string
  teamSize?: string
  headquarters?: string
}

export default function BrandVariablesTab() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoExtracting, setAutoExtracting] = useState(false)
  const [variables, setVariables] = useState<BrandVariables>({})
  const [brandDataStatus, setBrandDataStatus] = useState<{
    hasData: boolean
    sectionsCount: number
    lastUpdated?: string
  }>({ hasData: false, sectionsCount: 0 })

  useEffect(() => {
    fetchBrandVariables()
    checkBrandDataStatus()
  }, [])

  const fetchBrandVariables = async () => {
    try {
      const response = await fetch('/api/ai/config')
      if (response.ok) {
        const data = await response.json()
        setVariables({
          companyName: data.companyName || '',
          companyTagline: data.companyTagline || '',
          targetAudience: data.targetAudience || '',
          keyProducts: data.keyProducts || '',
          uniqueValue: data.uniqueValue || '',
          foundedYear: data.foundedYear || '',
          teamSize: data.teamSize || '',
          headquarters: data.headquarters || '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch brand variables:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkBrandDataStatus = async () => {
    try {
      const response = await fetch('/api/brand/scrape')
      if (response.ok) {
        const data = await response.json()
        setBrandDataStatus({
          hasData: data.total > 0,
          sectionsCount: data.total,
          lastUpdated: data.total > 0 ? 'Recently' : undefined
        })
      }
    } catch (error) {
      console.error('Failed to check brand data status:', error)
    }
  }

  const saveBrandVariables = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/ai/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variables),
      })

      if (response.ok) {
        toast({
          title: 'Brand variables saved',
          description: 'AI will now use these specific details in generated content',
        })
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save brand variables',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const autoExtractFromWebsite = async () => {
    if (!brandDataStatus.hasData) {
      toast({
        title: 'No brand data found',
        description: 'Please scrape your website first in Brand Training tab',
        variant: 'destructive',
      })
      return
    }

    setAutoExtracting(true)
    try {
      const response = await fetch('/api/brand/extract-variables', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setVariables(prev => ({
          ...prev,
          ...data.extractedVariables,
        }))
        toast({
          title: 'Variables extracted',
          description: `Extracted ${Object.keys(data.extractedVariables).length} variables from your brand data`,
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to extract')
      }
    } catch (error: any) {
      toast({
        title: 'Extraction failed',
        description: error.message || 'Failed to extract brand variables',
        variant: 'destructive',
      })
    } finally {
      setAutoExtracting(false)
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
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            Brand Variables
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure specific details AI will use in generated content
          </p>
        </div>
        <Button
          onClick={autoExtractFromWebsite}
          disabled={autoExtracting || !brandDataStatus.hasData}
          variant="outline"
          className={!brandDataStatus.hasData ? 'opacity-50 cursor-not-allowed' : ''}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${autoExtracting ? 'animate-spin' : ''}`} />
          {autoExtracting ? 'Extracting...' : 'Auto-Extract from Website'}
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          These variables replace generic placeholders like "[Your Company Name]" with your actual brand details.
          Fill in as many as possible for more personalized content.
        </AlertDescription>
      </Alert>

      {/* Brand Data Status Card */}
      {!brandDataStatus.hasData ? (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <AlertDescription className="ml-2">
            <p className="font-semibold text-yellow-900 mb-2">
              ⚠️ No Brand Training Data Found
            </p>
            <p className="text-yellow-800 mb-3">
              Auto-Extract needs data from your website. Please complete these steps first:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-yellow-800 mb-3">
              <li>Go to <strong>Settings → Brand Training</strong> tab</li>
              <li>Enter your website URL (e.g., https://yourcompany.com)</li>
              <li>Click "Scrape Website" and wait for completion</li>
              <li>Return here and click "Auto-Extract from Website"</li>
            </ol>
            <a 
              href="/dashboard/settings?tab=brand"
              className="inline-flex items-center text-yellow-900 font-semibold hover:underline"
            >
              Go to Brand Training Tab
              <ExternalLink className="h-4 w-4 ml-1" />
            </a>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertDescription className="ml-2">
            <p className="font-semibold text-green-900 mb-1">
              ✅ Brand Training Data Available
            </p>
            <p className="text-green-800">
              Found <strong>{brandDataStatus.sectionsCount} sections</strong> from your website.
              Click "Auto-Extract from Website" to automatically fill in brand variables.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Basic details about your company that AI will reference
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyName"
                placeholder="e.g., TechFlow Solutions"
                value={variables.companyName || ''}
                onChange={(e) => setVariables({ ...variables, companyName: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Your exact company name (most important!)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyTagline">Company Tagline</Label>
              <Input
                id="companyTagline"
                placeholder="e.g., Empowering businesses with AI"
                value={variables.companyTagline || ''}
                onChange={(e) => setVariables({ ...variables, companyTagline: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Your brand's tagline or slogan
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="foundedYear">Founded Year</Label>
              <Input
                id="foundedYear"
                placeholder="e.g., 2020"
                value={variables.foundedYear || ''}
                onChange={(e) => setVariables({ ...variables, foundedYear: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamSize">Team Size</Label>
              <Input
                id="teamSize"
                placeholder="e.g., 50-100 employees"
                value={variables.teamSize || ''}
                onChange={(e) => setVariables({ ...variables, teamSize: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="headquarters">Headquarters</Label>
              <Input
                id="headquarters"
                placeholder="e.g., San Francisco, CA"
                value={variables.headquarters || ''}
                onChange={(e) => setVariables({ ...variables, headquarters: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
          <CardDescription>
            What you offer and who you serve
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetAudience">
              Target Audience <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="targetAudience"
              placeholder="e.g., B2B SaaS companies, tech startups, enterprise organizations"
              rows={2}
              value={variables.targetAudience || ''}
              onChange={(e) => setVariables({ ...variables, targetAudience: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Who are your ideal customers?
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keyProducts">
              Key Products/Services <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="keyProducts"
              placeholder="e.g., AI Analytics Platform, Customer Insights Dashboard, Predictive Forecasting Tool"
              rows={3}
              value={variables.keyProducts || ''}
              onChange={(e) => setVariables({ ...variables, keyProducts: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Main products or services you offer (comma-separated)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="uniqueValue">
              Unique Value Proposition <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="uniqueValue"
              placeholder="e.g., 40% faster implementation than competitors, 24/7 customer support, No-code setup in 5 minutes"
              rows={3}
              value={variables.uniqueValue || ''}
              onChange={(e) => setVariables({ ...variables, uniqueValue: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              What makes you different? Key benefits and differentiators
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Example Preview */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Before vs After</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-semibold text-red-700 mb-1">❌ Before (Generic):</p>
            <p className="italic text-gray-700 bg-white p-3 rounded border border-red-200">
              "At [Your Company Name], we help [target audience] achieve better results with our innovative solutions..."
            </p>
          </div>
          <div>
            <p className="font-semibold text-green-700 mb-1">✅ After (Personalized):</p>
            <p className="italic text-gray-700 bg-white p-3 rounded border border-green-200">
              {variables.companyName 
                ? `"At ${variables.companyName}, we help ${variables.targetAudience || '[your target audience]'} achieve better results with ${variables.keyProducts ? variables.keyProducts.split(',')[0].trim() : 'our innovative solutions'}..."`
                : '"Fill in Company Name to see personalized preview"'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button
          size="lg"
          onClick={saveBrandVariables}
          disabled={saving || !variables.companyName}
        >
          <Save className="h-5 w-5 mr-2" />
          {saving ? 'Saving...' : 'Save Brand Variables'}
        </Button>
      </div>
    </div>
  )
}
