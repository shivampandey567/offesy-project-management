// hooks/useMyIssues.ts
'use client'
import { useEffect, useState } from "react"

type IssueMode = 'created' | 'assigned'

export const useMyIssues = (mode: IssueMode, workspaceId?: string) => {
    const [issues, setIssues] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        const base = mode === 'created' ? '/api/issue/created' : '/api/issue/assigned'
        const url = workspaceId ? `${base}?workspaceId=${workspaceId}` : base

        fetch(url)
            .then(res => res.json())
            .then(data => setIssues(data.data || []))
            .finally(() => setLoading(false))
    }, [mode, workspaceId])

    return { issues, loading }
}