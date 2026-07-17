// app/[url]/(dashboard)/team/[slug]/issues/[id]/page.tsx
'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useWorkspace } from '@/lib/workspace-context'
import { useIssueById } from '@/hooks/useIssueById'
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers'
import TextareaAutosize from "react-textarea-autosize"
import AppHeader from '@/components/app-header'
import { Button } from '@/components/ui/button'
import {
    ArrowUp, Check, ChevronDown, Circle, AlertCircle, Eye, CircleCheck,
    GitMerge, Link, MousePointer2, Paperclip, Pencil, Search, Trash2, UserCircle, Box,
    SignalLow,
    SignalMedium,
    SignalHigh,
    MessageSquareWarning,
    Loader,
    FilePlusCorner,
    Link2,
    Sparkles,
    PauseCircle,
    BellRing,
    Redo2,
    CircleX,
    Calendar,
    CheckCheck,
    Smile,
    RotateCw,
    Dot,
    Folder,
} from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, getAvatarVariant, getInitials } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DueDatePicker } from '@/components/date-picker'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import TextBg from '@/components/ui/textbg'
import { useTeamById } from '@/hooks/useTeamById'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import IconBg from '@/components/ui/iconbg'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { useProjects } from '@/hooks/useProjects'
import { X, FileText, /* ...existing... */ } from 'lucide-react'
import { useUploadAttachments } from '@/hooks/useUploadAttachments'
import { MAX_ATTACHMENT_TOTAL_BYTES } from '@/lib/validations/issue'
import { Skeleton } from '@/components/ui/skeleton'

type SubIssue = { title: string; done: boolean }

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

const Page = () => {
    const { id } = useParams() as { id: string }
    const router = useRouter()
    const ws = useWorkspace()
    const { issue, loading, updateIssue, deleteIssue, forbidden, isCreator, isAssignee } = useIssueById(id)
    const { members } = useWorkspaceMembers(ws.id)
    const readonly = !isCreator // assignees see everything, edit nothing
    const isBoth = isCreator && isAssignee

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const titleSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const descSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [newSubIssue, setNewSubIssue] = useState('')
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [editingTitle, setEditingTitle] = useState('')
    const [subIssuesOpen, setSubIssuesOpen] = useState(true)

    const [assigneeMenuOpen, setAssigneeMenuOpen] = useState(false)
    const [assigneeSearch, setAssigneeSearch] = useState('')

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { uploadAttachments, uploading: uploadingAttachments } = useUploadAttachments()


    useEffect(() => {
        if (issue?.title !== undefined) setTitle(issue.title)
    }, [issue?.title])

    useEffect(() => {
        if (issue?.description !== undefined) setDescription(issue.description ?? '')
    }, [issue?.description])

    useEffect(() => {
        return () => {
            if (titleSaveRef.current) clearTimeout(titleSaveRef.current)
            if (descSaveRef.current) clearTimeout(descSaveRef.current)
        }
    }, [])

    useEffect(() => {
        if (!assigneeMenuOpen) setAssigneeSearch('')
    }, [assigneeMenuOpen])

    // ✅ team members eligible for assignment — derived from the issue's own team
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

    const { team } = useTeamById(issue?.teamId?.slug, ws.id)

    const teamMembers = useMemo(
        () =>
            (team?.members ?? [])
                .map((tm: any) => {
                    const wm = WorkspaceMembers.find((m) => m.userId === String(tm.userId))
                    return wm ? { ...wm, role: tm.role } : null
                })
                .filter((m: any): m is (typeof WorkspaceMembers)[number] & { role: string } => m !== null),
        [team, WorkspaceMembers]
    )

    const filteredTeamMembers = useMemo(() => {
        const q = assigneeSearch.trim().toLowerCase()
        if (!q) return teamMembers
        return teamMembers.filter(
            (m) => m.name.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
        )
    }, [teamMembers, assigneeSearch])

    const currentAssigneeId: string | null = useMemo(
        () => issue?.assignee ? String(issue.assignee?._id ?? issue.assignee) : null,
        [issue?.assignee]
    )

    const selectedAssignee = useMemo(
        () => teamMembers.find((m) => m.userId === currentAssigneeId),
        [teamMembers, currentAssigneeId]
    )

    const handleStatus = (value: string) => {
        updateIssue({ status: value === 'accept' ? 'Active' : 'Refused' })
        toast(value === 'accept' ? 'Issue accepted' : 'Issue refused', {
            description: value === 'accept'
                ? 'You have accepted the issue. Start working on it.'
                : 'You have refused this issue.',
            position: 'top-right'
        })
    }

    const handleUndo = () => {
        updateIssue({ status: 'Pending' })
        toast('Undo the changes', { position: 'top-right' })
    }

    const handleTitleChange = (value: string) => {
        setTitle(value)
        if (titleSaveRef.current) clearTimeout(titleSaveRef.current)
        titleSaveRef.current = setTimeout(() => {
            updateIssue({ title: value })
        }, 1000)
    }

    const handleDescriptionChange = (value: string) => {
        setDescription(value)
        if (descSaveRef.current) clearTimeout(descSaveRef.current)
        descSaveRef.current = setTimeout(() => {
            updateIssue({ description: value })
        }, 1000)
    }

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (titleSaveRef.current) clearTimeout(titleSaveRef.current)
            updateIssue({ title })
        }
    }

    const handleAddSubIssue = () => {
        if (!newSubIssue.trim() || !issue) return
        const updated = [...(issue.subIssues ?? []), { title: newSubIssue.trim(), done: false }]
        updateIssue({ subIssues: updated })
        toast('New sub issue added', { position: 'top-right' })
        setNewSubIssue('')
    }

    const handleEditSubIssue = (index: number) => {
        if (!issue) return
        const updated: SubIssue[] = issue.subIssues.map((t: SubIssue, i: number) =>
            i === index ? { ...t, title: editingTitle } : t
        )
        updateIssue({ subIssues: updated })
        setEditingIndex(null)
        setEditingTitle('')
    }

    const handleToggleSubIssue = (index: number) => {
        if (!issue) return
        const updated: SubIssue[] = issue.subIssues.map((t: SubIssue, i: number) =>
            i === index ? { ...t, done: !t.done } : t
        )
        updateIssue({ subIssues: updated })
    }

    const handleDeleteSubIssue = (index: number) => {
        if (!issue) return
        const updated = issue.subIssues.filter((_: any, i: number) => i !== index)
        updateIssue({ subIssues: updated })
    }

    // ✅ issue/Priority/Assignee dropdown handlers — update directly on change
    const handleMarkupChange = (value: string) => {
        updateIssue({ markup: value })
    }

    const handlePriorityChange = (value: string) => {
        updateIssue({ priority: value === 'None' ? null : (value as any) })
    }

    const handleAssigneeSelect = (userId: string) => {
        const next = currentAssigneeId === userId ? null : userId
        updateIssue({ assignee: next })
        setAssigneeMenuOpen(false)
    }

    const handleDueDateChange = (date: Date | undefined) => {
        updateIssue({ dueDate: date ? date.toISOString() : null })
    }



    const handleHoldToggle = () => {
        const next = issue.action === 'Hold' ? null : 'Hold'
        updateIssue({ action: next as any })
        toast(next ? 'Issue on hold' : 'Hold removed', {
            description: next ? 'Issue has been placed on hold.' : 'Issue is no longer on hold.',
            position: 'top-right'
        })
    }

    const handleCancelToggle = () => {
        const next = issue.action === 'Cancelled' ? null : 'Cancelled'
        updateIssue({ action: next as any })
        toast(next ? 'Issue cancelled' : 'Cancellation undone', {
            description: next ? 'This issue has been cancelled.' : 'This issue is active again.',
            position: 'top-right'
        })
    }

    const handleDeleteConfirmed = async () => {
        setDeleting(true)
        try {
            await deleteIssue()
            toast('Issue deleted', { description: 'Issue has been deleted.', position: 'top-right' })
            router.back()
        } catch {
            toast.error('Failed to delete issue', { position: 'top-right' })
        } finally {
            setDeleting(false)
            setDeleteConfirmOpen(false)
        }
    }

    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return `${bytes}B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? [])
        if (!files.length || !issue) return

        const existingTotal = (issue.attachments ?? []).reduce((sum: number, a: any) => sum + (a.size ?? 0), 0)
        const incomingBytes = files.reduce((sum, f) => sum + f.size, 0)

        if (existingTotal + incomingBytes > MAX_ATTACHMENT_TOTAL_BYTES) {
            const remaining = MAX_ATTACHMENT_TOTAL_BYTES - existingTotal
            toast.error(
                remaining <= 0
                    ? 'Attachment limit reached (10MB total)'
                    : `Only ${formatBytes(remaining)} left of the 10MB attachment limit`,
                { position: 'top-right' }
            )
            e.target.value = ''
            return
        }

        try {
            const uploaded = await uploadAttachments(files)
            const updated = [...(issue.attachments ?? []), ...uploaded]
            await updateIssue({ attachments: updated })
            toast(`${files.length} file${files.length > 1 ? 's' : ''} attached`, { position: 'top-right' })
        } catch (err: any) {
            toast.error(err.message ?? 'Failed to upload attachment', { position: 'top-right' })
        } finally {
            e.target.value = ''
        }
    }

    const handleRemoveAttachment = (url: string, name: string) => {
        if (!issue) return
        if (!window.confirm(`Delete "${name}"?`)) return

        const updated = (issue.attachments ?? []).filter((a: any) => a.url !== url)
        updateIssue({ attachments: updated })
        toast('Attachment deleted', { position: 'top-right' })
    }



    // add near other derived values, after teamMembers/filteredTeamMembers
    const { projects } = useProjects(ws.id, team?._id)

    // same pattern as currentAssigneeId — handles both populated doc and raw ObjectId
    const currentProjectId: string | null = useMemo(
        () => issue?.project ? String(issue.project?._id ?? issue.project) : null,
        [issue?.project]
    )

    const selectedProject = useMemo(
        () => projects.find((p: any) => String(p._id) === currentProjectId),
        [projects, currentProjectId]
    )

    const handleProjectChange = (value: string) => {
        updateIssue({ project: value === 'none' ? null : value })
    }

    if (loading) return (
        <div className="w-full h-full flex flex-col">
            <AppHeader
                secTitle='My-issue'
                direct={`/${ws.url}/my-issues/assigned`}
                subTitle=' '
            />

            <div className='flex flex-col lg:grid grid-cols-[7fr_3fr] items-start lg:h-[calc(100vh-64px)] lg:min-h-0'>
                <div className="flex flex-col lg:h-full lg:min-h-0 w-full">
                    <div className="h-full w-full overflow-y-auto">
                        <div className="flex flex-col gap-4 px-4 py-6 md:py-8 md:px-8 xl:px-25 min-w-0 w-full">
                            <div className='flex flex-col gap-3 min-w-0 w-full'>
                                <Skeleton className="h-8 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <div className='flex gap-2 mt-1'>
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                </div>
                                <div className='flex gap-3 pt-1'>
                                    <Skeleton className="h-24 w-24 rounded-xl" />
                                    <Skeleton className="h-24 w-24 rounded-xl" />
                                </div>
                            </div>

                            <Card className='bg-background ring-0 w-full min-w-0'>
                                <CardHeader className='px-0'>
                                    <Skeleton className="h-8 w-28 rounded-full" />
                                </CardHeader>
                                <CardContent className='flex flex-col gap-3 px-1 pb-3'>
                                    <div className='flex items-center gap-2'>
                                        <Skeleton className="h-2 w-2 rounded-full" />
                                        <Skeleton className="h-4 flex-1" />
                                    </div>
                                    <div className='flex items-center gap-2'>
                                        <Skeleton className="h-2 w-2 rounded-full" />
                                        <Skeleton className="h-4 flex-1" />
                                    </div>
                                    <Skeleton className="h-10 w-full rounded-full mt-2" />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                <div className='min-w-0 w-full flex flex-col p-2 lg:h-full lg:pr-4 gap-2'>
                    <div className='flex items-center justify-end gap-2'>
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <Card className='w-full ring-0 bg-card shadow-md'>
                        <CardContent className='flex flex-col gap-3'>
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-6 w-28 rounded-full" />
                            <Skeleton className="h-6 w-32 rounded-full" />
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-6 w-28 rounded-full" />
                        </CardContent>
                    </Card>
                    <Card className='w-full bg-card ring-0 shadow-md'>
                        <CardContent className='flex flex-col gap-2'>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-8 w-32 rounded-full mt-1" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
    if (forbidden) return (
        <div className="w-full h-full flex flex-col">
            <AppHeader
                secTitle='My-issue'
                direct={`/${ws.url}/my-issues/assigned`}
                subTitle="You can't access this issue"
            />
            <div className='flex flex-col items-center justify-center gap-3 h-full p-8 text-center'>
                <p className='font-medium'>This issue isn't assigned to you</p>
                <p className='text-sm text-muted-foreground'>Only the creator or an assignee can open it.</p>
            </div>
        </div>
    )
    if (!issue) return (
        <div className="w-full h-full flex flex-col">
            <AppHeader
                secTitle='My-issue'
                direct={`/${ws.url}/my-issues/assigned`}
                subTitle="Issue not found"
            />
            <div className="p-6 text-muted-foreground text-sm">Issue not found</div>
        </div>
    )

    const selectedMarkup = MARKUP_OPTIONS.find((s) => s.label === issue.markup)
    const MarkupIcon = selectedMarkup?.Icon ?? CircleCheck

    const selectedPriority = PRIORITY_OPTIONS.find((p) => p.label === issue.priority)
    const PriorityIcon = selectedPriority?.Icon

    const totalSubs = (issue.subIssues ?? []).length
    const doneSubs = (issue.subIssues ?? []).filter((s: any) => s.done).length
    const progress = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0

    return (
        <div className="w-full h-full flex flex-col">
            <AppHeader
                secTitle='My-issue'
                direct={`/${ws.url}/my-issues/assigned`}
                subTitle={issue.title}
                onStarClick={() => console.log('hello')}
                menuContent={
                    isCreator ? (
                        <DropdownMenuGroup>
                            <DropdownMenuCheckboxItem
                                checked={issue.action === 'Hold'}
                                onCheckedChange={handleHoldToggle}
                                onSelect={(e) => e.preventDefault()}
                            >
                                Hold issue
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={issue.action === 'Cancelled'}
                                onCheckedChange={handleCancelToggle}
                                onSelect={(e) => e.preventDefault()}
                            >
                                Cancel issue
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setDeleteConfirmOpen(true)}
                                className="text-destructive focus:text-destructive"
                            >
                                Delete issue
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    ) : (
                        <DropdownMenuItem disabled className="text-muted-foreground text-xs">
                            Only the creator can manage this issue
                        </DropdownMenuItem>
                    )
                }
            />
            {deleteConfirmOpen && (
                <div
                    onClick={() => !deleting && setDeleteConfirmOpen(false)}
                    className="fixed flex items-center justify-center inset-0 z-50 bg-black/20"
                >
                    <Card onClick={(e) => e.stopPropagation()} className="w-full max-w-sm p-4">
                        <CardHeader>
                            <CardTitle>Delete this issue?</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            This action can't be undone. The issue and all its sub-issues will be permanently removed.
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 bg-card border-none">
                            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteConfirmed} disabled={deleting}>
                                {deleting ? 'Deleting…' : 'Delete issue'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
            <div className='flex flex-col lg:grid grid-cols-[7fr_3fr] items-start lg:h-[calc(100vh-64px)] lg:min-h-0'>
                <div className="flex flex-col lg:h-full lg:min-h-0 w-full">
                    <div className="thin-scrollbar h-full w-full overflow-y-auto">
                        <div className="flex flex-col gap-2 px-4 py-6 md:py-8 md:px-8 xl:px-25 min-w-0 w-full">
                            <div className='flex flex-col gap-3 min-w-0 w-full'>
                                <div className='relative w-full min-w-0'>
                                    <TextareaAutosize
                                        value={title}
                                        onChange={(e) => handleTitleChange(e.target.value)}
                                        onKeyDown={handleTitleKeyDown}
                                        placeholder="Issue title"
                                        readOnly={readonly}
                                        className="w-full max-w-full resize-none bg-transparent px-1 outline-none border-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:border-none !text-2xl font-semibold text-accent-foreground"
                                    />
                                </div>
                                <div className="relative w-full min-w-0">
                                    <TextareaAutosize
                                        value={description}
                                        onChange={(e) => handleDescriptionChange(e.target.value)}
                                        placeholder={`${readonly ? 'No description' : 'Add a description...'}`}
                                        readOnly={readonly}
                                        className="w-full max-w-full resize-none bg-transparent px-1 text-base outline-none border-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:border-none md:text-md text-accent-foreground/80"
                                    />
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type='file'
                                    multiple
                                    accept='image/*,.pdf,.doc,.docx'
                                    className='hidden'
                                    onChange={handleFileChange}
                                />
                                <div className='mt-1 flex gap-2'>
                                    <Button
                                        className='rounded-full'
                                        variant='ghost'
                                        size='icon-sm'
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={readonly || uploadingAttachments}
                                    >
                                        <Paperclip />
                                    </Button>
                                    <Button className='rounded-full' variant='ghost' size='icon-sm'><FilePlusCorner /></Button>
                                    <Button className='rounded-full' variant='ghost' size='icon-sm'><Link2 /></Button>
                                </div>

                                {(issue.attachments ?? []).length > 0 && (
                                    <div className='flex flex-wrap gap-3 px-1 pt-1'>
                                        {issue.attachments.map((a: any) => (
                                            <div key={a.url} className='group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border bg-muted'>
                                                <button
                                                    type='button'
                                                    onClick={() => a.isImage ? setLightboxUrl(a.url) : window.open(a.url, '_blank')}
                                                    className='h-full w-full cursor-pointer'
                                                >
                                                    {a.isImage ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img src={a.url} alt={a.name} className='h-full w-full object-cover' />
                                                    ) : (
                                                        <div className='flex h-full w-full flex-col items-center gap-1.5 p-2'>
                                                            <span className='line-clamp-1 w-full text-center text-[10px] text-muted-foreground break-all'>
                                                                {a.name}
                                                            </span>
                                                            <div className='flex flex-1 justify-center mt-3'>
                                                                <FileText size={22} className='text-muted-foreground' />
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveAttachment(a.url, a.name) }}
                                                    className='absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100'
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Card className='bg-background ring-0 w-full min-w-0'>
                                <CardHeader className='px-0'>
                                    <Button
                                        type='button'
                                        onClick={() => setSubIssuesOpen((prev) => !prev)}
                                        className='rounded-full w-fit'
                                        variant='ghost'
                                        size='sm'
                                    >
                                        Sub-issues
                                        <ChevronDown
                                            size={15}
                                            className={`transition-transform duration-200 ${subIssuesOpen ? 'rotate-180' : 'rotate-0'}`}
                                        />
                                    </Button>
                                </CardHeader>

                                <div
                                    className={`grid transition-all duration-200 ease-in-out ${subIssuesOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                                >
                                    <div className='overflow-hidden min-w-0'>
                                        <CardContent className='flex flex-col gap-1 px-1 pb-1 w-full min-w-0'>
                                            {(issue.subIssues ?? []).map((t: SubIssue, i: number) => (
                                                <div key={i} className='flex items-center gap-2 py-2 pl-2 group min-w-0 w-full'>
                                                    {(readonly || isBoth) ? (
                                                        <Checkbox
                                                            checked={t.done}
                                                            onCheckedChange={() => handleToggleSubIssue(i)}
                                                            id={`subissue-${i}`}
                                                        />
                                                    ) : (
                                                        <button
                                                            type='button'
                                                            onClick={() => handleToggleSubIssue(i)}
                                                            className={`h-2 w-2 shrink-0 rounded-full ${t.done ? 'bg-muted-foreground' : 'bg-foreground'}`}
                                                        />
                                                    )}
                                                    {editingIndex === i ? (
                                                        <InputGroup className='flex-1 min-w-0 h-7'>
                                                            <InputGroupInput
                                                                value={editingTitle}
                                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleEditSubIssue(i)
                                                                    if (e.key === 'Escape') setEditingIndex(null)
                                                                }}
                                                                autoFocus
                                                            />
                                                            <InputGroupAddon align='inline-end'>
                                                                <Button className='rounded-md' size='icon-xs' onClick={() => handleEditSubIssue(i)}><Check strokeWidth={3} /></Button>
                                                            </InputGroupAddon>
                                                        </InputGroup>
                                                    ) : (
                                                        <>
                                                            {(readonly || isBoth) ? (
                                                                <label
                                                                    htmlFor={`subissue-${i}`}
                                                                    className={`flex-1 min-w-0 text-sm leading-snug break-all overflow-hidden cursor-pointer ${t.done ? 'line-through text-muted-foreground' : ''}`}
                                                                >
                                                                    {t.title}
                                                                </label>
                                                            ) : (
                                                                <span className={`flex-1 min-w-0 text-sm leading-snug break-all overflow-hidden ${t.done ? 'line-through text-muted-foreground' : ''}`}>
                                                                    {t.title}
                                                                </span>
                                                            )}
                                                            {!readonly && (
                                                                <>
                                                                    <Button
                                                                        variant='ghost' size='icon'
                                                                        className='opacity-100 xl:opacity-0 group-hover:opacity-100 h-6 w-6 shrink-0'
                                                                        onClick={() => { setEditingIndex(i); setEditingTitle(t.title) }}
                                                                    >
                                                                        <Pencil size={13} />
                                                                    </Button>
                                                                    <Button
                                                                        variant='ghost' size='icon'
                                                                        className='opacity-100 xl:opacity-0 group-hover:opacity-100 h-6 w-6 shrink-0'
                                                                        onClick={() => handleDeleteSubIssue(i)}
                                                                    >
                                                                        <Trash2 size={13} />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            ))}

                                            {!readonly && (
                                                <div className='pt-2 w-full min-w-0'>
                                                    <InputGroup className='w-full min-w-0 h-10 rounded-full'>
                                                        <InputGroupInput
                                                            value={newSubIssue}
                                                            onChange={(e) => setNewSubIssue(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubIssue()}
                                                            placeholder='Add a sub-issue...'
                                                            className='min-w-0'
                                                        />
                                                        <InputGroupAddon align='inline-end'>
                                                            <Button className='rounded-full cursor-pointer shrink-0' size='icon' onClick={handleAddSubIssue}><ArrowUp /></Button>
                                                        </InputGroupAddon>
                                                    </InputGroup>
                                                </div>
                                            )}
                                        </CardContent>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>

                <div className='min-w-0 w-full flex flex-col p-2 lg:h-full lg:pr-4 gap-2'>
                    <div className='flex items-center justify-end gap-2'>
                        <Button className='rounded-full bg-card' size='icon' variant='outline'><Link /></Button>
                        <Button className='rounded-full bg-card' size='icon' variant='outline'><GitMerge /></Button>
                        <Button className='rounded-full bg-card' size='icon' variant='outline' onClick={() => router.push(`/${ws.url}/issue/${id}/ai`)}><MousePointer2 /></Button>
                    </div>
                    <Card className='w-full ring-0 bg-card shadow-md'>
                        {readonly ? (
                            <CardContent className='flex flex-col gap-2'>
                                <div className='flex items-center gap-2 px-3 py-1 text-sm text-accent-foreground/80'>
                                    <MarkupIcon size={14} />
                                    {issue.markup}
                                </div>
                                <div className='flex items-center gap-2 px-3 py-1 text-sm text-accent-foreground/80 capitalize'>
                                    {PriorityIcon && <PriorityIcon size={14} /> || <Loader size={14} />}
                                    {issue.priority || ' No priority'}
                                </div>
                                <div className='flex items-center gap-2 px-3 py-1 text-sm text-accent-foreground/80'>
                                    {selectedAssignee ? (
                                        <>
                                            <Avatar size='sm'>
                                                <AvatarFallback variant={getAvatarVariant(selectedAssignee.name)}>
                                                    {getInitials(selectedAssignee.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            {selectedAssignee.name}
                                        </>
                                    ) : (
                                        <span className='flex items-center gap-1'><UserCircle size={14} />Assignee</span>
                                    )}
                                </div>
                                <div className='flex items-center gap-2 px-3 py-1 text-sm text-accent-foreground/80'>
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
                                    ) : (
                                        <span className='flex items-center gap-1'><Box size={14} />No project</span>
                                    )}
                                </div>
                                <div className='flex items-center gap-2 px-3 py-1 text-sm text-accent-foreground/80'>
                                    <Calendar size={14} />
                                    {issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : ' No due'}
                                </div>
                            </CardContent>
                        ) : (
                            <CardContent className='flex flex-col gap-2'>
                                {/* ✅ issue (markup) dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className='rounded-full w-fit text-accent-foreground/80' size='sm' variant='ghost'>
                                            <MarkupIcon size={14} />
                                            {issue.markup}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuGroup>
                                            <DropdownMenuRadioGroup value={issue.markup} onValueChange={handleMarkupChange}>
                                                {MARKUP_OPTIONS.map(({ label, Icon }) => (
                                                    <DropdownMenuRadioItem key={label} value={label}>
                                                        <Icon size={14} className='text-muted-foreground' />
                                                        {label}
                                                    </DropdownMenuRadioItem>
                                                ))}
                                            </DropdownMenuRadioGroup>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* ✅ Priority dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className='rounded-full w-fit text-accent-foreground/80 capitalize' size='sm' variant='ghost'>
                                            {PriorityIcon && <PriorityIcon size={14} /> || <Loader size={14} />}
                                            {issue.priority || 'Priority'}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuGroup>
                                            <DropdownMenuRadioGroup value={issue.priority ?? ''} onValueChange={handlePriorityChange}>
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

                                {/* ✅ Assignee multi-select dropdown */}
                                <DropdownMenu open={assigneeMenuOpen} onOpenChange={setAssigneeMenuOpen}>
                                    <DropdownMenuTrigger asChild disabled={teamMembers.length === 0}>
                                        <Button
                                            className='rounded-full w-fit text-accent-foreground/80'
                                            size='sm'
                                            variant='ghost'
                                            disabled={teamMembers.length === 0}
                                        >
                                            {selectedAssignee ? (
                                                <>
                                                    <Avatar size='sm'>
                                                        <AvatarFallback variant={getAvatarVariant(selectedAssignee.name)}>
                                                            {getInitials(selectedAssignee.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {selectedAssignee.name}
                                                </>
                                            ) : (
                                                <span className='flex items-center gap-1'><UserCircle size={14} />Assignee</span>
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
                                                    className='h-8 pl-7 text-sm'
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
                                                    <DropdownMenuItem
                                                        key={m.userId}
                                                        onSelect={(e) => e.preventDefault()}
                                                        onClick={() => handleAssigneeSelect(m.userId)}
                                                    >
                                                        <Avatar size='sm'>
                                                            <AvatarFallback variant={getAvatarVariant(m.name)}>
                                                                {getInitials(m.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        {m.name}
                                                        {currentAssigneeId === m.userId && <Check size={14} className='ml-auto' />}
                                                    </DropdownMenuItem>
                                                ))
                                            )}
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Project — project picker replace the project of the issue */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild disabled={projects.length === 0}>
                                        <Button
                                            className='rounded-full w-fit text-accent-foreground/80'
                                            size='sm'
                                            variant='ghost'
                                            disabled={projects.length === 0}
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
                                                <DropdownMenuRadioGroup value={currentProjectId ?? 'none'} onValueChange={handleProjectChange}>
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

                                {/* ✅ Due date picker, updates directly */}
                                <DueDatePicker
                                    value={issue.dueDate ? new Date(issue.dueDate) : undefined}
                                    onChange={handleDueDateChange}
                                    outline={false}
                                />
                            </CardContent>
                        )}
                    </Card>
                    <Card className='w-full bg-card ring-0 shadow-md'>
                        {(readonly || isBoth) ? (
                            <CardContent>
                                {issue.action === 'Hold' &&
                                    <Empty>
                                        <EmptyHeader>
                                            <PauseCircle size={18} />
                                            <EmptyTitle>Issue is on hold</EmptyTitle>
                                            <EmptyDescription>Creater has paused issue temporarily</EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                }
                                {issue.action === 'Cancelled' &&
                                    <Empty>
                                        <EmptyHeader>
                                            <Trash2 size={18} />
                                            <EmptyTitle>Issue is dropped</EmptyTitle>
                                            <EmptyDescription>Creater has cancelled the issue</EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                }
                                {issue.status === 'Pending' && !issue.action &&
                                    <Empty>
                                        <EmptyHeader>
                                            <EmptyMedia ><TextBg size='lg' className='gap-0.5 rounded-full' variant='purple'>New<Sparkles size={12} /></TextBg></EmptyMedia>
                                            <EmptyTitle>New Issue Assigned</EmptyTitle>
                                            <EmptyDescription>do you want to work with the issue?</EmptyDescription>
                                        </EmptyHeader>
                                        <EmptyContent>
                                            <div className='flex gap-2'>
                                                <Button className='cursor-pointer' variant='green' onClick={(e) => { e.preventDefault(); handleStatus("accept") }}>Accept issue</Button>
                                                <Button className='cursor-pointer' variant='destructive' onClick={(e) => { e.preventDefault(); handleStatus("refuse") }}>Refuse issue</Button>
                                            </div>
                                        </EmptyContent>
                                    </Empty>
                                }

                                {issue.status === 'Active' && !issue.action &&
                                    <div className='flex flex-col gap-4'>
                                        <div className='flex items-center gap-2'>
                                            <span>You have accepted the issue</span>
                                            <Button size='xs' className='cursor-pointer hover:opacity-90' onClick={(e) => { e.preventDefault(); handleUndo() }}>Undo</Button>
                                        </div>
                                        {(issue.subIssues ?? []).length > 0 && (
                                            <>
                                                <div className='flex items-center justify-between'>
                                                    <span className='text-sm text-muted-foreground'>Progress</span>
                                                    <span className='text-sm font-medium'>{progress}%</span>
                                                </div>
                                                <div className='w-full h-2 rounded-full bg-muted overflow-hidden'>
                                                    <div
                                                        className='h-full rounded-full bg-blue-600/60 transition-all duration-300'
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <p className='text-xs text-muted-foreground'>{doneSubs}/{totalSubs} subissue completed</p>
                                            </>
                                        )}

                                        {(totalSubs === 0 || progress === 100) &&
                                            <Button
                                                className='cursor-pointer bg-blue-600/60 text-white'
                                                onClick={(e) => { e.preventDefault(); updateIssue({ status: 'Done' }); toast('issue marked as done!', { position: 'top-right' }) }}
                                            >
                                                <CheckCheck size={16} />Mark as Done
                                            </Button>
                                        }
                                    </div>
                                }

                                {issue.status === 'Refused' && !issue.action &&
                                    <div className='flex items-center gap-2'>
                                        <span>You have refused the issue</span>
                                        <Button size='xs' onClick={(e) => { e.preventDefault(); handleUndo() }}>Undo</Button>
                                    </div>
                                }

                                {issue.status === 'Done' && !issue.action &&
                                    <Empty>
                                        <EmptyHeader>
                                            <Smile size={18} />
                                            <EmptyTitle>Congrats! You have completed the issue</EmptyTitle>
                                        </EmptyHeader>
                                        <EmptyContent>
                                            <Button
                                                size='sm'
                                                variant='ghost'
                                                className='cursor-pointer text-muted-foreground w-fit'
                                                onClick={(e) => { e.preventDefault(); updateIssue({ status: 'Active' }); toast('Reopened issue', { position: 'top-right' }) }}
                                            >
                                                Reopen
                                                <RotateCw />
                                            </Button>
                                        </EmptyContent>
                                    </Empty>
                                }
                            </CardContent>
                        ) : (
                            <CardContent>
                                {issue.action === 'Hold' &&
                                    <Empty>
                                        <EmptyHeader>
                                            <PauseCircle size={18} />
                                            <EmptyTitle>Issue is on hold</EmptyTitle>
                                            <EmptyDescription>Issue has been paused temporarily</EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                }
                                {issue.action === 'Cancelled' &&
                                    <Empty>
                                        <EmptyHeader>
                                            <Trash2 size={18} />
                                            <EmptyTitle>Issue is cancelled</EmptyTitle>
                                            <EmptyDescription>this issue has been cancelled</EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                }
                                {issue.status === 'Pending' && !issue.action &&
                                    <Empty>
                                        <EmptyHeader>
                                            <EmptyTitle>Issue not accepted yet</EmptyTitle>
                                            <EmptyDescription>send alert to the assignee</EmptyDescription>
                                        </EmptyHeader>
                                        <EmptyContent>
                                            <Button size='sm' variant='ghost'>Alert<BellRing /></Button>
                                        </EmptyContent>
                                    </Empty>
                                }
                                {issue.status === 'Active' && !issue.action &&
                                    <div className='flex flex-col gap-4'>
                                        <div className='flex items-center justify-between'>
                                            <span className='text-sm text-muted-foreground'>Progress</span>
                                            <span className='text-sm font-medium'>{progress}%</span>
                                        </div>
                                        <div className='w-full h-2 rounded-full bg-muted overflow-hidden'>
                                            <div
                                                className='h-full rounded-full bg-blue-600/60 transition-all duration-300'
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <p className='text-xs text-muted-foreground'>{doneSubs}/{totalSubs} subissue completed</p>
                                    </div>
                                }
                                {issue.status === 'Refused' && !issue.action &&
                                    <Empty>
                                        <EmptyHeader>
                                            <CircleX size={18} />
                                            <EmptyTitle>Assignee refuse the issue</EmptyTitle>
                                            <EmptyDescription>alert assignee to do the issue</EmptyDescription>
                                        </EmptyHeader>
                                        <EmptyContent>
                                            <Button size='sm' variant='ghost'>Alert<BellRing /></Button>
                                        </EmptyContent>
                                    </Empty>
                                }
                                {issue.status === 'Done' && !issue.action &&
                                    <Empty>
                                        <EmptyHeader>
                                            <Check size={18} />
                                            <EmptyTitle>Congrats! issue is completed</EmptyTitle>
                                            <EmptyDescription>any problem? you can reassign the issue</EmptyDescription>
                                        </EmptyHeader>
                                        <EmptyContent>
                                            <Button size='sm' variant='ghost' onClick={(e) => { e.preventDefault(); updateIssue({ status: 'Pending' }); toast('Issue reassigned', { position: 'top-right' }) }}  >Reassign<Redo2 /></Button>
                                        </EmptyContent>
                                    </Empty>
                                }
                            </CardContent>
                        )}
                    </Card>
                </div >
            </div >
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
        </div >
    )
}

export default Page