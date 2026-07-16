'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function InvitePage() {
    const { token } = useParams() as { token: string }
    const router = useRouter()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const accept = async () => {
            try {
                const res = await fetch(`/api/invite/${token}`, { method: 'POST' })
                const data = await res.json()

                if (!res.ok) {
                    setStatus('error')
                    setMessage(data.error || 'Something went wrong')
                    return
                }

                setStatus('success')
                setTimeout(() => {
                    router.push(`/${data.workspaceUrl}/inbox`)
                }, 1500)
            } catch {
                setStatus('error')
                setMessage('Something went wrong')
            }
        }
        accept()
    }, [token])

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="max-w-md text-center flex flex-col items-center gap-4">
                {status === 'loading' && <p className="text-muted-foreground">Accepting invite...</p>}
                {status === 'success' && (
                    <>
                        <h1 className="text-2xl font-semibold">You're in!</h1>
                        <p className="text-muted-foreground">Redirecting to workspace...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <h1 className="text-2xl font-semibold text-destructive">Invite invalid</h1>
                        <p className="text-muted-foreground">{message}</p>
                        <Button onClick={() => router.push('/')}>Back home</Button>
                    </>
                )}
            </div>
        </div>
    )
}