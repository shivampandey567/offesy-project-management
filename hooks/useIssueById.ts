import { useEffect, useRef, useState } from "react"
import { pusherClient } from "@/lib/pusherClient"

export const useIssueById = (id: string) => {
    const [issue, setIssue] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [forbidden, setForbidden] = useState(false)
    const [isCreator, setIsCreator] = useState(false)
    const [isAssignee, setIsAssignee] = useState(false)
    const subscribed = useRef<string | null>(null)

    // GET
    useEffect(() => {
        if (!id) {
            setIssue(null)
            setLoading(false)
            setForbidden(false)
            setIsCreator(false)
            setIsAssignee(false)
            return
        }

        fetch(`/api/issue/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.error === 'Forbidden') {
                    setForbidden(true)
                    setLoading(false)
                    return
                }
                setIssue(data.data)
                setIsCreator(data.meta?.isCreator ?? false)
                setIsAssignee(data.meta?.isAssignee ?? false)
                setLoading(false)
            })
            .catch(() => {
                setIssue(null)
                setLoading(false)
            })
    }, [id])

    // Pusher
    useEffect(() => {
        if (!id || subscribed.current === id) return
        subscribed.current = id

        const channelName = `issue-${id}`
        const channel = pusherClient?.subscribe(channelName)

        const handleUpdated = (data: Record<string, any>) => {
            setIssue((prev: any) => {
                if (!prev) return data
                const next = { ...prev, ...data }
                // preserve populated assignee object if the update only sent an id string
                const prevAssigneeId = String(prev.assignee?._id ?? prev.assignee)
                const nextAssigneeId = String(next.assignee?._id ?? next.assignee)
                if (prevAssigneeId === nextAssigneeId && typeof next.assignee === 'string') {
                    next.assignee = prev.assignee
                }
                return next
            })
        }

        const handleDeleted = () => {
            setIssue(null)
        }

        channel?.bind('issue:updated', handleUpdated)
        channel?.bind('issue:deleted', handleDeleted)

        return () => {
            // only remove this hook's listeners; leave the shared channel subscribed
            channel?.unbind('issue:updated', handleUpdated)
            channel?.unbind('issue:deleted', handleDeleted)
            subscribed.current = null
        }
    }, [id])

    // PATCH
    const updateIssue = async (fields: Partial<{
        title: string
        description: string
        markup: string
        priority: string | null
        assignee: string | null
        dueDate: string | null
        status: string
        action: string | null
        subIssues: { title: string; done: boolean }[]
        attachments: any[]
        project: string | null
    }>) => {
        await fetch(`/api/issue/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fields)
        })
    }

    // DELETE
    const deleteIssue = async () => {
        await fetch(`/api/issue/${id}`, { method: 'DELETE' })
    }

    return { issue, loading, updateIssue, deleteIssue, forbidden, isCreator, isAssignee }
}