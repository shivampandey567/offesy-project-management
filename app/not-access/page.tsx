//not-access/page.tsx
'use client'
import { Button } from "@/components/ui/button"
import { ChevronLeft, ShieldX } from "lucide-react"
import Link from "next/link"

const Page = () => {
    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <Link href='/'>
                <Button variant='ghost' className='rounded-full fixed top-5 left-2 md:left-4'><ChevronLeft />Back to app</Button>
            </Link>
            <div className="max-w-md text-center flex flex-col items-center gap-4">
                <ShieldX className="h-10 w-10 text-destructive" />
                <h1 className="text-2xl font-semibold">Access denied</h1>
                <p className="text-sm text-muted-foreground">
                    You don't have access to this workspace.
                </p>
                <p className="text-sm text-muted-foreground">
                    Contact the workspace admin to get invited.
                </p>
            </div>
        </div>
    )
}

export default Page