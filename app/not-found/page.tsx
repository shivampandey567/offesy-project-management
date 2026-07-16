//not-found/page.tsx
'use client'

import { Button } from "@/components/ui/button"
import { ChevronLeft, Link2Off } from "lucide-react"
import Link from "next/link"

const Page = () => {
    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <Link href='/'>
                <Button variant='ghost' className='rounded-full fixed top-5 left-2 md:left-4'><ChevronLeft />Back to app</Button>
            </Link>
            <div className="max-w-md text-center">
                <Link2Off className="mx-auto mb-4 h-10 w-10 text-destructive" />
                <h1 className="text-2xl font-semibold">Workspace not found</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    This workspace doesn&apos;t exist.
                </p>
            </div>
        </div>
    )
}

export default Page