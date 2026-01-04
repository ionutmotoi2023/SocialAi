'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  ImageStyle, 
  ImageStylesConfig, 
  BUILTIN_IMAGE_STYLES,
  validateImageStyle 
} from '@/types/image-styles'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  RotateCcw, 
  Star, 
  Eye, 
  EyeOff,
  Loader2,
  Sparkles
} from 'lucide-react'

export function ImageStylesManager() {
  const { toast } = useToast()
  const [styles, setStyles] = useState<ImageStyle[]>([])
  const [defaultStyleId, setDefaultStyleId] = useState<string>('professional')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<ImageStyle>>({})

  useEffect(() => {
    fetchStyles()
  }, [])

  const fetchStyles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/settings/image-styles')
      const data = await response.json()

      if (data.success) {
        setStyles(data.config.styles)
        setDefaultStyleId(data.defaultStyleId || data.config.defaultStyleId)
      }
    } catch (error: any) {
      console.error('Failed to fetch styles:', error)
      toast({
        title: 'Error',
        description: 'Failed to load image styles',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveStyles = async (newStyles: ImageStyle[], newDefaultId: string) => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/settings/image-styles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styles: newStyles,
          defaultStyleId: newDefaultId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save')
      }

      toast({
        title: 'Success!',
        description: data.message || 'Image styles updated',
      })

      setStyles(newStyles)
      setDefaultStyleId(newDefaultId)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save image styles',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddStyle = () => {
    const newStyle: ImageStyle = {
      id: `custom-${Date.now()}`,
      name: 'New Style',
      prompt: 'Describe your image style here...',
      description: '',
      isDefault: false,
      isActive: true,
    }
    setEditingId(newStyle.id)
    setEditForm(newStyle)
    setStyles([...styles, newStyle])
  }

  const handleEditStyle = (style: ImageStyle) => {
    setEditingId(style.id)
    setEditForm({ ...style })
  }

  const handleSaveEdit = async () => {
    if (!editingId) return

    const validationError = validateImageStyle(editForm)
    if (validationError) {
      toast({
        title: 'Validation Error',
        description: validationError,
        variant: 'destructive',
      })
      return
    }

    const updatedStyles = styles.map(s =>
      s.id === editingId ? { ...s, ...editForm } : s
    )

    await saveStyles(updatedStyles, defaultStyleId)
    setEditingId(null)
    setEditForm({})
  }

  const handleCancelEdit = () => {
    // If it's a new style that wasn't saved, remove it
    if (editForm.id && editForm.id.startsWith('custom-')) {
      const existingSaved = styles.find(s => s.id === editForm.id && s.name !== 'New Style')
      if (!existingSaved) {
        setStyles(styles.filter(s => s.id !== editForm.id))
      }
    }
    setEditingId(null)
    setEditForm({})
  }

  const handleDeleteStyle = async (id: string) => {
    if (id === defaultStyleId) {
      toast({
        title: 'Cannot Delete',
        description: 'Cannot delete the default style. Set another style as default first.',
        variant: 'destructive',
      })
      return
    }

    const newStyles = styles.filter(s => s.id !== id)
    await saveStyles(newStyles, defaultStyleId)
  }

  const handleToggleActive = async (id: string) => {
    const updatedStyles = styles.map(s =>
      s.id === id ? { ...s, isActive: !s.isActive } : s
    )
    await saveStyles(updatedStyles, defaultStyleId)
  }

  const handleSetDefault = async (id: string) => {
    await saveStyles(styles, id)
  }

  const handleResetToDefaults = async () => {
    if (!confirm('Reset all image styles to built-in defaults? Your custom styles will be lost.')) {
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/settings/image-styles/reset', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset')
      }

      toast({
        title: 'Reset Complete',
        description: data.message || 'Image styles reset to defaults',
      })

      await fetchStyles()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset styles',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Image Generation Styles
            </CardTitle>
            <CardDescription className="mt-2">
              Customize how AI generates images for your posts. Add, edit, or remove styles to match your brand aesthetic.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToDefaults}
              disabled={isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button
              size="sm"
              onClick={handleAddStyle}
              disabled={isSaving}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Style
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {styles.map((style) => {
            const isEditing = editingId === style.id
            const isBuiltIn = BUILTIN_IMAGE_STYLES.some(b => b.id === style.id)

            return (
              <div
                key={style.id}
                className={`p-4 border rounded-lg ${
                  style.id === defaultStyleId
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-gray-200'
                } ${!style.isActive ? 'opacity-60' : ''}`}
              >
                {isEditing ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <Input
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Style name (e.g., Lifestyle)"
                      className="font-semibold"
                    />
                    <Textarea
                      value={editForm.prompt || ''}
                      onChange={(e) => setEditForm({ ...editForm, prompt: e.target.value })}
                      placeholder="DALL-E prompt instructions..."
                      rows={3}
                      className="text-sm"
                    />
                    <Input
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="User-friendly description (optional)"
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{style.name}</h3>
                          {style.id === defaultStyleId && (
                            <Badge className="bg-blue-500">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                          {isBuiltIn && (
                            <Badge variant="secondary">Built-in</Badge>
                          )}
                          {!style.isActive && (
                            <Badge variant="outline">Disabled</Badge>
                          )}
                        </div>
                        {style.description && (
                          <p className="text-sm text-gray-600 mb-2">{style.description}</p>
                        )}
                        <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                          {style.prompt}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-4">
                        {style.id !== defaultStyleId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSetDefault(style.id)}
                            disabled={isSaving}
                            title="Set as default"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(style.id)}
                          disabled={isSaving}
                          title={style.isActive ? 'Disable' : 'Enable'}
                        >
                          {style.isActive ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditStyle(style)}
                          disabled={isSaving}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {!isBuiltIn && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteStyle(style.id)}
                            disabled={isSaving}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {styles.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No image styles configured yet.</p>
            <Button
              className="mt-4"
              onClick={handleAddStyle}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Style
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
