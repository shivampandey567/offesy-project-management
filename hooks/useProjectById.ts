// hooks/useProjectById.ts
'use client'

import { useEffect, useRef, useState } from "react"
import { pusherClient } from "@/lib/pusherClient"

export const useProjectById = (id: string) => {
    const [project, setProject] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const subscribed = useRef(false)

    useEffect(() => {
        if (!id) return
        setLoading(true)
        fetch(`/api/project/${id}`)
            .then(res => res.json())
            .then(data => {
                setProject(data.data)
                setLoading(false)
            })
    }, [id])

    useEffect(() => {
        if (!id || subscribed.current) return
        subscribed.current = true

        const channelName = `project-${id}`
        const channel = pusherClient?.subscribe(channelName)

        channel?.bind('project:updated', (data: Record<string, any>) => {
            setProject((prev: any) => prev ? { ...prev, ...data } : prev)
        })
        channel?.bind('project:deleted', () => {
            setProject(null)
        })

        return () => {
            pusherClient?.unsubscribe(channelName)
            subscribed.current = false
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