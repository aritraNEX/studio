
'use client' // Error components must be Client Components
 
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ServerCrash } from 'lucide-react'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
 
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-8">
        <Card className="max-w-lg text-center shadow-2xl shadow-destructive/20">
            <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
                   <ServerCrash className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="text-3xl font-bold">Something went wrong!</CardTitle>
                <CardDescription className="text-lg text-muted-foreground/80">
                    {error.message || 'An unexpected error occurred. Please try again.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Button
                    size="lg"
                    onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                    }
                >
                    Try again
                </Button>
            </CardContent>
        </Card>
      </div>
  )
}
