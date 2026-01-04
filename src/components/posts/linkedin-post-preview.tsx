'use client'

import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ThumbsUp, MessageCircle, Share2, Send, MoreHorizontal } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'

interface LinkedInPostPreviewProps {
  content: string
  mediaUrls?: string[]
  className?: string
}

export function LinkedInPostPreview({ content, mediaUrls = [], className = '' }: LinkedInPostPreviewProps) {
  const { data: session } = useSession()
  
  // Format content with line breaks
  const formattedContent = content.split('\n').map((line, i) => (
    <span key={i}>
      {line}
      {i < content.split('\n').length - 1 && <br />}
    </span>
  ))

  return (
    <Card className={`overflow-hidden ${className}`}>
      {/* LinkedIn Post Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {/* User Avatar */}
            <Avatar className="h-12 w-12 bg-blue-600 flex items-center justify-center text-white font-semibold">
              {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            
            {/* User Info */}
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-gray-900">
                {session?.user?.name || 'Your Name'}
              </h3>
              <p className="text-xs text-gray-600">
                {session?.user?.email || 'your.email@example.com'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Just now • 🌐
              </p>
            </div>
          </div>
          
          {/* More Options */}
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
          {formattedContent}
        </div>
      </div>

      {/* Media Gallery */}
      {mediaUrls.length > 0 && (
        <div className="relative">
          {mediaUrls.length === 1 && (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <Image
                src={mediaUrls[0]}
                alt="Post media"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          
          {mediaUrls.length === 2 && (
            <div className="grid grid-cols-2 gap-0.5">
              {mediaUrls.map((url, index) => (
                <div key={index} className="relative w-full" style={{ paddingBottom: '75%' }}>
                  <Image
                    src={url}
                    alt={`Post media ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}
          
          {mediaUrls.length === 3 && (
            <div className="grid grid-cols-2 gap-0.5">
              <div className="relative w-full col-span-2" style={{ paddingBottom: '37.5%' }}>
                <Image
                  src={mediaUrls[0]}
                  alt="Post media 1"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              {mediaUrls.slice(1, 3).map((url, index) => (
                <div key={index} className="relative w-full" style={{ paddingBottom: '75%' }}>
                  <Image
                    src={url}
                    alt={`Post media ${index + 2}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}
          
          {mediaUrls.length >= 4 && (
            <div className="grid grid-cols-2 gap-0.5">
              {mediaUrls.slice(0, 4).map((url, index) => (
                <div key={index} className="relative w-full" style={{ paddingBottom: '75%' }}>
                  <Image
                    src={url}
                    alt={`Post media ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {/* Show "+X more" overlay for 4th image if there are more */}
                  {index === 3 && mediaUrls.length > 4 && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                      <span className="text-white text-2xl font-semibold">
                        +{mediaUrls.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LinkedIn Actions */}
      <div className="border-t">
        {/* Stats */}
        <div className="px-4 py-2 text-xs text-gray-600 flex items-center justify-between">
          <span>0 reactions</span>
          <span>0 comments</span>
        </div>
        
        {/* Action Buttons */}
        <div className="border-t px-2 py-1 flex items-center justify-around">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 text-gray-600 hover:bg-gray-50 gap-2"
          >
            <ThumbsUp className="h-4 w-4" />
            <span className="text-sm font-medium">Like</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 text-gray-600 hover:bg-gray-50 gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Comment</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 text-gray-600 hover:bg-gray-50 gap-2"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-sm font-medium">Repost</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 text-gray-600 hover:bg-gray-50 gap-2"
          >
            <Send className="h-4 w-4" />
            <span className="text-sm font-medium">Send</span>
          </Button>
        </div>
      </div>
    </Card>
  )
}
