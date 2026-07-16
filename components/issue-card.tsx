import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Box, ChevronRight, Maximize2, Minimize2, Paperclip, Search, UserCircle, X, FileText, Circle, AlertCircle, Eye, CircleCheck, Check, SignalLow, SignalMedium, SignalHigh, MessageSquareWarning, Loader, Dot, Folder } from 'lucide-react'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import TextareaAutosize from "react-textarea-autosize"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { useTeamById } from '@/hooks/useTeamById'
import { useWorkspace } from '@/lib/workspace-context'
import { useTeams } from '@/hooks/useTeams'
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers'
import { Avatar, AvatarFallback, getAvatarVariant, getInitials } from './ui/avatar'
import { Input } from './ui/input'
import { DueDatePicker } from './date-picker'
import { toast } from 'sonner'
import { useCreateIssue } from '@/hooks/useCreateIssue'
import { MAX_ATTACHMENT_TOTAL_BYTES } from '@/lib/validations/issue'
import { useProjects } from '@/hooks/useProjects'

const MARKUP_OPTIONS = [
    { label: 'Task', Icon: CircleCheck },
    { label: 'To do', Icon: Circle },
    { label: 'Issue', Icon: AlertCircle },
    { label: 'Review', Icon: Eye },
]

const PRIORITY_OPTIONS = [
    { label: 'None', Icon: Dot },
    { label: 'Low', Icon: SignalLow },
    { label: 'Medium', Icon: SignalMedium },
    { label: 'High', Icon: SignalHigh },
    { label: 'Urgent', Icon: MessageSquareWarning },
]

type AttachedFile = {
    file: File
    id: string
    previewUrl: string | null
}

const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

const IssueCard = ({ onClose, icon, slug }: { onClose: () => void, icon?: string, slug: string }) => {
    const [max, setMax] = useState(false)
    const maximize = () => setMax(prev => !prev)

    const [selectedSlug, setSelectedSlug] = useState(slug)
    const [assigneeIds, setAssigneeIds] = useState<string[]>([])
    const [assigneeSearch, setAssigneeSearch] = useState('')
    const [assigneeMenuOpen, setAssigneeMenuOpen] = useState(false)

    const [markup, setMarkup] = useState('Task')
    const [priority, setPriority] = useState('')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')

    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const ws = useWorkspace()
    const { teams } = useTeams(ws.id)

    const { team } = useTeamById(selectedSlug, ws.id)
    const { members, loading: membersLoading } = useWorkspaceMembers(ws.id)
    const { createIssue, submitting } = useCreateIssue()

    const WorkspaceMembers = useMemo(
        () =>
            members.map((m) => ({
                userId: m.id,
                clerkId: m.clerkId,
                name: m.name,
                email: m.email || undefined,
            })),
        [members]
    )

    const teamMembers = useMemo(
        () =>
            (team?.members ?? [])
                .map((tm) => {
                    const wm = WorkspaceMembers.find((m) => m.userId === String(tm.userId))
                    return wm ? { ...wm, role: tm.role } : null
                })
                .filter((m): m is (typeof WorkspaceMembers)[number] & { role: string } => m !== null),
        [team, WorkspaceMembers]
    )

    const filteredTeamMembers = useMemo(() => {
        const q = assigneeSearch.trim().toLowerCase()
        if (!q) return teamMembers
        return teamMembers.filter(
            (m) => m.name.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
        )
    }, [teamMembers, assigneeSearch])

    useEffect(() => {
        setAssigneeIds((prev) => {
            const next = prev.filter((id) => teamMembers.some((m) => m.userId === id))
            if (next.length === prev.length) return prev
            return next
        })
    }, [selectedSlug, teamMembers])

    useEffect(() => {
        if (!assigneeMenuOpen) setAssigneeSearch('')
    }, [assigneeMenuOpen])

    useEffect(() => {
        if (!teams?.length) return
        const exists = teams.some((t: any) => t.slug === selectedSlug)
        if (!exists) setSelectedSlug(teams[0].slug)
    }, [teams, selectedSlug])

    useEffect(() => {
        return () => {
            attachedFiles.forEach((f) => {
                if (f.previewUrl) URL.revokeObjectURL(f.previewUrl)
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const selectedTeam = teams?.find((t: any) => t.slug === selectedSlug)
    const selectedAssignees = teamMembers.filter((m) => assigneeIds.includes(m.userId))
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined)

    const toggleAssignee = (userId: string) => {
        setAssigneeIds((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        )
    }

    const attachedTotalBytes = attachedFiles.reduce((sum, f) => sum + f.file.size, 0)

    const handleFilePick = () => fileInputRef.current?.click()

    // ✅ enforce a 10MB total across all attachments on this issue
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? [])
        if (!files.length) return

        const incomingBytes = files.reduce((sum, f) => sum + f.size, 0)

        if (attachedTotalBytes + incomingBytes > MAX_ATTACHMENT_TOTAL_BYTES) {
            const remaining = MAX_ATTACHMENT_TOTAL_BYTES - attachedTotalBytes
            toast.error(
                remaining <= 0
                    ? 'Attachment limit reached (10MB total)'
                    : `Only ${formatBytes(remaining)} left of the 10MB attachment limit`,
                { position: 'top-right' }
            )
            e.target.value = ''
            return
        }

        const next: AttachedFile[] = files.map((file) => ({
            file,
            id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
            previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        }))

        setAttachedFiles((prev) => [...prev, ...next])
        toast(`${files.length} file${files.length > 1 ? 's' : ''} attached`, { position: 'top-right' })
        e.target.value = ''
    }

    const removeFile = (id: string) => {
        setAttachedFiles((prev) => {
            const target = prev.find((f) => f.id === id)
            if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
            return prev.filter((f) => f.id !== id)
        })
    }

    const selectedMarkup = MARKUP_OPTIONS.find((s) => s.label === markup)
    const MarkupIcon = selectedMarkup?.Icon ?? CircleCheck

    const selectedPriority = PRIORITY_OPTIONS.find((p) => p.label === priority)
    const PriorityIcon = selectedPriority?.Icon


    // add near other state, after selectedTeam/selectedAssignees etc.
    const [projectId, setProjectId] = useState<string>('')

    // scoped to the selected team — same pattern as teamMembers being scoped to selectedTeam
    const { projects, loading: projectsLoading } = useProjects(ws.id, selectedTeam?._id)

    const selectedProject = projects.find((p: any) => String(p._id) === projectId)

    // reset selected project if it no longer belongs to the newly selected team
    useEffect(() => {
        setProjectId((prev) => {
            const stillValid = projects.some((p: any) => String(p._id) === prev)
            return stillValid ? prev : ''
        })
    }, [selectedSlug, projects])

    // ✅ builds payload and delegates validation to zod (client-side via useCreateIssue, server-side via the API route)
    const handleCreateIssue = async () => {
        if (!selectedTeam?._id) {
            toast.error('Select a team first', { position: 'top-right' })
            return
        }

        try {
            const targets = assigneeIds.length > 0 ? assigneeIds : [undefined]

            const results = await Promise.allSettled(
                targets.map((assigneeId) =>
                    createIssue({
                        title,
                        description,
                        markup,
                        priority: priority || undefined,
                        teamId: selectedTeam._id,
                        workspaceId: ws.id,
                        assignee: assigneeId ?? null,
                        dueDate: dueDate ? dueDate.toISOString() : undefined,
                        attachments: [],
                        project: projectId || undefined,
                    })
                )
            )

            const failed = results.filter((r) => r.status === 'rejected').length
            if (failed === results.length) throw new Error('Failed to create issue')

            toast.success(
                results.length > 1 ? `${results.length - failed} issues created` : 'Issue created',
                { position: 'top-right' }
            )
            onClose()
        } catch (err: any) {
            toast.error(err.message ?? 'Failed to create issue', { position: 'top-right' })
        }
    }
    return (
        <div
            onClick={onClose}
            className={`fixed flex inset-0 z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 ${max ? 'justify-center items-center' : 'justify-center'}`}
        >
            <Card
                onClick={(e) => e.stopPropagation()}
                className={`fixed w-full rounded-4xl flex flex-col justify-between ring-0 transition-all duration-200 ${max ? 'h-[80vh] max-w-sm md:max-w-4xl' : 'top-25 h-80 md:h-75 max-w-sm md:max-w-3xl'}`}
            >
                <CardHeader className=''>
                    <CardTitle className='flex items-center gap-1'>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className='rounded-full pl-1' variant='outline' size='xs'>
                                    {selectedTeam?.icon ?? icon}{selectedTeam?.slug ?? slug}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="min-w-56">
                                <DropdownMenuGroup>
                                    <DropdownMenuRadioGroup
                                        value={selectedSlug}
                                        onValueChange={setSelectedSlug}
                                    >
                                        {teams.map((t: any) => (
                                            <DropdownMenuRadioItem key={t.slug} value={t.slug}>
                                                {t.icon}
                                                {t.name}
                                                <span className='text-muted-foreground ml-1'>{t.slug}</span>
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <ChevronRight size={12} className='text-accent-foreground/80' />
                        <span className='text-accent-foreground/80 text-sm'>New issue</span>
                    </CardTitle>
                    <CardAction className='flex gap-1'>
                        <Button onClick={maximize} className='rounded-full' size='icon-sm' variant='ghost'>
                            {max ? <Minimize2 /> : <Maximize2 />}
                        </Button>
                        <Button onClick={onClose} className='rounded-full' size='icon-sm' variant='ghost'><X /></Button>
                    </CardAction>
                </CardHeader>
                <CardContent className='flex-1 min-h-0 w-full overflow-hidden'>
                    <ScrollArea className="h-full w-full">

                        <div className="grid w-full">
                            <TextareaAutosize
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Issue title"
                                className="max-w-full resize-none overflow-hidden bg-transparent px-2 py-1 text-base outline-none border-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:border-none md:text-lg text-accent-foreground font-bold"
                            />
                        </div>
                        <div className="grid w-full">
                            <TextareaAutosize
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add a description..."
                                className="max-w-full min-h-20 resize-none overflow-hidden bg-transparent px-2 py-1 text-base outline-none border-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:border-none md:text-md text-accent-foreground/80 font-medium"
                            />
                        </div>

                        {attachedFiles.length > 0 && (
                            <div className='flex flex-wrap gap-3 px-2 pt-2'>
                                {attachedFiles.map((f) => (
                                    <div key={f.id} className='group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border bg-muted'>
                                        {f.previewUrl ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={f.previewUrl}
                                                alt={f.file.name}
                                                className='h-full w-full object-cover'
                                            />
                                        ) : (
                                            <div className='flex h-full w-full flex-col items-center gap-1.5 p-2'>
                                                <span className='line-clamp-1 w-full text-center text-[10px] text-muted-foreground break-all'>
                                                    {f.file.name}
                                                </span>
                                                <div className='flex flex-1 justify-center mt-3'>
                                                    <FileText size={22} className='text-muted-foreground' />
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            type='button'
                                            onClick={() => removeFile(f.id)}
                                            className='absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100'
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {attachedFiles.length > 0 && (
                            <p className='px-2 pt-1 text-xs text-muted-foreground'>
                                {formatBytes(attachedTotalBytes)} / {formatBytes(MAX_ATTACHMENT_TOTAL_BYTES)} used
                            </p>
                        )}
                    </ScrollArea>
                </CardContent>
                <CardFooter className='bg-card border-none flex flex-col items-start gap-4'>
                    <div className='flex flex-wrap items-center gap-2 '>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size='sm' className='rounded-full'>
                                    <MarkupIcon size={14} />
                                    {markup}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuGroup>
                                    <DropdownMenuRadioGroup value={markup} onValueChange={setMarkup}>
                                        {MARKUP_OPTIONS.map(({ label, Icon }) => (
                                            <DropdownMenuRadioItem key={label} value={label}>
                                                <Icon className='text-muted-foreground' />{label}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size='sm' className='rounded-full capitalize'>
                                    {PriorityIcon && <PriorityIcon size={14} /> || <Loader size={14} />}
                                    {priority || 'Priority'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuGroup>
                                    <DropdownMenuRadioGroup value={priority} onValueChange={(val) => setPriority(val === 'None' ? '' : val)}>
                                        {PRIORITY_OPTIONS.map(({ label, Icon }) => (
                                            <DropdownMenuRadioItem key={label} value={label} className='capitalize'>
                                                <Icon size={14} className='text-muted-foreground' />
                                                {label}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu open={assigneeMenuOpen} onOpenChange={setAssigneeMenuOpen}>
                            <DropdownMenuTrigger asChild disabled={membersLoading || teamMembers.length === 0}>
                                <Button
                                    className='rounded-full'
                                    variant='outline'
                                    size='sm'
                                    disabled={membersLoading || teamMembers.length === 0}
                                >
                                    {selectedAssignees.length > 0 ? (
                                        <>
                                            <div className='flex -ml-1 items-center -space-x-2'>
                                                {selectedAssignees.slice(0, 3).map((m) => (
                                                    <Avatar key={m.userId} size='sm'>
                                                        <AvatarFallback variant={getAvatarVariant(m.name)}>
                                                            {getInitials(m.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ))}
                                            </div>
                                            {selectedAssignees.length === 1
                                                ? selectedAssignees[0].name
                                                : selectedAssignees.length > 3
                                                    ? `+${selectedAssignees.length - 3} more`
                                                    : `${selectedAssignees.length}`}
                                        </>
                                    ) : membersLoading ? (
                                        'Loading…'
                                    ) : (
                                        <span className='flex items-center gap-1'><UserCircle />Assignee</span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="min-w-64" onCloseAutoFocus={(e) => e.preventDefault()}>
                                <div className='px-2 py-1.5'>
                                    <div className='relative'>
                                        <Search size={13} className='absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground' />
                                        <Input
                                            autoFocus
                                            value={assigneeSearch}
                                            onChange={(e) => setAssigneeSearch(e.target.value)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            placeholder='Search members...'
                                            className='h-8 pl-7 text-sm '
                                        />
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup className='max-h-56 overflow-y-auto'>
                                    {filteredTeamMembers.length === 0 ? (
                                        <DropdownMenuLabel className='text-muted-foreground font-normal'>
                                            No members found
                                        </DropdownMenuLabel>
                                    ) : (
                                        filteredTeamMembers.map((m) => (
                                            <DropdownMenuCheckboxItem
                                                key={m.userId}
                                                checked={assigneeIds.includes(m.userId)}
                                                onSelect={(e) => e.preventDefault()}
                                                onCheckedChange={() => toggleAssignee(m.userId)}
                                            >
                                                <Avatar size='sm'>
                                                    <AvatarFallback variant={getAvatarVariant(m.name)}>
                                                        {getInitials(m.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {m.name}
                                            </DropdownMenuCheckboxItem>
                                        ))
                                    )}
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild disabled={projectsLoading || projects.length === 0}>
                                <Button
                                    variant="outline"
                                    size='sm'
                                    className='rounded-full'
                                    disabled={projectsLoading || projects.length === 0}
                                >
                                    {selectedProject ? (
                                        <>
                                            <span className='flex h-4 w-4 items-center justify-center shrink-0 overflow-hidden rounded-sm'>
                                                {selectedProject.icon ? (
                                                    <img src={selectedProject.icon} alt={selectedProject.name} className='h-full w-full object-contain' />
                                                ) : (
                                                    <Folder size={14} className='text-muted-foreground' />
                                                )}
                                            </span>
                                            {selectedProject.name}
                                        </>
                                    ) : projectsLoading ? (
                                        'Loading…'
                                    ) : (
                                        <span className='flex items-center gap-1'><Box size={14} />Project</span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="min-w-56">
                                <DropdownMenuGroup>
                                    {projects.length === 0 ? (
                                        <DropdownMenuLabel className='text-muted-foreground font-normal'>
                                            No projects in this team
                                        </DropdownMenuLabel>
                                    ) : (
                                        <DropdownMenuRadioGroup
                                            value={projectId || 'none'}
                                            onValueChange={(val) => setProjectId(val === 'none' ? '' : val)}
                                        >
                                            <DropdownMenuRadioItem value='none'>
                                                <span className='flex h-4 w-4 items-center justify-center shrink-0'>
                                                    <Dot size={14} className='text-muted-foreground' />
                                                </span>
                                                None
                                            </DropdownMenuRadioItem>
                                            {projects.map((p: any) => (
                                                <DropdownMenuRadioItem key={p._id} value={String(p._id)}>
                                                    <span className='flex h-4 w-4 items-center justify-center shrink-0 overflow-hidden rounded-sm'>
                                                        {p.icon ? (
                                                            <img src={p.icon} alt={p.name} className='h-full w-full object-contain' />
                                                        ) : (
                                                            <Folder size={14} className='text-muted-foreground' />
                                                        )}
                                                    </span>
                                                    {p.name}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>
                                    )}
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>


                        <DueDatePicker value={dueDate} onChange={setDueDate} />
                    </div>
                    <div className='flex w-full items-center justify-between'>
                        <input
                            ref={fileInputRef}
                            type='file'
                            multiple
                            accept='image/*,.pdf,.doc,.docx'
                            className='hidden'
                            onChange={handleFileChange}
                        />
                        <Button
                            className='rounded-full relative'
                            variant='outline'
                            size='icon-sm'
                            onClick={handleFilePick}
                        >
                            <Paperclip />
                            {attachedFiles.length > 0 && (
                                <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground'>
                                    {attachedFiles.length}
                                </span>
                            )}
                        </Button>
                        <Button
                            className='rounded-full'
                            variant='blue'
                            size='sm'
                            onClick={handleCreateIssue}
                            disabled={submitting}
                        >
                            {submitting ? 'Creating…' : 'Create issue'}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}

export default IssueCard