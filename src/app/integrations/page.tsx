
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import integrationsData from '@/data/integrations.json';
import { CheckCircle, ExternalLink, Home } from 'lucide-react';
import Image from 'next/image';

const iconMap: { [key: string]: string } = {
  'Chrome': '/chrome.svg',
  'Edge': '/edge.svg',
  'Firefox': '/firefox.svg',
  'Safari': '/safari.svg',
  'Gmail': '/gmail.svg',
  'Microsoft Word': '/word.svg'
};

const VesperIcon = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-primary"
        >
        <circle cx="40" cy="40" r="30" className="fill-primary" />
        <circle cx="70" cy="35" r="20" className="fill-primary/70" />
        <circle cx="65" cy="75" r="25" className="fill-accent" />
        <circle cx="80" cy="70" r="10" className="fill-primary" />
    </svg>
);


export default function IntegrationsPage() {
    const { integrations } = integrationsData;

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <VesperIcon />
                        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/" prefetch={false}>
                            <Home className="mr-2 h-4 w-4" />
                            Back to Editor
                        </Link>
                    </Button>
                </div>
            </header>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary">Works Where You Do</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                        Enhance your writing across all your favorite platforms, from browsers to desktop apps.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {integrations.map((integration, index) => (
                        <Card key={index} className="flex flex-col transform hover:-translate-y-1 transition-transform duration-300 shadow-md hover:shadow-xl">
                            <CardHeader className="flex-row items-start gap-4">
                                {iconMap[integration.browser || integration.application || ''] && (
                                     <Image src={iconMap[integration.browser || integration.application || '']} alt={`${integration.browser || integration.application} logo`} width={40} height={40} className="w-10 h-10" />
                                )}
                                <div>
                                    <CardTitle className="text-xl">{integration.browser || integration.application}</CardTitle>
                                    <CardDescription>{integration.platform}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <ul className="space-y-3">
                                    {integration.features.map((feature, fIndex) => (
                                        <li key={fIndex} className="flex items-start gap-3 text-sm">
                                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                {integration.store_url && (
                                    <Button asChild className="w-full">
                                        <a href={integration.store_url} target="_blank" rel="noopener noreferrer">
                                            Get Extension <ExternalLink className="ml-2 h-4 w-4"/>
                                        </a>
                                    </Button>
                                )}
                                {integration.integration_type && (
                                    <Badge variant="secondary" className="w-full justify-center py-2 text-base">
                                        {integration.integration_type}
                                    </Badge>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    );
}

    