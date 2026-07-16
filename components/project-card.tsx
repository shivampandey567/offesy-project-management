import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'
import { ChevronRight, X, SignalLow, SignalMedium, SignalHigh, MessageSquareWarning, Loader, Users, Dot, ImageIcon, Search, Check, Tag, Image } from 'lucide-react'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import TextareaAutosize from "react-textarea-autosize"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
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
import { useCreateProject } from '@/hooks/useCreateProject'

const PRIORITY_OPTIONS = [
    { label: 'None', Icon: Dot },
    { label: 'Low', Icon: SignalLow },
    { label: 'Medium', Icon: SignalMedium },
    { label: 'High', Icon: SignalHigh },
    { label: 'Urgent', Icon: MessageSquareWarning },
]

const PRESET_IMAGES = Array.from({ length: 27 }, (_, i) => `/lucy${i + 1}.svg`)

const ProjectCard = ({ onClose, icon, slug }: { onClose: () => void, icon?: string, slug: string }) => {

    // "selectedSlug" = the team most recently interacted with, shown in the header pill.
    // Defaults to the slug passed in, exactly like the reference component.
    const [selectedSlug, setSelectedSlug] = useState(slug)

    // teamId is an array on the Project schema, so we track a Set of checked slugs here
    // and always keep `selectedSlug` inside it once a team's been picked.
    const [selectedTeamSlugs, setSelectedTeamSlugs] = useState<string[]>([slug])
    const [teamMenuOpen, setTeamMenuOpen] = useState(false)

    const [memberIds, setMemberIds] = useState<string[]>([])
    const [memberSearch, setMemberSearch] = useState('')
    const [memberMenuOpen, setMemberMenuOpen] = useState(false)

    const [priority, setPriority] = useState('')
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined)

    const fileRef = useRef<HTMLInputElement>(null)
    const [presetOpen, setPresetOpen] = useState(false)
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
    const [projectIcon, setProjectIcon] = useState<string>(icon ?? '')
    const [iconPreview, setIconPreview] = useState<string | null>(null)

    const ws = useWorkspace()
    const { teams } = useTeams(ws.id)

    // kept for parity with the reference component — used to resolve the header pill's icon/name
    const { team } = useTeamById(selectedSlug, ws.id)
    const { members, loading: membersLoading } = useWorkspaceMembers(ws.id)
    const { createProject, creating } = useCreateProject()

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

    // union of members across every checked team (not just `selectedSlug`)
    const teamMembers = useMemo(() => {
        const memberIdSet = new Set<string>()
        selectedTeamSlugs.forEach((s) => {
            const t = teams?.find((tm: any) => tm.slug === s)
            t?.members?.forEach((tm: any) => memberIdSet.add(String(tm.userId)))
        })
        return WorkspaceMembers.filter((m) => memberIdSet.has(m.userId))
    }, [selectedTeamSlugs, teams, WorkspaceMembers])

    const filteredTeamMembers = useMemo(() => {
        const q = memberSearch.trim().toLowerCase()
        if (!q) return teamMembers
        return teamMembers.filter(
            (m) => m.name.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
        )
    }, [teamMembers, memberSearch])

    useEffect(() => {
        setMemberIds((prev) => {
            const next = prev.filter((id) => teamMembers.some((m) => m.userId === id))
            if (next.length === prev.length) return prev
            return next
        })
    }, [selectedTeamSlugs, teamMembers])

    useEffect(() => {
        if (!memberMenuOpen) setMemberSearch('')
    }, [memberMenuOpen])

    useEffect(() => {
        if (!teams?.length) return
        const exists = teams.some((t: any) => t.slug === selectedSlug)
        if (!exists) setSelectedSlug(teams[0].slug)
    }, [teams, selectedSlug])

    const selectedTeam = teams?.find((t: any) => t.slug === selectedSlug)
    const selectedMembers = teamMembers.filter((m) => memberIds.includes(m.userId))

    const toggleTeamSlug = (teamSlug: string) => {
        setSelectedTeamSlugs((prev) => {
            const next = prev.includes(teamSlug) ? prev.filter((s) => s !== teamSlug) : [...prev, teamSlug]
            return next
        })
        setSelectedSlug(teamSlug) // header pill follows the last team you touched
    }

    const toggleMember = (userId: string) => {
        setMemberIds((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        )
    }

    const selectedPriority = PRIORITY_OPTIONS.find((p) => p.label === priority)
    const PriorityIcon = selectedPriority?.Icon

    // ---- icon handling (file upload + preset) ----
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
            setIconPreview(compressed)
            setProjectIcon(compressed)
        } catch (err) {
            console.error('Failed to process image:', err)
        }
    }

    const handlePresetConfirm = () => {
        if (selectedPreset) {
            setIconPreview(selectedPreset)
            setProjectIcon(selectedPreset)
        }
        setPresetOpen(false)
    }
 
    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error('Project name is required', { position: 'top-right' })
            return
        }
        if (selectedTeamSlugs.length === 0) {
            toast.error('Select at least one team', { position: 'top-right' })
            return
        }

        // resolve slugs -> team Mongo _ids for the actual teamId array on the schema
        const teamIds = selectedTeamSlugs
            .map((s) => teams?.find((t: any) => t.slug === s)?._id)
            .filter(Boolean)

        try {
            await createProject({
                icon: projectIcon,
                name: name.trim(),
                description,
                priority: priority || null,
                teamId: teamIds,
                members: memberIds,
                dueDate: dueDate ? dueDate.toISOString() : undefined,
            }, ws.id)
            toast.success('Project created', { position: 'top-right' })
            onClose()
        } catch (err) {
            console.error(err)
            toast.error('Failed to create project', { position: 'top-right' })
        }
    }

    return (
        <div
            onClick={onClose}
            className='fixed flex inset-0 z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 justify-center items-center'
        >
            <Card
                onClick={(e) => e.stopPropagation()}
                className='fixed w-full rounded-4xl flex flex-col justify-between ring-0 top-25 h-[50vh] md:h-[60vh] max-w-sm md:max-w-2xl'
            >
                <CardHeader className=''>
                    <CardTitle className='flex items-center gap-1'>
                        <DropdownMenu open={teamMenuOpen} onOpenChange={setTeamMenuOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button className='rounded-full pl-1' variant='outline' size='xs'>
                                    {selectedTeam?.icon ?? icon}
                                    {selectedTeamSlugs.length > 1
                                        ? `${selectedTeam?.slug ?? slug} +${selectedTeamSlugs.length - 1}`
                                        : selectedTeam?.slug ?? slug}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="min-w-56">
                                <DropdownMenuGroup>
                                    {teams.map((t: any) => (
                                        <DropdownMenuCheckboxItem
                                            key={t.slug}
                                            checked={selectedTeamSlugs.includes(t.slug)}
                                            onSelect={(e) => e.preventDefault()}
                                            onCheckedChange={() => toggleTeamSlug(t.slug)}
                                        >
                                            {t.icon}
                                            {t.name}
                                            <span className='text-muted-foreground ml-1'>{t.slug}</span>
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <ChevronRight size={12} className='text-accent-foreground/80' />
                        <span className='text-accent-foreground/80 text-sm'>New project</span>
                    </CardTitle>
                    <CardAction className='flex gap-1'>
                        <Button onClick={onClose} className='rounded-full' size='icon-sm' variant='ghost'><X /></Button>
                    </CardAction>
                </CardHeader>
                <CardContent className='flex flex-col flex-1 min-h-0 w-full overflow-hidden'>
                    <ScrollArea className="w-full">
                        <div className="grid w-full">
                            <TextareaAutosize
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Project name"
                                className="max-w-full resize-none overflow-hidden bg-transparent px-2 py-1 text-base outline-none border-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:border-none !text-xl text-accent-foreground font-bold"
                            />
                        </div>
                        <div className="grid w-full">
                            <TextareaAutosize
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add a description..."
                                className="max-w-full min-h-15 resize-none overflow-hidden bg-transparent px-2 py-1 text-base outline-none border-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:border-none md:text-md text-accent-foreground/80 font-medium"
                            />
                        </div>

                        {/* Icon: upload or preset — now actually wired up */}
                        <div>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
                            <div
                                onClick={() => fileRef.current?.click()}
                                className="h-30 w-full border-1 border-dashed rounded-md flex items-center justify-center cursor-pointer hover:border-[#5b4cf5] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors overflow-hidden"
                            >
                                {iconPreview ? (
                                    <img src={iconPreview} alt="project icon" className="w-full h-full object-contain p-3" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-gray-400">
                                        <ImageIcon className="w-6 h-6" />
                                        <span className="text-xs">Click to upload project icon</span>
                                    </div>
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-fit mt-2 cursor-pointer"
                                onClick={() => setPresetOpen(true)}
                            >
                                <Image />Browse images
                            </Button>
                        </div>

                    </ScrollArea>
                </CardContent>
                <CardFooter className='bg-card border-none flex flex-col gap-4 items-start'>
                    <div className='flex flex-wrap items-center gap-2 '>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size='sm' className='rounded-full capitalize'>
                                    {PriorityIcon ? <PriorityIcon size={14} /> : <Loader size={14} />}
                                    {priority || 'Priority'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuGroup>
                                    {PRIORITY_OPTIONS.map(({ label, Icon }) => (
                                        <DropdownMenuCheckboxItem
                                            key={label}
                                            checked={priority === label || (label === 'None' && !priority)}
                                            onSelect={(e) => e.preventDefault()}
                                            onCheckedChange={() => setPriority(label === 'None' ? '' : label)}
                                            className='capitalize'
                                        >
                                            <Icon size={14} className='text-muted-foreground' />
                                            {label}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu open={memberMenuOpen} onOpenChange={setMemberMenuOpen}>
                            <DropdownMenuTrigger asChild disabled={membersLoading || teamMembers.length === 0}>
                                <Button
                                    className='rounded-full'
                                    variant='outline'
                                    size='sm'
                                    disabled={membersLoading || teamMembers.length === 0}
                                >
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
                                    ) : membersLoading ? (
                                        'Loading…'
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
                                                checked={memberIds.includes(m.userId)}
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

                        <DueDatePicker value={dueDate} onChange={setDueDate} />
                    </div>
                    <div className='flex w-full items-center justify-end'>
                        <Button
                            className='rounded-full'
                            variant='blue'
                            size='sm'
                            disabled={creating}
                            onClick={handleCreate}
                        >
                            {creating ? 'Creating...' : 'Create project'}
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {/* Preset picker */}
            {presetOpen && (
                <div onClick={(e) => e.stopPropagation()} className='fixed inset-0 z-[60] flex items-center justify-center bg-black/20'>
                    <Card className='max-w-sm md:max-w-md p-4'>
                        <CardHeader>
                            <CardTitle>Choose a preset image</CardTitle>
                            <CardAction><Button variant='ghost' size='icon-sm' onClick={() => setPresetOpen(false)}><X /></Button></CardAction>
                        </CardHeader>
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
                        <CardFooter className='flex justify-end gap-2 pt-3 bg-card border-none'>
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

export default ProjectCard