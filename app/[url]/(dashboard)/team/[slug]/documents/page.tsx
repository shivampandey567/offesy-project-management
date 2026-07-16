'use client'
import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/lib/workspace-context'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import React from 'react'

const Page = () => {
    const { slug } = useParams() as { slug: string }
    const pathname = usePathname()
    const ws = useWorkspace()
    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex items-center gap-2">
                <Link href={`/${ws.url}/team/${slug}/overview`}>
                    <Button variant='outline' size='sm' className={`rounded-full text-muted-foreground ${pathname === `/${ws.url}/team/${slug}/overview` ? 'bg-sidebar text-accent-foreground' : ''}`}>Overview</Button>
                </Link>
                <Link href={`/${ws.url}/team/${slug}/documents`}>
                    <Button variant='outline' size='sm' className={`rounded-full text-muted-foreground ${pathname === `/${ws.url}/team/${slug}/documents` ? 'bg-sidebar text-accent-foreground' : ''}`}>Documents</Button>
                </Link>
                <Link href={`/${ws.url}/team/${slug}/members`}>
                    <Button variant='outline' size='sm' className={`rounded-full text-muted-foreground ${pathname === `/${ws.url}/team/${slug}/members` ? 'bg-sidebar text-accent-foreground' : ''}`}>Members</Button>
                </Link>
            </div>
        </div>
    )
}

export default Page