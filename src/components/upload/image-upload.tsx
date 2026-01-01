'use client'

import { useState, useRef } from 'react'
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface ImageUploadProps {
  onUpload: (urls: string[]) => void
  maxFiles?: number
  existingImages?: string[]
}

export function ImageUpload({ onUpload, maxFiles = 5, existingImages = [] }: ImageUploadProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<string[]>(existingImages)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrls, setPreviewUrls] = useState<string[]>(existingImages)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (images.length + files.length > maxFiles) {
      toast({
        title: 'Error',
        description: `You can only upload up to ${maxFiles} images`,
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image`)
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large. Max size is 5MB`)
        }

        // Create FormData
        const formData = new FormData()
        formData.append('file', file)

        // Upload to server
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }

        const data = await response.json()
        return data.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      const newImages = [...images, ...uploadedUrls]
      const newPreviews = [...previewUrls, ...uploadedUrls]

      setImages(newImages)
      setPreviewUrls(newPreviews)
      onUpload(newImages)

      toast({
        title: 'Success',
        description: `${uploadedUrls.length} image(s) uploaded successfully`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload images',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = previewUrls.filter((_, i) => i !== index)
    setImages(newImages)
    setPreviewUrls(newPreviews)
    onUpload(newImages)
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={isUploading || images.length >= maxFiles}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Images ({images.length}/{maxFiles})
            </>
          )}
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          Max {maxFiles} images, 5MB each. Supported: JPG, PNG, GIF, WebP
        </p>
      </div>

      {/* Image Previews */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {previewUrls.map((url, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors"
            >
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveImage(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {previewUrls.length === 0 && !isUploading && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
          onClick={handleButtonClick}
        >
          <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium mb-2">Click to upload images</p>
          <p className="text-sm text-gray-500">or drag and drop</p>
        </div>
      )}
    </div>
  )
}
