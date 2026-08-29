// hooks/useProjects.ts
'use client'

import { useEffect, useRef, useState } from "react"
import { pusherClient } from "@/lib/pusherClient"

export const useProjects = (workspaceId: string, teamId?: string) => {
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const subscribed = useRef<string | null>(null)

    useEffect(() => {
        if (!workspaceId || !teamId) {
            setProjects([])
            setLoading(false)
            return
        }
        setLoading(true)
        fetch(`/api/project?workspaceId=${workspaceId}&teamId=${teamId}`)
            .then(res => res.json())
            .then(data => {
                setProjects(data.data || [])
                setLoading(false)
            })
    }, [workspaceId, teamId])

    useEffect(() => {
        if (!workspaceId || !teamId || subscribed.current === `${workspaceId}:${teamId}`) return
        subscribed.current = `${workspaceId}:${teamId}`

        const channelName = `workspace-${workspaceId}`
        const channel = pusherClient?.subscribe(channelName)

        const belongsToTeam = (project: any) =>
            (project.teamId ?? []).map(String).includes(String(teamId))

        const handleCreated = (project: any) => {
            if (!belongsToTeam(project)) return
            setProjects(prev => prev.some(p => String(p._id) === String(project._id)) ? prev : [project, ...prev])
        }
        const handleUpdated = (project: any) => {
            setProjects(prev => {
                const exists = prev.some(p => String(p._id) === String(project._id))
                if (!belongsToTeam(project)) return prev.filter(p => String(p._id) !== String(project._id))
                if (!exists) return [project, ...prev]
                return prev.map(p => String(p._id) === String(project._id) ? { ...p, ...project } : p)
            })
        }
        const handleDeleted = ({ id }: { id: string }) => {
            setProjects(prev => prev.filter(p => String(p._id) !== String(id)))
        }

        channel?.bind('project:created', handleCreated)
        channel?.bind('project:updated', handleUpdated)
        channel?.bind('project:deleted', handleDeleted)

        return () => {
            // ✅ only remove this hook's listeners; leave the shared workspace channel subscribed
            channel?.unbind('project:created', handleCreated)
            channel?.unbind('project:updated', handleUpdated)
            channel?.unbind('project:deleted', handleDeleted)
            subscribed.current = null
        }
    }, [workspaceId, teamId])

    return { projects, loading, count: projects.length }
}