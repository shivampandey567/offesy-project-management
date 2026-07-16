'use client'
import AppHeader from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { useTeamById } from '@/hooks/useTeamById'
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers'
import { useWorkspace } from '@/lib/workspace-context'
import { useUser } from '@clerk/nextjs'
import { Ellipse, Ellipsis, Plus } from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useState } from 'react'
import AddMember from './components/addMember'
import { Avatar, AvatarFallback, getAvatarVariant, getInitials } from '@/components/ui/avatar'
import TextBg from '@/components/ui/textbg'

const Page = () => {
    const { slug } = useParams() as { slug: string }
    const pathname = usePathname()
    const ws = useWorkspace()
    const { user } = useUser()
    const { team, updateTeam } = useTeamById(slug,ws.id)
    const { members, loading: membersLoading } = useWorkspaceMembers(ws.id)

    const WorkspaceMembers = members.map((m) => ({
        userId: m.id,
        clerkId: m.clerkId,
        name: m.name,
        email: m.email || undefined,
    }))

    const teamMembers = (team?.members ?? [])
        .map((tm) => {
            const wm = WorkspaceMembers.find((m) => m.userId === String(tm.userId))
            return wm ? { ...wm, role: tm.role } : null
        })
        .filter((m): m is (typeof WorkspaceMembers)[number] & { role: string } => m !== null)

    const [open, setOpen] = useState(false)

    return (
        <>
            <div className="w-full h-full">
                <AppHeader icon={team?.icon} title={team?.name} onStarClick={() => console.log('hello')} onMenuClick={() => console.log('menu')} onLinkClick={() => console.log('bye')} />
                <div className='flex justify-between p-2 gap-2 overflow-x-auto'>
                    <div className="flex items-center gap-2 min-w-0">
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
                    <Button onClick={() => setOpen(true)} className='rounded-full w-fit bg-card md:mr-2 shrink-0' size='sm' variant='outline'>
                        <Plus /><span className='hidden md:block'>Add a member</span>
                    </Button>
                </div>

                <div className='flex flex-1 flex-col p-2'>
                    <div className='w-full overflow-x-auto'>
                        <table className='w-full text-sm'>
                            <thead>
                                <tr className='text-accent-foreground/80 text-xs text-left'>
                                    <th className='px-4 py-2.5 font-medium'>Name</th>
                                    <th className='px-4 py-2.5 hidden md:block font-medium'>Email</th>
                                    <th className='px-4 py-2.5 font-medium'>Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {membersLoading ? (
                                    <tr>
                                        <td colSpan={3} className='px-4 py-6 text-center text-muted-foreground'>
                                            Loading members…
                                        </td>
                                    </tr>
                                ) : teamMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className='px-4 py-6 text-center text-muted-foreground'>
                                            No members in this team yet
                                        </td>
                                    </tr>
                                ) : (
                                    teamMembers.map((m) => (
                                        <tr key={m.userId} className='hover:bg-sidebar/60 transition-colors'>
                                            <td className='px-4 py-2.5'>
                                                <div className='flex items-center gap-2.5'>
                                                    <Avatar size='sm'>
                                                        <AvatarFallback variant={getAvatarVariant(m.name)}>
                                                            {getInitials(m.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className='flex flex-col leading-tight'>
                                                        <span className='font-medium'>{m.name}</span>
                                                        {m.email && (
                                                            <span className='md:hidden text-muted-foreground text-xs'>
                                                                {m.email.split('@')[0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='px-4 py-2.5 hidden md:block text-muted-foreground'>{m.email ?? '—'}</td>
                                            <td className='px-4 py-2.5'>
                                                <TextBg variant={m.role === 'admin' ? 'blue' : 'teal'}>
                                                    {m.role === 'admin' ? 'admin' : 'member'}
                                                </TextBg>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <AddMember
                open={open}
                onOpenChange={setOpen}
                team={team}
                updateTeam={updateTeam}
                workspaceMembers={WorkspaceMembers}
                membersLoading={membersLoading}
                currentClerkId={user?.id}
            />
        </>
    )
}

export default Page