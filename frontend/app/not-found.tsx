'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tv2 } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex items-center gap-3 mb-4 text-primary">
        <Tv2 className="h-8 w-8" />
        <span className="text-2xl font-bold">Streamlet</span>
      </div>

      <h1 className="text-6xl font-extrabold tracking-tight text-foreground mb-2">404</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Whoops! The page you're looking for doesn't exist.
      </p>

      <Button asChild size="lg">
        <Link href="/dashboard">Back to Dashboard</Link>
      </Button>

      <div className="mt-10 text-sm text-muted-foreground">
        Or go to <Link href="/" className="underline hover:text-primary">Home</Link>
      </div>
    </div>
  )
}
