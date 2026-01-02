'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { ScheduleModal } from '@/components/calendar/schedule-modal'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar.css'

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  status: string
  content?: string
  platform?: string
}

interface Post {
  id: string
  title?: string
  content: string
  status: string
  platform: string
  scheduledAt?: string
  publishedAt?: string
  createdAt: string
}

export default function CalendarPage() {
  const router = useRouter()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/posts')
      if (response.ok) {
        const posts: Post[] = await response.json()
        
        // Convert posts to calendar events
        const calendarEvents: CalendarEvent[] = posts
          .filter(post => post.scheduledAt || post.publishedAt)
          .map(post => {
            const eventDate = post.publishedAt 
              ? new Date(post.publishedAt)
              : post.scheduledAt 
              ? new Date(post.scheduledAt)
              : new Date()
            
            return {
              id: post.id,
              title: post.title || post.content.substring(0, 50) + '...',
              start: eventDate,
              end: new Date(eventDate.getTime() + 60 * 60 * 1000), // 1 hour duration
              status: post.status,
              content: post.content,
              platform: post.platform,
            }
          })
        
        setEvents(calendarEvents)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    setSelectedDate(slotInfo.start)
    setSelectedEvent(null)
    setShowScheduleModal(true)
  }, [])

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    router.push(`/dashboard/posts/${event.id}`)
  }, [router])

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate)
  }, [])

  const handleViewChange = useCallback((newView: View) => {
    setView(newView)
  }, [])

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3b82f6' // blue
    
    switch (event.status) {
      case 'PUBLISHED':
        backgroundColor = '#10b981' // green
        break
      case 'SCHEDULED':
        backgroundColor = '#8b5cf6' // purple
        break
      case 'DRAFT':
        backgroundColor = '#6b7280' // gray
        break
      case 'FAILED':
        backgroundColor = '#ef4444' // red
        break
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600" />
                Content Calendar
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">Plan and schedule your social media posts</p>
            </div>
            <Button onClick={() => {
              setSelectedDate(new Date())
              setSelectedEvent(null)
              setShowScheduleModal(true)
            }} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Schedule Post
            </Button>
          </div>
        </header>

        {/* Legend - Mobile scrollable */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
            <span className="text-xs sm:text-sm font-medium text-gray-700 flex-shrink-0">Status:</span>
            <div className="flex gap-2 sm:gap-3 pb-1">
              <Badge className="bg-green-500 whitespace-nowrap">Published</Badge>
              <Badge className="bg-purple-500 whitespace-nowrap">Scheduled</Badge>
              <Badge className="bg-gray-500 whitespace-nowrap">Draft</Badge>
              <Badge className="bg-red-500 whitespace-nowrap">Failed</Badge>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <main className="flex-1 overflow-hidden p-6">
          <Card className="h-full">
            <CardContent className="p-6 h-full">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                onNavigate={handleNavigate}
                onView={handleViewChange}
                view={view}
                date={date}
                selectable
                eventPropGetter={eventStyleGetter}
                views={['month', 'week', 'day', 'agenda']}
              />
            </CardContent>
          </Card>
        </main>

        {/* Schedule Modal */}
        {showScheduleModal && (
          <ScheduleModal
            isOpen={showScheduleModal}
            onClose={() => setShowScheduleModal(false)}
            selectedDate={selectedDate}
            onScheduled={fetchPosts}
          />
        )}
    </>
  )
}
