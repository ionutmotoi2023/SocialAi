'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, Zap, Users, BarChart3, Smartphone, Globe } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: <Bot className="h-8 w-8" />,
      title: "AI-Powered Content",
      description: "Generate engaging posts with GPT-4, Claude 3, and Gemini Pro"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Auto-Pilot Mode",
      description: "100% automated posting with smart confidence scoring"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Multi-Tenant SaaS",
      description: "Scalable platform for agencies and enterprise teams"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "AI Learning Engine",
      description: "Continuous improvement from your feedback and preferences"
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "Mobile-First Design",
      description: "Optimized experience for mobile devices and tablets"
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "LinkedIn Integration",
      description: "Seamless OAuth integration with professional networking"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          {/* Logo Only - No Text */}
          <Link href="/" className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="AI MINDLOOP SRL" 
              width={56} 
              height={56}
              className="rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            />
          </Link>
          
          {/* CTA Buttons */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/login">
              <Button 
                variant="outline" 
                size="lg"
                className="font-semibold border-2 hover:bg-blue-50 hover:border-blue-600 transition-all"
              >
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button 
                size="lg"
                className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge className="mb-4" variant="secondary">
          🚀 Powered by AI MINDLOOP SRL
        </Badge>
        
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Automate Your Social Media
          <br />
          with AI-Powered Intelligence
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Create, schedule, and optimize your social media content with advanced AI that learns from your preferences. 
          Generate 100+ posts per week with zero effort.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8 py-3">
              Start Free Trial
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline" className="text-lg px-8 py-3">
              Watch Demo
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">100+</div>
            <div className="text-gray-600">Posts Generated Daily</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">95%</div>
            <div className="text-gray-600">AI Accuracy Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">80%</div>
            <div className="text-gray-600">Time Savings</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Social Media?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of businesses already using AI to scale their social media presence
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Start Your Free Trial Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Image 
                src="/logo.png" 
                alt="AI MINDLOOP SRL" 
                width={32} 
                height={32}
                className="rounded-lg"
              />
              <span className="font-semibold">AI MINDLOOP SRL</span>
            </div>
            <div className="flex gap-6 mb-4 md:mb-0">
              <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
            <div className="text-sm text-gray-400">
              © 2026 AI MINDLOOP SRL. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}