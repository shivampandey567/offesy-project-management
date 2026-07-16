'use client'
import AppHeader from '@/components/app-header'
import IssueCard from '@/components/issue-card'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Avatar, AvatarFallback, getAvatarVariant, getInitials } from '@/components/ui/avatar'
import { useTeamById } from '@/hooks/useTeamById'
import { useIssues } from '@/hooks/useIssues'
import { useWorkspace } from '@/lib/workspace-context'
import { AlertCircle, Calendar, Circle, CircleCheck, Eye, ListFilter, Search, Settings2, UserCircle } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import TextBg from '@/components/ui/textbg'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

const MARKUP_ICONS: Record<string, any> = {
    'Task': CircleCheck,
    'To do': Circle,
    'Issue': AlertCircle,
    'Review': Eye,
}

const Page = () => {
    const ws = useWorkspace()
    const { slug } = useParams() as { slug: string }
    const { team, loading: teamLoading } = useTeamById(slug, ws.id)
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const router = useRouter()

    const { issues, loading: issuesLoading } = useIssues(team?._id)

    const filteredIssues = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return issues
        return issues.filter((i) => i.title?.toLowerCase().includes(q))
    }, [issues, search])

    return (
        <>
            <div className='w-full h-full'>
                <AppHeader icon={team?.icon} secTitle={team?.name} subTitle='Issues' direct={`/${ws.url}/team/${slug}/overview`} onStarClick={() => (console.log('hello'))} onPlusClick={() => setOpen(true)} />
                <div className='flex flex-1 flex-col p-2'>
                    <div className='flex items-center gap-2'>
                        <Button size='icon-sm' variant='outline' className='rounded-full'><Settings2 /></Button>
                        <div className="w-full">
                            <InputGroup className="w-full h-7 rounded-full">
                                <InputGroupInput
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search issues..."
                                />
                                <InputGroupAddon className="ml-2"><Search /></InputGroupAddon>
                            </InputGroup>
                        </div>
                        <Button className="rounded-full" variant='outline' size='icon-sm'><ListFilter /></Button>
                    </div>

                    <div className='w-full overflow-x-auto mt-4'>
                        <table className='min-w-full text-sm'>
                            <tbody>
                                {teamLoading || issuesLoading ? (
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
                                ) : !team ? (
                                    <tr>
                                        <td className='px-4 py-6 text-center text-muted-foreground'>
                                            Team not found
                                        </td>
                                    </tr>
                                ) : filteredIssues.length === 0 ? (
                                    <tr>
                                        <td className='px-4 py-6 text-center text-muted-foreground'>
                                            {search ? 'No issues match your search' : 'No issues yet'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredIssues.map((issue) => {
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
            {open && <IssueCard onClose={() => setOpen(false)} icon={team?.icon} slug={slug} />}
        </>
    )
}

export default Page