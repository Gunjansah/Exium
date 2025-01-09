'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { FileText, Download, Book, Video, Link as LinkIcon } from 'lucide-react'
import StudentDashboardLayout from '@/components/student-dashboard/layout/StudentDashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'

interface Resource {
  id: string
  title: string
  description: string | null
  type: 'DOCUMENT' | 'VIDEO' | 'LINK' | 'BOOK'
  url: string
  fileSize?: number
  uploadedAt: string
  class: {
    name: string
  }
}

interface ResourcesData {
  documents: Resource[]
  videos: Resource[]
  links: Resource[]
  books: Resource[]
}

export default function ResourcesPage() {
  const { toast } = useToast()
  const { data: resources, isLoading } = useQuery<ResourcesData>({
    queryKey: ['resources'],
    queryFn: async () => {
      const response = await fetch('/api/student/resources')
      if (!response.ok) {
        throw new Error('Failed to fetch resources')
      }
      return response.json()
    },
    staleTime: 60000,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
  })

  const handleDownload = async (resource: Resource) => {
    try {
      const response = await fetch(`/api/student/resources/${resource.id}/download`)
      if (!response.ok) {
        throw new Error('Failed to download resource')
      }
      
      // Create a download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = resource.title
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Success',
        description: 'Resource downloaded successfully',
      })
    } catch (error) {
      console.error('Error downloading resource:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download resource',
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
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
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
          <h1 className="text-3xl font-bold tracking-tight">Learning Resources</h1>
          <p className="text-muted-foreground">
            Access study materials and resources
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search resources..."
            className="max-w-sm"
          />
        </div>

        <Tabs defaultValue="documents" className="space-y-4">
          <TabsList>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {resources?.documents.map((resource) => (
                <Card key={resource.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle>{resource.title}</CardTitle>
                        <CardDescription>{resource.class.name}</CardDescription>
                      </div>
                      <Badge variant="secondary">Document</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        {resource.description}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{resource.fileSize ? `${(resource.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {format(new Date(resource.uploadedAt), 'PPp')}
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handleDownload(resource)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {resources?.documents.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Documents</h3>
                  <p className="text-muted-foreground">
                    No documents have been uploaded yet.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="videos" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {resources?.videos.map((resource) => (
                <Card key={resource.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle>{resource.title}</CardTitle>
                        <CardDescription>{resource.class.name}</CardDescription>
                      </div>
                      <Badge variant="secondary">Video</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        {resource.description}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(resource.uploadedAt), 'PPp')}
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => window.open(resource.url, '_blank')}
                      >
                        <Video className="mr-2 h-4 w-4" />
                        Watch Video
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {resources?.videos.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <Video className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Videos</h3>
                  <p className="text-muted-foreground">
                    No video resources have been added yet.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="books" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {resources?.books.map((resource) => (
                <Card key={resource.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle>{resource.title}</CardTitle>
                        <CardDescription>{resource.class.name}</CardDescription>
                      </div>
                      <Badge variant="secondary">Book</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        {resource.description}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(resource.uploadedAt), 'PPp')}
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handleDownload(resource)}
                      >
                        <Book className="mr-2 h-4 w-4" />
                        Download Book
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {resources?.books.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <Book className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Books</h3>
                  <p className="text-muted-foreground">
                    No books have been added yet.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="links" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {resources?.links.map((resource) => (
                <Card key={resource.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle>{resource.title}</CardTitle>
                        <CardDescription>{resource.class.name}</CardDescription>
                      </div>
                      <Badge variant="secondary">Link</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        {resource.description}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(resource.uploadedAt), 'PPp')}
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => window.open(resource.url, '_blank')}
                      >
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Open Link
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {resources?.links.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <LinkIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Links</h3>
                  <p className="text-muted-foreground">
                    No external links have been added yet.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </StudentDashboardLayout>
  )
} 