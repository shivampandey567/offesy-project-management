// /hooks/useCreateWorkspace.ts
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

type UrlStatus = 'idle' | 'checking' | 'available' | 'taken'

export const useCreateWorkspace = () => {
    const [urlStatus, setUrlStatus] = useState<UrlStatus>('idle')
    const [isCreating, setIsCreating] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const router = useRouter()

    const checkUrl = (url: string) => {
        if (!url || url.length < 3) {
            setUrlStatus('idle')
            return
        }

        setUrlStatus('checking')

        if (debounceRef.current) clearTimeout(debounceRef.current)

        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/join/check?url=${encodeURIComponent(url)}`)
                if (!res.ok) throw new Error('Check failed')
                const data = await res.json()
                setUrlStatus(data.available ? 'available' : 'taken')
            } catch {
                setUrlStatus('idle')
            }
        }, 500)
    }

    const createWorkspace = async (data: { name: string; url: string }) => {
        setIsCreating(true)
        try {
            const res = await fetch('/api/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to create workspace')
            }
            const result = await res.json()
            const url = result.data.url

            // check if user has a name
            const userRes = await fetch('/api/me')
            const userData = await userRes.json()

            if (userData.name) {
                router.push(`/${url}/inbox`)
            } else {
                router.push(`/${url}/welcome`)
            }

            return result
        } finally {
            setIsCreating(false)
        }
    }

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [])

    return { urlStatus, checkUrl, createWorkspace, isCreating }
}