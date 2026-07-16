// hooks/useCreateProject.ts
'use client'

import { useState } from "react"

export const useCreateProject = () => {
    const [creating, setCreating] = useState(false)

    const createProject = async (data: Record<string, any>, workspaceId: string) => {
        setCreating(true)
        try {
            const res = await fetch('/api/project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, workspaceId })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error ? JSON.stringify(json.error) : 'Failed to create project')
            return json.data
        } finally {
            setCreating(false)
        }
    }

    return { createProject, creating }
}