
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
          <CardDescription>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">1. Agreement to Terms</h2>
            <p className="text-muted-foreground">
              By using our application, Vesper, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the application. This is a placeholder document and is not legally binding.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">2. Use of the Service</h2>
            <p className="text-muted-foreground">
              You agree to use our service in compliance with all applicable laws and regulations and not for any unlawful purpose. You are responsible for any content you provide and the consequences of its use.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">3. Intellectual Property</h2>
            <p className="text-muted-foreground">
              The service and its original content, features, and functionality are and will remain the exclusive property of Vesper and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Vesper.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">4. Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </div>
           <div className="text-center mt-8">
            <Button asChild>
                <Link href="/">Back to Home</Link>
            </Button>
           </div>
        </CardContent>
      </Card>
    </div>
  )
}
