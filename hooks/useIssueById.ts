import { useEffect, useRef, useState } from "react"
import { pusherClient } from "@/lib/pusherClient"

export const useIssueById = (id: string) => {
    const [issue, setIssue] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [forbidden, setForbidden] = useState(false)
    const [isCreator, setIsCreator] = useState(false)
    const [isAssignee, setIsAssignee] = useState(false)
    const subscribed = useRef(false)

    // GET
    useEffect(() => {
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
            .catch(() => setLoading(false))
    }, [id])
    // Pusher
    useEffect(() => {
        if (subscribed.current) return
        subscribed.current = true

        const channel = pusherClient?.subscribe(`issue-${id}`)

        channel?.bind('issue:updated', (data: Record<string, any>) => {
            setIssue((prev: any) => ({ ...prev, ...data }))
        })

        channel?.bind('issue:deleted', () => {
            setIssue(null)
        })

        return () => {
            pusherClient?.unsubscribe(`issue-${id}`)
            subscribed.current = false
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