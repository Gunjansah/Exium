'use client'

import { useQuery } from '@tanstack/react-query'
import { HelpCircle, Search, MessageCircle, Book, ExternalLink } from 'lucide-react'
import StudentDashboardLayout from '@/components/student-dashboard/layout/StudentDashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
}

interface HelpArticle {
  id: string
  title: string
  description: string
  url: string
}

interface HelpData {
  faqs: FAQ[]
  articles: HelpArticle[]
}

export default function HelpPage() {
  const { toast } = useToast()
  const { data: helpData, isLoading } = useQuery<HelpData>({
    queryKey: ['help'],
    queryFn: async () => {
      const response = await fetch('/api/student/help')
      if (!response.ok) {
        throw new Error('Failed to fetch help data')
      }
      return response.json()
    },
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  })

  const handleContactSupport = async () => {
    try {
      const response = await fetch('/api/student/help/contact', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to contact support')
      }

      toast({
        title: 'Success',
        description: 'Support ticket created. We will get back to you soon.',
      })
    } catch (error) {
      console.error('Error contacting support:', error)
      toast({
        title: 'Error',
        description: 'Failed to contact support',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <StudentDashboardLayout>
        <div className="space-y-6 animate-in fade-in-50">
          <div className="flex flex-col space-y-4">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 rounded-lg border bg-card animate-pulse" />
            ))}
          </div>
        </div>
      </StudentDashboardLayout>
    )
  }

  return (
    <StudentDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
          <p className="text-muted-foreground">
            Find answers to your questions and get support
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search help articles..."
            className="max-w-sm"
          />
          <Button>
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-4 w-4" />
                <CardTitle>Frequently Asked Questions</CardTitle>
              </div>
              <CardDescription>
                Common questions and answers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {helpData?.faqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Book className="h-4 w-4" />
                <CardTitle>Help Articles</CardTitle>
              </div>
              <CardDescription>
                Detailed guides and tutorials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {helpData?.articles.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-start justify-between space-x-4"
                  >
                    <div>
                      <h4 className="font-medium">{article.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {article.description}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={article.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
                <CardTitle>Still Need Help?</CardTitle>
              </div>
              <CardDescription>
                Contact our support team for assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Our support team is available Monday to Friday, 9am to 5pm.
                We typically respond within 24 hours.
              </p>
              <div className="flex items-center space-x-4">
                <Button onClick={handleContactSupport}>
                  Contact Support
                </Button>
                <Button variant="outline" asChild>
                  <a href="mailto:support@example.com">
                    Send Email
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentDashboardLayout>
  )
} 