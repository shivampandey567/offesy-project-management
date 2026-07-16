'use client'
import AppHeader from '@/components/app-header'
import ProjectCard from '@/components/project-card'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import TextBg from '@/components/ui/textbg'
import { Avatar, AvatarFallback, getAvatarVariant, getInitials } from '@/components/ui/avatar'
import { useTeamById } from '@/hooks/useTeamById'
import { useProjects } from '@/hooks/useProjects'
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers'
import { useWorkspace } from '@/lib/workspace-context'
import { ListFilter, Search, Settings2, UserCircle } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const STATUS_OPTIONS = ['Pending', 'Planned', 'Active', 'Completed', 'Cancelled'] as const

const Page = () => {
    const ws = useWorkspace()
    const { slug } = useParams() as { slug: string }
    const router = useRouter()
    const { team, loading: teamLoading } = useTeamById(slug, ws.id)
    const { members } = useWorkspaceMembers(ws.id)

    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table')

    const { projects, loading: projectsLoading } = useProjects(ws.id, team?._id)

    const filteredProjects = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        return projects.filter((project) => {
            const matchesSearch =
                !q ||
                (project.name ?? '').toLowerCase().includes(q) ||
                (project.description ?? '').toLowerCase().includes(q)
            const matchesStatus = statusFilter === 'all' || project.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [projects, searchQuery, statusFilter])

    const getProgress = (project: any) => {
        const tasks = project.tasks ?? []
        if (tasks.length === 0) return 0
        const done = tasks.filter((t: any) => t.status === 'done').length
        return Math.round((done / tasks.length) * 100)
    }

    // resolve project.members (ObjectId[]) -> workspace member objects with name, for avatars
    const getProjectMembers = (project: any) => {
        const ids = (project.members ?? []).map(String)
        return members.filter((m) => ids.includes(String(m.id)))
    }

    const loading = teamLoading || projectsLoading

    return (
        <>
            <div className='h-full w-full'>
                <AppHeader
                    icon={team?.icon}
                    secTitle={team?.name}
                    subTitle='Projects'
                    direct={`/${ws.url}/team/${slug}/overview`}
                    onStarClick={() => console.log('hello')}
                    onPlusClick={() => setOpen(true)}
                />

                <div className='flex items-center gap-2 p-2'>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size='icon-sm' variant='outline' className='rounded-full'>
                                <Settings2 />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='start'>
                            <DropdownMenuLabel>View</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'card')}>
                                <DropdownMenuRadioItem value='table'>Table view</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value='card'>Card view</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="w-full">
                        <InputGroup className="w-full h-7 rounded-full">
                            <InputGroupInput
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <InputGroupAddon className="ml-2"><Search /></InputGroupAddon>
                        </InputGroup>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="rounded-full" variant='outline' size='icon-sm'>
                                <ListFilter />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                                <DropdownMenuRadioItem value='all'>All</DropdownMenuRadioItem>
                                {STATUS_OPTIONS.map((s) => (
                                    <DropdownMenuRadioItem key={s} value={s}>{s}</DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className='flex flex-1 flex-col p-2'>
                    {loading ? (
                        <div className='p-6 text-sm text-muted-foreground'>Loading...</div>
                    ) : filteredProjects.length === 0 ? (
                        <div className='text-center py-16'>
                            <p className='text-sm text-muted-foreground'>
                                {searchQuery || statusFilter !== 'all'
                                    ? 'Try adjusting your filters'
                                    : 'Get started by creating your first project'}
                            </p>
                        </div>
                    ) : viewMode === 'card' ? (
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:px-4 p-2'>
                            {filteredProjects.map((project) => {
                                const progress = getProgress(project)
                                const projectMembers = getProjectMembers(project)
                                return (
                                    <Card onClick={() => router.push(`/${ws.url}/project/${project._id}/overview`)} key={project._id} className=' min-w-0 max-w-full md:max-w-sm px-4 cursor-pointer hover:shadow-md bg-background dark:bg-card'>
                                        <div className='flex'>
                                            <img className='h-25 w-25 mr-4' src={project.icon} />
                                            <div className='h-25 w-full'>
                                                <Card className='h-full w-full p-0 rounded-none ring-0 shadow-none bg-transparent'>
                                                    <CardHeader className='p-0'>
                                                        <CardTitle className='line-clamp-1'>{project.name}</CardTitle>
                                                        <CardAction><TextBg variant='blue'>{project.status}</TextBg></CardAction>
                                                    </CardHeader>
                                                    <CardContent className='p-0 mt-[-10px] text-muted-foreground line-clamp-3'>
                                                        {project.description}
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                        <div className='w-full'>
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <span className="">Progress</span>
                                                <span className="font-medium">
                                                    {progress}%
                                                </span>
                                            </div>
                                            <Progress value={progress} className="h-2" />
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    ) : (
                        <Table>
                            <TableBody>
                                {filteredProjects.map((project) => {
                                    const progress = getProgress(project)
                                    const projectMembers = getProjectMembers(project)
                                    return (
                                        <TableRow
                                            key={project._id}
                                            onClick={() => router.push(`/${ws.url}/project/${project._id}/overview`)}
                                            className='cursor-pointer border-b-0 hover:bg-muted/50'
                                        >
                                            <TableCell className='align-middle py-3 pl-2 md:pl-4 w-14'>
                                                {project.icon ? (
                                                    <img src={project.icon} alt={project.name} className='h-8 w-8 object-contain rounded-md block' />
                                                ) : (
                                                    <div className='h-10 w-10 rounded-md bg-muted' />
                                                )}
                                            </TableCell>

                                            <TableCell className='align-middle py-3 min-w-0 max-w-45'>
                                                <p className='font-medium truncate line-clamp-1'>{project.name}</p>
                                            </TableCell>

                                            {/* Status — now between name and progress */}
                                            <TableCell className='align-middle py-3 w-25'>
                                                <TextBg variant='purple'>{project.status}</TextBg>
                                            </TableCell>

                                            {/* Progress — hidden on mobile */}
                                            <TableCell className='align-middle py-3 w-40 hidden md:table-cell'>
                                                <div className='flex items-center gap-2'>
                                                    <Progress value={progress} className='h-1.5 flex-1' />
                                                    <span className='text-xs text-muted-foreground w-8 text-right'>{progress}%</span>
                                                </div>
                                            </TableCell>

                                            <TableCell className='align-middle py-3 w-25 pr-2 md:pr-4 text-right'>
                                                {projectMembers.length > 0 ? (
                                                    <div className='flex -space-x-2 justify-end'>
                                                        {projectMembers.slice(0, 4).map((m) => (
                                                            <Avatar key={m.id} size='sm' className='ring-2 ring-background'>
                                                                <AvatarFallback variant={getAvatarVariant(m.name)}>
                                                                    {getInitials(m.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        ))}
                                                        {projectMembers.length > 4 && (
                                                            <Avatar size='sm' className='ring-2 ring-background'>
                                                                <AvatarFallback variant='slate'>
                                                                    +{projectMembers.length - 4}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className='flex justify-end text-muted-foreground'>
                                                        <UserCircle size={18} strokeWidth={1.5} />
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
            {open && <ProjectCard onClose={() => setOpen(false)} icon={team?.icon} slug={slug} />}
        </>
    )
}

export default Page