
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
          <CardDescription>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">1. Introduction</h2>
            <p className="text-muted-foreground">
              Welcome to Vesper ("we," "our," "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">2. Information We Collect</h2>
            <p className="text-muted-foreground">
              We may collect personal information such as your name, email address, and payment information when you register for an account or use our services. We also collect data you provide directly, such as text for analysis or files you upload.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We use the information we collect to:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Provide, operate, and maintain our application.</li>
                <li>Improve, personalize, and expand our application.</li>
                <li>Understand and analyze how you use our application.</li>
                <li>Process your transactions.</li>
                <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the application, and for marketing and promotional purposes.</li>
              </ul>
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">4. Data Security</h2>
            <p className="text-muted-foreground">
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
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
