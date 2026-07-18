'use client'
import { useEffect, useRef, useState } from "react"
import { pusherClient } from "@/lib/pusherClient"

export type Reaction = {
    emoji: string
    users: string[]
}

export type CommentAttachment = {
    url: string
    name: string
    type: string
    size: number
    isImage: boolean
}

export type Comment = {
    _id: string
    targetType: 'issue' | 'project'
    targetId: string
    workspaceId: string
    authorId: string
    text: string
    attachment?: CommentAttachment
    edited?: boolean
    createdAt: string
    updatedAt: string
    reactions?: Reaction[]
}

export const useComments = (
    targetType: 'issue' | 'project',
    targetId: string,
    workspaceId: string
) => {
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [posting, setPosting] = useState(false)
    const subscribed = useRef(false)

    useEffect(() => {
        if (!targetId) return
        setLoading(true)
        fetch(`/api/comments?targetType=${targetType}&targetId=${targetId}`)
            .then(res => res.json())
            .then(data => {
                setComments(data.data || [])
                setLoading(false)
            })
    }, [targetType, targetId])

    useEffect(() => {
        if (!targetId || subscribed.current) return
        subscribed.current = true

        const channelName = `${targetType}-comments-${targetId}`
        const channel = pusherClient?.subscribe(channelName)

        const onCreated = (comment: Comment) => {
            setComments(prev => prev.some(c => c._id === comment._id) ? prev : [...prev, comment])
        }
        const onUpdated = (comment: Comment) => {
            setComments(prev => prev.map(c => c._id === comment._id ? comment : c))
        }
        const onDeleted = ({ id }: { id: string }) => {
            setComments(prev => prev.filter(c => c._id !== id))
        }
        const onReaction = ({ _id, reactions }: { _id: string; reactions: Reaction[] }) => {
            setComments(prev => prev.map(c => c._id === _id ? { ...c, reactions } : c))
        }

        channel?.bind('comment:created', onCreated)
        channel?.bind('comment:updated', onUpdated)
        channel?.bind('comment:deleted', onDeleted)
        channel?.bind('comment:reaction', onReaction)

        return () => {
            channel?.unbind('comment:created', onCreated)
            channel?.unbind('comment:updated', onUpdated)
            channel?.unbind('comment:deleted', onDeleted)
            channel?.unbind('comment:reaction', onReaction)
            subscribed.current = false
        }
    }, [targetType, targetId])

    const addComment = async (text: string, attachment?: CommentAttachment) => {
        setPosting(true)
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetType, targetId, workspaceId, text, attachment }),
            })
            if (!res.ok) throw new Error('Failed to post comment')
        } finally {
            setPosting(false)
        }
    }

    const editComment = async (id: string, text: string) => {
        await fetch(`/api/comments/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        })
    }

    const deleteComment = async (id: string) => {
        await fetch(`/api/comments/${id}`, { method: 'DELETE' })
    }

    const toggleReaction = async (id: string, emoji: string, currentUserId: string) => {
        setComments(prev => prev.map(c => {
            if (c._id !== id) return c
            const reactions: Reaction[] = [...(c.reactions ?? [])]
            const existing = reactions.find(r => r.emoji === emoji)
            if (!existing) {
                return { ...c, reactions: [...reactions, { emoji, users: [currentUserId] }] }
            }
            const users = existing.users.includes(currentUserId)
                ? existing.users.filter((u: string) => u !== currentUserId)
                : [...existing.users, currentUserId]
            const next = reactions
                .map(r => r.emoji === emoji ? { ...r, users } : r)
                .filter(r => r.users.length > 0)
            return { ...c, reactions: next }
        }))

        try {
            const res = await fetch(`/api/comments/${id}/reactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emoji }),
            })
            if (!res.ok) throw new Error('Failed to toggle reaction')
        } catch {
            // Revert on failure by re-fetching is safest; for now just rely on Pusher reconciliation.
        }
    }

    return { comments, loading, posting, addComment, editComment, deleteComment, toggleReaction }
}