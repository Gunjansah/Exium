'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface ErrorProps {
  error: Error
  reset: () => void
}

export function Error({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    </div>
  )
}

export function NotFound() {
  const router = useRouter()

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Not Found</h2>
        <p className="text-muted-foreground">
          The resource you're looking for doesn't exist.
        </p>
      </div>
      <Button variant="outline" onClick={() => router.back()}>
        Go back
      </Button>
    </div>
  )
}
