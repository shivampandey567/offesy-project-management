// hooks/useIssues.ts
'use client'

import { useEffect, useRef, useState } from "react"
import { pusherClient } from "@/lib/pusherClient"

export const useIssues = (teamId?: string, projectId?: string) => {
    const [issues, setIssues] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const subscribed = useRef(false)

    useEffect(() => {
        if (!teamId) return
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
        if (!teamId || subscribed.current) return
        subscribed.current = true

        const channelName = `team-${teamId}`
        const channel = pusherClient?.subscribe(channelName)

        const belongsToProject = (issue: any) =>
            !projectId || String(issue.project?._id ?? issue.project) === String(projectId)

        channel?.bind('issue:created', (issue: any) => {
            if (!belongsToProject(issue)) return
            setIssues(prev => prev.some(i => String(i._id) === String(issue._id)) ? prev : [issue, ...prev])
        })
        channel?.bind('issue:updated', (issue: any) => {
            setIssues(prev => {
                const exists = prev.some(i => String(i._id) === String(issue._id))
                if (!belongsToProject(issue)) return prev.filter(i => String(i._id) !== String(issue._id))
                if (!exists) return [issue, ...prev]
                return prev.map(i => String(i._id) === String(issue._id) ? { ...i, ...issue } : i)
            })
        })
        channel?.bind('issue:deleted', ({ id }: { id: string }) => {
            setIssues(prev => prev.filter(i => String(i._id) !== String(id)))
        })

        return () => {
            pusherClient?.unsubscribe(channelName)
            subscribed.current = false
        }
    }, [teamId, projectId])

    return { issues, loading, count: issues.length }
}