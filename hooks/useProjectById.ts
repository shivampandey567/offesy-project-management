// hooks/useProjectById.ts
'use client'

import { useEffect, useRef, useState } from "react"
import { pusherClient } from "@/lib/pusherClient"

export const useProjectById = (id: string) => {
    const [project, setProject] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const subscribed = useRef<string | null>(null)

    useEffect(() => {
        if (!id) {
            setProject(null)
            setLoading(false)
            return
        }
        setLoading(true)
        fetch(`/api/project/${id}`)
            .then(res => res.json())
            .then(data => {
                setProject(data.data)
                setLoading(false)
            })
    }, [id])

    useEffect(() => {
        if (!id || subscribed.current === id) return
        subscribed.current = id

        const channelName = `project-${id}`
        const channel = pusherClient?.subscribe(channelName)

        const handleUpdated = (data: Record<string, any>) => {
            setProject((prev: any) => {
                if (!prev) return data
                const next = { ...prev, ...data }
                // preserve populated createdBy/workspaceId if the update only sent an id string
                if (next.createdBy && typeof next.createdBy === 'string' && prev.createdBy?._id && String(prev.createdBy._id) === String(next.createdBy)) {
                    next.createdBy = prev.createdBy
                }
                return next
            })
        }
        const handleDeleted = () => {
            setProject(null)
        }

        channel?.bind('project:updated', handleUpdated)
        channel?.bind('project:deleted', handleDeleted)

        return () => {
            // only remove this hook's listeners; leave the shared channel subscribed
            channel?.unbind('project:updated', handleUpdated)
            channel?.unbind('project:deleted', handleDeleted)
            subscribed.current = null
        }
    }, [id])

    const updateProject = async (fields: Record<string, any>) => {
        const res = await fetch(`/api/project/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fields)
        })
        return res.json()
    }

    const deleteProject = async () => {
        const res = await fetch(`/api/project/${id}`, { method: 'DELETE' })
        return res.json()
    }

    return { project, loading, updateProject, deleteProject }
}