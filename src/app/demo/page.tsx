import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Demo - Social Media AI',
  description: 'Try our AI-powered social media management platform',
}

export default function DemoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Demo Page</CardTitle>
          <CardDescription>
            This is a placeholder for the demo page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            The demo feature is coming soon. For now, you can create an account to try the full platform.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/register">
              <Button className="w-full">Create Account</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full">Sign In</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full">Back to Home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
