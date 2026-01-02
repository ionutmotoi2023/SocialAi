'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ImageUpload } from '@/components/upload/image-upload'
import { useToast } from '@/hooks/use-toast'
import { 
  Upload, Image as ImageIcon, Trash2, Star,
  Download, Eye, EyeOff, Sparkles
} from 'lucide-react'

interface BrandAsset {
  id: string
  name: string
  type: string
  fileUrl: string
  fileSize: number
  mimeType: string
  isDefault: boolean
  watermarkSettings?: {
    enabled: boolean
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
    opacity: number
    scale: number
  }
  createdAt: string
}

export function BrandAssetsTab() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [assets, setAssets] = useState<BrandAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [assetName, setAssetName] = useState('')

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/brand/assets')
      if (response.ok) {
        const data = await response.json()
        setAssets(data.assets || [])
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (uploadedImages.length === 0) {
      toast({
        title: 'No images selected',
        description: 'Please upload at least one image',
        variant: 'destructive'
      })
      return
    }

    if (!assetName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for your brand asset',
        variant: 'destructive'
      })
      return
    }

    setUploading(true)
    try {
      const response = await fetch('/api/brand/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: assetName,
          type: 'logo',
          fileUrl: uploadedImages[0],
          mimeType: 'image/png',
          fileSize: 0,
          watermarkSettings: {
            enabled: true,
            position: 'bottom-right',
            opacity: 0.7,
            scale: 0.2
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAssets([data.asset, ...assets])
        setUploadedImages([])
        setAssetName('')
        toast({
          title: 'Asset uploaded',
          description: 'Your brand asset has been saved successfully'
        })
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to save brand asset',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }

  const setDefaultAsset = async (assetId: string) => {
    try {
      const response = await fetch(`/api/brand/assets/${assetId}/default`, {
        method: 'PUT'
      })

      if (response.ok) {
        setAssets(assets.map(a => ({
          ...a,
          isDefault: a.id === assetId
        })))
        toast({
          title: 'Default asset updated',
          description: 'This asset will now be used by default'
        })
      }
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Failed to set default asset',
        variant: 'destructive'
      })
    }
  }

  const deleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return

    try {
      const response = await fetch(`/api/brand/assets/${assetId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAssets(assets.filter(a => a.id !== assetId))
        toast({
          title: 'Asset deleted',
          description: 'Brand asset has been removed'
        })
      }
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete asset',
        variant: 'destructive'
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Asset
          </CardTitle>
          <CardDescription>
            Add logos, watermarks, or other brand images to your library
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Asset Name
            </label>
            <Input
              placeholder="e.g., Company Logo, Watermark"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Upload Image
            </label>
            <ImageUpload
              maxFiles={1}
              onUpload={setUploadedImages}
            />
          </div>

          <Button 
            onClick={handleUpload}
            disabled={uploading || uploadedImages.length === 0 || !assetName.trim()}
            className="w-full"
          >
            {uploading ? 'Uploading...' : 'Save Brand Asset'}
          </Button>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Your Brand Assets</h2>
        
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading assets...
          </div>
        ) : assets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No brand assets yet</h3>
              <p className="text-muted-foreground">
                Upload your first logo or brand image to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <Card key={asset.id} className="overflow-hidden">
                <div className="aspect-video bg-muted relative">
                  <img
                    src={asset.fileUrl}
                    alt={asset.name}
                    className="object-contain w-full h-full p-4"
                  />
                  {asset.isDefault && (
                    <Badge className="absolute top-2 right-2 bg-yellow-500">
                      <Star className="h-3 w-3 mr-1" />
                      Default
                    </Badge>
                  )}
                </div>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <h3 className="font-semibold">{asset.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {asset.type} • {formatFileSize(asset.fileSize)}
                    </p>
                  </div>

                  {asset.watermarkSettings && (
                    <div className="flex items-center gap-2 text-sm">
                      {asset.watermarkSettings.enabled ? (
                        <Badge variant="outline" className="gap-1">
                          <Eye className="h-3 w-3" />
                          Watermark: {asset.watermarkSettings.position}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <EyeOff className="h-3 w-3" />
                          Watermark disabled
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!asset.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultAsset(asset.id)}
                        className="flex-1"
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteAsset(asset.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Watermark Settings Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            About Watermarks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Watermarks are automatically applied to your posts when you upload images.
            You can customize the position, opacity, and size for each brand asset.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Positions</h4>
              <ul className="space-y-1">
                <li>• Top Left / Top Right</li>
                <li>• Bottom Left / Bottom Right</li>
                <li>• Center</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Settings</h4>
              <ul className="space-y-1">
                <li>• Opacity: 0-100%</li>
                <li>• Scale: 10-50%</li>
                <li>• Auto-apply on upload</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
