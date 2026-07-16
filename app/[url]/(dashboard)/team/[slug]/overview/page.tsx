'use client'

import { useParams, usePathname, useRouter } from "next/navigation"
import { useTeamById } from "@/hooks/useTeamById"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useWorkspace } from "@/lib/workspace-context"
import Link from "next/link"
import TextareaAutosize from "react-textarea-autosize"
import { useEffect, useMemo, useRef, useState } from "react"
import AppHeader from "@/components/app-header"
import { useWorkspaceMembers } from "@/hooks/useWorkspaceMembers"
import { Avatar, AvatarFallback, getAvatarVariant, getInitials } from "@/components/ui/avatar"
import { Box, Layers2, Plus } from "lucide-react"

const Page = () => {
    const { slug } = useParams() as { slug: string }
    const ws = useWorkspace()
    const router = useRouter()
    const pathname = usePathname()
    const { team, loading, deleteTeam, updateTeam } = useTeamById(slug, ws.id)
    const { members, loading: membersLoading } = useWorkspaceMembers(ws.id)


    const [description, setDescription] = useState('')
    const [saved, setSaved] = useState(true)
    const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // sync description when team loads
    useEffect(() => {
        if (team?.description) setDescription(team.description)
    }, [team?.description])

    const teamMembers = useMemo(() => {
        return (team?.members ?? [])
            .map((tm) => {
                const wm = members.find((m) => m.id === String(tm.userId))
                return wm ? { ...wm, role: tm.role } : null
            })
            .filter((m): m is NonNullable<typeof m> => m !== null)
    }, [team?.members, members])

    const saveDescription = async (value: string) => {
        await updateTeam({ description: value })
        setSaved(true)
    }

    const handleDescriptionChange = (value: string) => {
        setDescription(value)
        setSaved(false)

        // clear previous timer
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current)

        // autosave after 1.5 seconds
        autoSaveRef.current = setTimeout(() => {
            saveDescription(value)
        }, 1500)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
            saveDescription(description)
        }
    }

    // cleanup on unmount
    useEffect(() => {
        return () => {
            if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
        }
    }, [])

    if (loading) return (
        <div className="p-6 flex flex-col gap-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-32 w-full" />
        </div>
    )

    if (!team) return (
        <div className="p-6 text-muted-foreground text-sm">Team not found</div>
    )

    const handleDelete = async () => {
        await deleteTeam()
        toast.success('Team deleted', { position: 'top-right' })
        router.push(`/${ws.url}/teams`)
    }

    return (
        <div className="w-full h-full">
            <AppHeader icon={team?.icon} title={team?.name} onStarClick={() => (console.log('hello'))} onMenuClick={() => console.log('menu')} onLinkClick={() => console.log('bye')} />
            <div className='flex flex-1 flex-col gap-8 p-2'>
                <div className="flex items-center gap-2">
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

                <div className='flex flex-col gap-8 md:gap-20 md:grid grid-cols-[7fr_3fr] items-start'>
                    <div className="flex flex-col gap-2 pl-4 md:pl-15 lg:pl-30 min-w-0">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{team.icon}</span>
                            <span className="text-2xl font-semibold">{team.name}</span>
                        </div>

                        <div className="relative w-full">
                            <TextareaAutosize
                                value={description}
                                onChange={(e) => handleDescriptionChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Add a description..."
                                className="w-full max-w-full resize-none bg-transparent px-2 py-2 text-base outline-none border-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:border-none md:text-md text-accent-foreground/80"
                            />
                        </div>

                        <div className="flex flex-col gap-2 pt-4">
                            <span className="flex items-center justify-between"><span className="text-lg font-medium">Pinned resources</span><Button className="rounded-full bg-card" variant='outline' size='icon-sm'><Plus/></Button></span>
                            <span className="text-md text-muted-foreground">Add documents and links and organize them</span>
                        </div>
                    </div>

                    <div className="pl-4 md:pl-0 flex flex-col gap-8">
                        <div className="flex flex-col gap-3">
                            <span className="text-sm text-accent-foreground/80">Members</span>
                            {membersLoading ? (
                                <div className="flex flex-col gap-2">
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-6 w-28" />
                                </div>
                            ) : teamMembers.length === 0 ? (
                                <span className="text-muted-foreground text-sm">No members yet</span>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {teamMembers.map((m) => (
                                        <div key={m.id} className="flex items-center gap-2">
                                            <Avatar size="sm">
                                                <AvatarFallback variant={getAvatarVariant(m.name)}>
                                                    {getInitials(m.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-muted-foreground text-sm">{m.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-3">
                            <span className="text-accent-foreground/80 text-sm">Go to</span>
                            <Link href={`/${ws.url}/team/${slug}/issues`}><span><Button variant='link' size='sm' className="p-0 text-accent-foreground/80"><Layers2/>Issues</Button></span></Link>
                            <Link href={`/${ws.url}/team/${slug}/projects`}><span><Button variant='link' size='sm' className="p-0 text-accent-foreground/80"><Box/>Projects</Button></span></Link>
                        </div>
                    </div>
                </div >
            </div>
        </div>
    )
}

export default Page