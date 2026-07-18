'use client'
import { useState } from 'react'
import AppHeader from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useProjectById } from '@/hooks/useProjectById'
import { useWorkspace } from '@/lib/workspace-context'
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import CommentsSection from '@/components/CommentsSection'

const Page = () => {
    const { id } = useParams() as { id: string }
    const ws = useWorkspace()
    const router = useRouter()
    const pathname = usePathname()
    const { project } = useProjectById(id)
    const { members } = useWorkspaceMembers(ws.id)
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

    const WorkspaceMembers = members.map((m) => ({
        userId: m.id,
        clerkId: m.clerkId,
        name: m.name,
        email: m.email || undefined,
    }))

    return (
        <div className="w-full h-full flex flex-col">
            <AppHeader title={project?.name} onStarClick={() => (console.log('hello'))} onMenuClick={() => console.log('menu')} onLinkClick={() => console.log('bye')} />
            <div className="flex items-center p-2 gap-2">
                <Link href={`/${ws.url}/project/${id}/overview`}>
                    <Button variant='outline' size='sm' className={`rounded-full text-muted-foreground ${pathname === `/${ws.url}/project/${id}/overview` ? 'bg-sidebar text-accent-foreground' : ''}`}>Overview</Button>
                </Link>
                <Link href={`/${ws.url}/project/${id}/activity`}>
                    <Button variant='outline' size='sm' className={`rounded-full text-muted-foreground ${pathname === `/${ws.url}/project/${id}/activity` ? 'bg-sidebar text-accent-foreground' : ''}`}>Activity</Button>
                </Link>
                <Link href={`/${ws.url}/project/${id}/issues`}>
                    <Button variant='outline' size='sm' className={`rounded-full text-muted-foreground ${pathname === `/${ws.url}/project/${id}/issues` ? 'bg-sidebar text-accent-foreground' : ''}`}>Issues</Button>
                </Link>
            </div>
            <div className='flex flex-col flex-1 px-2 items-center'>
                    <div className="min-w-0 max-w-full lg:w-3xl">
                        <CommentsSection
                            targetType='project'
                            targetId={id}
                            workspaceId={ws.id}
                            members={WorkspaceMembers}
                            onImageClick={(url) => setLightboxUrl(url)}
                        />
                    </div>
            </div>

            {lightboxUrl && (
                <div
                    onClick={() => setLightboxUrl(null)}
                    className='fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6'
                >
                    <button
                        type='button'
                        onClick={() => setLightboxUrl(null)}
                        className='absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20'
                    >
                        <X size={18} />
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={lightboxUrl}
                        alt='attachment preview'
                        onClick={(e) => e.stopPropagation()}
                        className='max-h-full max-w-full rounded-lg object-contain'
                    />
                </div>
            )}
        </div>
    )
}

export default Page