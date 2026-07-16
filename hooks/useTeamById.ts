// hooks/useTeamById.ts
'use client'

import { useEffect, useRef, useState } from "react"
import { pusherClient } from "@/lib/pusherClient"

export type Team = {
    _id: string
    name: string
    icon: string
    workspaceId: string
    description?: string
    members: { userId: string; role: string; joinedAt: string }[]
    createdAt: string
}

export const useTeamById = (slug: string, workspaceId?: string) => {
    const [team, setTeam] = useState<Team | null>(null)
    const [loading, setLoading] = useState(true)
    const subscribed = useRef<string | null>(null)

    useEffect(() => {
        if (!slug || !workspaceId) {
            setTeam(null)
            setLoading(true)
            return
        }

        setLoading(true)
        fetch(`/api/team/${slug}?workspaceId=${workspaceId}`)
            .then(res => res.json())
            .then(data => setTeam(data.data ?? null))
            .finally(() => setLoading(false))
    }, [slug, workspaceId])

    useEffect(() => {
        if (!team?._id) return
        if (subscribed.current === team._id) return

        const channel = pusherClient.subscribe(`team-${team._id}`)
        subscribed.current = team._id

        const handleUpdated = (data: Partial<Team>) => {
            setTeam(prev => prev ? { ...prev, ...data } : prev)
        }
        const handleDeleted = () => setTeam(null)

        channel.bind('team:updated', handleUpdated)
        channel.bind('team:deleted', handleDeleted)

        return () => {
            // ✅ only remove THIS hook's listeners — leave the shared channel subscribed
            channel.unbind('team:updated', handleUpdated)
            channel.unbind('team:deleted', handleDeleted)
            subscribed.current = null
        }
    }, [team?._id])

    const updateTeam = async (fields: Partial<Team>) => {
        if (!workspaceId) throw new Error('workspaceId is required')
        const res = await fetch(`/api/team/${slug}?workspaceId=${workspaceId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fields)
        })
        if (!res.ok) throw new Error('Failed to update team')
        return res.json()
    }

    const deleteTeam = async () => {
        if (!workspaceId) throw new Error('workspaceId is required')
        await fetch(`/api/team/${slug}?workspaceId=${workspaceId}`, { method: 'DELETE' })
    }

    return { team, loading, updateTeam, deleteTeam }
}