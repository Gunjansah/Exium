import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

interface EnrollmentRequest {
  id: string
  createdAt: string
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
  }
}

interface EnrollmentRequestsProps {
  classId: string
}

export function EnrollmentRequests({ classId }: EnrollmentRequestsProps) {
  const queryClient = useQueryClient()

  const { data: requests, isLoading } = useQuery<{ data: EnrollmentRequest[] }>({
    queryKey: ['enrollment-requests', classId],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/classes/${classId}/enrollments`)
      if (!response.ok) {
        throw new Error('Failed to fetch enrollment requests')
      }
      return response.json()
    },
  })

  const handleRequestMutation = useMutation({
    mutationFn: async ({
      requestId,
      action,
    }: {
      requestId: string
      action: 'APPROVED' | 'REJECTED'
    }) => {
      const response = await fetch(`/api/teacher/classes/${classId}/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, action }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to process enrollment request')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollment-requests', classId] })
      toast({
        title: `Request ${variables.action.toLowerCase()}`,
        description: `Successfully ${variables.action.toLowerCase()} the enrollment request.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!requests?.data?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Pending Requests</CardTitle>
          <CardDescription>
            There are no pending enrollment requests for this class.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Pending Enrollment Requests
        </h2>
        <p className="text-muted-foreground">
          Review and manage student enrollment requests.
        </p>
      </div>

      <div className="grid gap-6">
        {requests.data.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <CardTitle>
                {request.user.firstName && request.user.lastName
                  ? `${request.user.firstName} ${request.user.lastName}`
                  : request.user.email}
              </CardTitle>
              <CardDescription>
                Requested on{' '}
                {new Date(request.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Student Email: {request.user.email}
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() =>
                  handleRequestMutation.mutate({
                    requestId: request.id,
                    action: 'REJECTED',
                  })
                }
                disabled={handleRequestMutation.isPending}
              >
                Reject
              </Button>
              <Button
                onClick={() =>
                  handleRequestMutation.mutate({
                    requestId: request.id,
                    action: 'APPROVED',
                  })
                }
                disabled={handleRequestMutation.isPending}
              >
                {handleRequestMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Approve
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
} 