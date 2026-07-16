'use client'
import AppHeader from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, getAvatarVariant, getInitials } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
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
} from '@/components/ui/dropdown-menu'
import { DueDatePicker } from '@/components/date-picker'
import { useProjectById } from '@/hooks/useProjectById'
import { useTeams } from '@/hooks/useTeams'
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers'
import { useWorkspace } from '@/lib/workspace-context'
import { Check, ImageIcon, Loader, MessageSquareWarning, Search, SignalHigh, SignalLow, SignalMedium, Users, Dot, X, LayoutGrid, Circle, CircleDot, CircleCheck, CircleX, PauseCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import TextareaAutosize from "react-textarea-autosize"
import { toast } from 'sonner'

const PRIORITY_OPTIONS = [
    { label: 'None', Icon: Dot },
    { label: 'Low', Icon: SignalLow },
    { label: 'Medium', Icon: SignalMedium },
    { label: 'High', Icon: SignalHigh },
    { label: 'Urgent', Icon: MessageSquareWarning },
]

const STATUS_OPTIONS = [
    { label: 'Pending', Icon: Circle },
    { label: 'Planned', Icon: CircleDot },
    { label: 'Active', Icon: CircleDot },
    { label: 'Completed', Icon: CircleCheck },
    { label: 'Cancelled', Icon: CircleX },
]

const PRESET_IMAGES = Array.from({ length: 27 }, (_, i) => `/lucy${i + 1}.svg`)

const Page = () => {
    const { id } = useParams() as { id: string }
    const ws = useWorkspace()
    const router = useRouter()
    const pathname = usePathname()
    const { project, loading, updateProject } = useProjectById(id)
    const { members } = useWorkspaceMembers(ws.id)
    const { teams } = useTeams(ws.id)

    // ---- name / description: local state, autosave on blur ----
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const initializedRef = useRef(false)

    useEffect(() => {
        if (project && !initializedRef.current) {
            setName(project.name ?? '')
            setDescription(project.description ?? '')
            initializedRef.current = true
        }
    }, [project])

    const handleNameBlur = () => {
        if (project && name !== project.name) {
            updateProject({ name })
        }
    }

    const handleDescriptionBlur = () => {
        if (project && description !== (project.description ?? '')) {
            updateProject({ description })
        }
    }

    // ---- icon: preset picker + file upload ----
    const fileRef = useRef<HTMLInputElement>(null)
    const [presetOpen, setPresetOpen] = useState(false)
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const img = new window.Image()
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const maxSize = 200
                    let { width, height } = img
                    if (width > height) {
                        if (width > maxSize) { height = height * (maxSize / width); width = maxSize }
                    } else {
                        if (height > maxSize) { width = width * (maxSize / height); height = maxSize }
                    }
                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    if (!ctx) return reject(new Error('canvas context failed'))
                    ctx.drawImage(img, 0, 0, width, height)
                    resolve(canvas.toDataURL('image/jpeg', 0.7))
                }
                img.onerror = reject
                img.src = e.target?.result as string
            }
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
    }

    const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            const compressed = await compressImage(file)
            await updateProject({ icon: compressed })
            toast('Project icon updated', { position: 'top-right' })
        } catch (err) {
            console.error('Failed to process image:', err)
            toast.error('Failed to update icon', { position: 'top-right' })
        }
    }

    const handlePresetConfirm = async () => {
        if (!selectedPreset) return
        await updateProject({ icon: selectedPreset })
        toast('Project icon updated', { position: 'top-right' })
        setPresetOpen(false)
        setSelectedPreset(null)
    }

    // ---- status ----
    const status = project?.status ?? 'Pending'
    const selectedStatus = STATUS_OPTIONS.find((s) => s.label === status)
    const StatusIcon = selectedStatus?.Icon ?? Circle

    const handleStatusChange = (val: string) => {
        updateProject({ status: val })
    }

    // ---- priority ----
    const priority = project?.priority ?? ''
    const selectedPriority = PRIORITY_OPTIONS.find((p) => p.label === priority)
    const PriorityIcon = selectedPriority?.Icon

    const handlePriorityChange = (val: string) => {
        const next = val === 'None' ? null : val
        updateProject({ priority: next })
    }

    // ---- members ----
    const [memberSearch, setMemberSearch] = useState('')
    const [memberMenuOpen, setMemberMenuOpen] = useState(false)

    const WorkspaceMembers = useMemo(
        () => members.map((m) => ({ userId: m.id, name: m.name, email: m.email || undefined })),
        [members]
    )

    const projectMemberIds: string[] = (project?.members ?? []).map(String)
    const selectedMembers = WorkspaceMembers.filter((m) => projectMemberIds.includes(m.userId))

    const filteredMembers = useMemo(() => {
        const q = memberSearch.trim().toLowerCase()
        if (!q) return WorkspaceMembers
        return WorkspaceMembers.filter((m) => m.name.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q))
    }, [WorkspaceMembers, memberSearch])

    const toggleMember = (userId: string) => {
        const next = projectMemberIds.includes(userId)
            ? projectMemberIds.filter((mid) => mid !== userId)
            : [...projectMemberIds, userId]
        updateProject({ members: next })
    }

    useEffect(() => {
        if (!memberMenuOpen) setMemberSearch('')
    }, [memberMenuOpen])

    // ---- due date ----
    const dueDate = project?.dueDate ? new Date(project.dueDate) : undefined
    const handleDueDateChange = (date: Date | undefined) => {
        if (!date) return
        updateProject({ dueDate: date.toISOString() })
    }

    // ---- teams (min 1 required, matches ProjectCard guard) ----
    const [teamMenuOpen, setTeamMenuOpen] = useState(false)
    const projectTeamIds: string[] = (project?.teamId ?? []).map(String)
    const selectedTeams = (teams ?? []).filter((t: any) => projectTeamIds.includes(String(t._id)))

    const toggleProjectTeam = (teamId: string) => {
        const isRemoving = projectTeamIds.includes(teamId)
        if (isRemoving && projectTeamIds.length === 1) return // guard: keep at least 1 team

        const next = isRemoving
            ? projectTeamIds.filter((tid) => tid !== teamId)
            : [...projectTeamIds, teamId]

        updateProject({ teamId: next })
    }

    if (loading) return <div className='p-6 text-sm text-muted-foreground'>Loading...</div>
    if (!project) return <div className='p-6 text-sm text-muted-foreground'>Project not found</div>

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
            <div className='flex flex-col flex-1 py-4 px-6 sm:px-12 md:px-20 lg:px-30 xl:px-50 gap-2'>
                {/* Icon — click to open preset/upload */}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
                <div
                    onClick={() => setPresetOpen(true)}
                    className='w-20 h-20 mb-2 cursor-pointer rounded-lg hover:opacity-80 transition-opacity relative group'
                >
                    {project?.icon ? (
                        <img src={project.icon} className='w-20 h-20 object-contain rounded-lg' />
                    ) : (
                        <div className='w-20 h-20 rounded-lg bg-muted flex items-center justify-center'>
                            <ImageIcon className='text-muted-foreground' />
                        </div>
                    )}
                    <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors' />
                </div>

                <div className='relative w-full min-w-0'>
                    <TextareaAutosize
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleNameBlur}
                        placeholder="Project name"
                        className="w-full max-w-full resize-none bg-transparent px-1 outline-none border-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:border-none !text-2xl font-semibold text-accent-foreground"
                    />
                </div>
                <div className="relative w-full min-w-0">
                    <TextareaAutosize
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={handleDescriptionBlur}
                        placeholder='Add a description...'
                        className="w-full max-w-full resize-none bg-transparent px-1 text-base outline-none border-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:border-none md:text-md text-accent-foreground/80"
                    />
                </div>

                {/* Status / Priority / Members / Due date / Teams row */}
                <div className='flex flex-wrap items-center gap-2 pt-2'>

                    {/* Status — first in row */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size='sm' className='rounded-full capitalize'>
                                <StatusIcon size={14} />
                                {status}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuGroup>
                                <DropdownMenuRadioGroup value={status} onValueChange={handleStatusChange}>
                                    {STATUS_OPTIONS.map(({ label, Icon }) => (
                                        <DropdownMenuRadioItem key={label} value={label} className='capitalize'>
                                            <Icon size={14} className='text-muted-foreground' />
                                            {label}
                                        </DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size='sm' className='rounded-full capitalize'>
                                {PriorityIcon ? <PriorityIcon size={14} /> : <Loader size={14} />}
                                {priority || 'Priority'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuGroup>
                                <DropdownMenuRadioGroup value={priority || 'None'} onValueChange={handlePriorityChange}>
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

                    <DropdownMenu open={memberMenuOpen} onOpenChange={setMemberMenuOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button className='rounded-full' variant='outline' size='sm'>
                                {selectedMembers.length > 0 ? (
                                    <>
                                        <div className='flex -ml-1 items-center -space-x-2'>
                                            {selectedMembers.slice(0, 3).map((m) => (
                                                <Avatar key={m.userId} size='sm'>
                                                    <AvatarFallback variant={getAvatarVariant(m.name)}>
                                                        {getInitials(m.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            ))}
                                        </div>
                                        {selectedMembers.length === 1
                                            ? selectedMembers[0].name
                                            : selectedMembers.length > 3
                                                ? `+${selectedMembers.length - 3} more`
                                                : `${selectedMembers.length}`}
                                    </>
                                ) : (
                                    <span className='flex items-center gap-1'><Users size={14} />Members</span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="min-w-64" onCloseAutoFocus={(e) => e.preventDefault()}>
                            <div className='px-2 py-1.5'>
                                <div className='relative'>
                                    <Search size={13} className='absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground' />
                                    <Input
                                        autoFocus
                                        value={memberSearch}
                                        onChange={(e) => setMemberSearch(e.target.value)}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        placeholder='Search members...'
                                        className='h-8 pl-7 text-sm'
                                    />
                                </div>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup className='max-h-56 overflow-y-auto'>
                                {filteredMembers.length === 0 ? (
                                    <DropdownMenuLabel className='text-muted-foreground font-normal'>
                                        No members found
                                    </DropdownMenuLabel>
                                ) : (
                                    filteredMembers.map((m) => (
                                        <DropdownMenuCheckboxItem
                                            key={m.userId}
                                            checked={projectMemberIds.includes(m.userId)}
                                            onSelect={(e) => e.preventDefault()}
                                            onCheckedChange={() => toggleMember(m.userId)}
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

                    <DueDatePicker value={dueDate} onChange={handleDueDateChange} />

                    {/* Teams — last in row, min 1 required */}
                    <DropdownMenu open={teamMenuOpen} onOpenChange={setTeamMenuOpen}>
                        <DropdownMenuTrigger asChild disabled={!teams?.length}>
                            <Button variant="outline" size='sm' className='rounded-full'>
                                {selectedTeams.length > 0 ? (
                                    selectedTeams.length === 1
                                        ? <>{selectedTeams[0].icon}{selectedTeams[0].name}</>
                                        : `${selectedTeams.length} teams`
                                ) : (
                                    <span className='flex items-center gap-1'><LayoutGrid size={14} />Teams</span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="min-w-56" align='end'>
                            <DropdownMenuGroup>
                                {(teams ?? []).map((t: any) => {
                                    const tid = String(t._id)
                                    const isChecked = projectTeamIds.includes(tid)
                                    const isLastOne = isChecked && projectTeamIds.length === 1

                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={tid}
                                            checked={isChecked}
                                            disabled={isLastOne}
                                            onSelect={(e) => e.preventDefault()}
                                            onCheckedChange={() => toggleProjectTeam(tid)}
                                            className={isLastOne ? 'opacity-60 cursor-not-allowed' : ''}
                                        >
                                            {t.icon}
                                            {t.name}
                                            <span className='text-muted-foreground ml-1'>{t.slug}</span>
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Icon preset dialog */}
            {presetOpen && (
                <div onClick={() => setPresetOpen(false)} className='fixed inset-0 z-[60] flex items-center justify-center bg-black/20'>
                    <Card onClick={(e) => e.stopPropagation()} className='max-w-sm md:max-w-md p-4'>
                        <CardHeader>
                            <CardTitle>Update project icon</CardTitle>
                            <CardAction><Button variant='ghost' size='icon-sm' onClick={() => setPresetOpen(false)}><X /></Button></CardAction>
                        </CardHeader>
                        <CardContent className='px-0'>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full mb-3 cursor-pointer"
                                onClick={() => fileRef.current?.click()}
                            >
                                <ImageIcon className="w-4 h-4 mr-2" />Upload from device
                            </Button>
                            <ScrollArea className="h-72">
                                <div className="grid grid-cols-3 gap-3 py-1 pr-3">
                                    {PRESET_IMAGES.map((src) => (
                                        <div
                                            key={src}
                                            onClick={() => setSelectedPreset(src)}
                                            className={`relative h-20 border-2 rounded-md flex items-center justify-center cursor-pointer overflow-hidden transition-colors ${selectedPreset === src
                                                ? "border-[#5b4cf5] bg-[#5b4cf5]/5"
                                                : "border-slate-200 hover:border-[#5b4cf5]"
                                                }`}
                                        >
                                            <img src={src} alt="preset" className="w-full h-full object-contain p-2" />
                                            {selectedPreset === src && (
                                                <div className="absolute top-1 right-1 w-5 h-5 bg-[#5b4cf5] rounded-full flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className='flex justify-end gap-2 px-0 bg-card border-none'>
                            <Button variant="ghost" onClick={() => setPresetOpen(false)}>Cancel</Button>
                            <Button variant="blue" onClick={handlePresetConfirm} disabled={!selectedPreset}>
                                Use this image
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    )
}

export default Page