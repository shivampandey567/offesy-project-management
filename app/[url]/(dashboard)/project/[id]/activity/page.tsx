'use client'
import AppHeader from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { useProjectById } from '@/hooks/useProjectById'
import { useWorkspace } from '@/lib/workspace-context'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'

const Page = () => {
    const { id } = useParams() as { id: string }
    const ws = useWorkspace()
    const router = useRouter()
    const pathname = usePathname()
    const { project } = useProjectById(id)
    return (
        <div className="w-full h-full">
            <AppHeader title={project?.name} onStarClick={() => (console.log('hello'))} onMenuClick={() => console.log('menu')} onLinkClick={() => console.log('bye')} />
            <div className='flex flex-1 flex-col gap-8 p-2'>
                <div className="flex items-center gap-2">
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
            </div>
        </div>
    )
}

export default Page