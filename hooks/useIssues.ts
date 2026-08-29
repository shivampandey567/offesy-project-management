// hooks/useIssues.ts
'use client'

import { useEffect, useRef, useState } from "react"
import { pusherClient } from "@/lib/pusherClient"

export const useIssues = (teamId?: string, projectId?: string) => {
    const [issues, setIssues] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const subscribed = useRef<string | null>(null)

    useEffect(() => {
        if (!teamId) {
            setIssues([])
            setLoading(false)
            return
        }
        setLoading(true)
        const qs = projectId ? `?teamId=${teamId}&projectId=${projectId}` : `?teamId=${teamId}`
        fetch(`/api/issue${qs}`)
            .then(res => res.json())
            .then(data => {
                setIssues(data.data || [])
                setLoading(false)
            })
    }, [teamId, projectId])

    useEffect(() => {
        if (!teamId || subscribed.current === teamId) return
        subscribed.current = teamId

        const channelName = `team-${teamId}`
        const channel = pusherClient?.subscribe(channelName)

        const belongsToProject = (issue: any) =>
            !projectId || String(issue.project?._id ?? issue.project) === String(projectId)

        const handleCreated = (issue: any) => {
            if (!belongsToProject(issue)) return
            setIssues(prev => prev.some(i => String(i._id) === String(issue._id)) ? prev : [issue, ...prev])
        }
        const handleUpdated = (issue: any) => {
            setIssues(prev => {
                const exists = prev.some(i => String(i._id) === String(issue._id))
                if (!belongsToProject(issue)) return prev.filter(i => String(i._id) !== String(issue._id))
                if (!exists) return [issue, ...prev]
                return prev.map(i => {
                    if (String(i._id) !== String(issue._id)) return i
                    const next = { ...i, ...issue }
                    // preserve populated assignee if the update only sent an id string
                    const prevAssigneeId = String(i.assignee?._id ?? i.assignee)
                    const nextAssigneeId = String(next.assignee?._id ?? next.assignee)
                    if (prevAssigneeId === nextAssigneeId && typeof next.assignee === 'string') {
                        next.assignee = i.assignee
                    }
                    // preserve populated project if the update only sent an id string
                    const prevProjectId = String(i.project?._id ?? i.project)
                    const nextProjectId = String(next.project?._id ?? next.project)
                    if (prevProjectId === nextProjectId && typeof next.project === 'string') {
                        next.project = i.project
                    }
                    return next
                })
            })
        }
        const handleDeleted = ({ id }: { id: string }) => {
            setIssues(prev => prev.filter(i => String(i._id) !== String(id)))
        }

        channel?.bind('issue:created', handleCreated)
        channel?.bind('issue:updated', handleUpdated)
        channel?.bind('issue:deleted', handleDeleted)

        return () => {
            // only remove this hook's listeners; leave the shared channel subscribed
            channel?.unbind('issue:created', handleCreated)
            channel?.unbind('issue:updated', handleUpdated)
            channel?.unbind('issue:deleted', handleDeleted)
            subscribed.current = null
        }
    }, [teamId, projectId])

    return { issues, loading, count: issues.length }
}