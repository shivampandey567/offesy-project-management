//[url]/page.tsx
'use client'

import { useWorkspace } from '@/lib/workspace-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const Page = () => {
    const router = useRouter()
    const ws = useWorkspace()

    useEffect(() => {
        router.push(`/${ws.url}/inbox`)
    }, [])

    return null
}

export default Page