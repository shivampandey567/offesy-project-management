// hooks/useTeams.ts
'use client'

import { useEffect, useRef, useState } from "react"
import { pusherClient } from "@/lib/pusherClient"

export type Team = {
    _id: string
    name: string
    slug: string
    icon: string
    workspaceId: string
    description?: string
    members: { userId: string; role: string; joinedAt: string }[]
    createdAt: string
}

export const useTeams = (workspaceId: string) => {
    const [teams, setTeams] = useState<Team[]>([])
    const [loading, setLoading] = useState(true)
    const subscribed = useRef(false)

    useEffect(() => {
        if (!workspaceId) return

        fetch(`/api/team?workspaceId=${workspaceId}`)
            .then(res => res.json())
            .then(data => setTeams(data.data || []))
            .finally(() => setLoading(false))

        if (subscribed.current) return
        subscribed.current = true

        const channel = pusherClient.subscribe(`workspace-${workspaceId}`)

        const handleCreated = (team: Team) => {
            setTeams(prev => prev.some(t => t._id === team._id) ? prev : [team, ...prev])
        }
        const handleUpdated = (team: Team) => {
            setTeams(prev => prev.map(t => t._id === team._id ? team : t))
        }
        const handleDeleted = ({ id }: { id: string }) => {
            setTeams(prev => prev.filter(t => t._id !== id))
        }

        channel.bind('team:created', handleCreated)
        channel.bind('team:updated', handleUpdated)
        channel.bind('team:deleted', handleDeleted)

        return () => {
            // ✅ only remove THIS hook's listeners — leave the shared workspace channel subscribed
            channel.unbind('team:created', handleCreated)
            channel.unbind('team:updated', handleUpdated)
            channel.unbind('team:deleted', handleDeleted)
            subscribed.current = false
        }
    }, [workspaceId])

    const createTeam = async (payload: { name: string; icon?: string; description?: string }) => {
        const res = await fetch('/api/team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, workspaceId })
        })

        if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || 'Failed to create team')
        }

        const result = await res.json()
        return result.data
    }

    return { teams, loading, createTeam }
}