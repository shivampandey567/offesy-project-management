'use client'
import AppHeader from '@/components/app-header'
import IssueCard from '@/components/issue-card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, getAvatarVariant, getInitials } from '@/components/ui/avatar'
import { useProjectById } from '@/hooks/useProjectById'
import { useIssues } from '@/hooks/useIssues'
import { useTeams } from '@/hooks/useTeams'
import { useWorkspace } from '@/lib/workspace-context'
import { AlertCircle, Calendar, Circle, CircleCheck, Eye, UserCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import TextBg from '@/components/ui/textbg'
import { Skeleton } from '@/components/ui/skeleton'

const MARKUP_ICONS: Record<string, any> = {
    'Task': CircleCheck,
    'To do': Circle,
    'Issue': AlertCircle,
    'Review': Eye,
}

const Page = () => {
    const { id } = useParams() as { id: string }
    const ws = useWorkspace()
    const router = useRouter()
    const pathname = usePathname()
    const { project, loading: projectLoading } = useProjectById(id)
    const { teams } = useTeams(ws.id)
    const { issues, loading: issuesLoading } = useIssues(project?.teamId?.[0], id)

    return (
        <div className="w-full h-full">
            <AppHeader
                title={project?.name}
                onStarClick={() => console.log('hello')}
                onMenuClick={() => console.log('menu')}
                onLinkClick={()=>console.log('hello')}
            />
            <div className='flex flex-1 flex-col gap-4 p-2'>
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

                <div className='w-full overflow-x-auto'>
                    <table className='min-w-full text-sm'>
                        <tbody>
                            {projectLoading || issuesLoading ? (
                                <tr>
                                    <td className='flex flex-col gap-2 py-4 px-2'>
                                        <Skeleton className='h-8 w-full rounded-md'></Skeleton>
                                        <Skeleton className='h-8 w-full rounded-md'></Skeleton>
                                        <Skeleton className='h-8 w-full rounded-md'></Skeleton>
                                        <Skeleton className='h-8 w-full rounded-md'></Skeleton>
                                        <Skeleton className='h-8 w-full rounded-md'></Skeleton>
                                        <Skeleton className='h-8 w-full rounded-md'></Skeleton>
                                    </td>
                                </tr>
                            ) : !project ? (
                                <tr>
                                    <td className='px-4 py-6 text-center text-muted-foreground'>
                                        Project not found
                                    </td>
                                </tr>
                            ) : issues.length === 0 ? (
                                <tr>
                                    <td className='px-4 py-6 text-center text-muted-foreground'>
                                        No issues yet
                                    </td>
                                </tr>
                            ) : (
                                issues.map((issue) => {
                                    const MarkupIcon = MARKUP_ICONS[issue.markup] ?? CircleCheck

                                    return (
                                        <tr onClick={() => router.push(`/${ws.url}/issue/${issue._id}`)} key={issue._id} className='hover:bg-sidebar/60 transition-colors cursor-pointer'>
                                            <td className='pl-2 md:px-4 py-2.5 w-6'>
                                                <MarkupIcon size={16} className='text-muted-foreground' />
                                            </td>
                                            <td className='px-4 py-2.5 max-w-50 md:w-full'>
                                                <span className='truncate line-clamp-1'>{issue.title}</span>
                                            </td>
                                            <td>
                                                <TextBg size='sm' variant='purple' className='rounded-full'>
                                                    {issue.status}
                                                </TextBg>
                                            </td>
                                            <td className='px-4 lg:px-8 xl:px-12 py-2.5 hidden lg:flex text-xs items-center mt-1 gap-1 text-muted-foreground whitespace-nowrap'>
                                                <Calendar size={12} />
                                                {issue.dueDate
                                                    ? new Date(issue.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                                    : ''}
                                            </td>
                                            <td className='px-4 py-2.5 text-right'>
                                                {!issue.assignee ? (
                                                    <span className='flex justify-end text-muted-foreground'>
                                                        <UserCircle size={18} strokeWidth={1.5} />
                                                    </span>
                                                ) : (
                                                    <div className='flex items-center justify-end -space-x-3'>
                                                        <Avatar size='sm'>
                                                            <AvatarFallback variant={getAvatarVariant(issue.assignee?.name)}>
                                                                {getInitials(issue.assignee?.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default Page