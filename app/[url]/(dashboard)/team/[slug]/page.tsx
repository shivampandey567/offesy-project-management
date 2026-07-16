'use client'

import { useWorkspace } from '@/lib/workspace-context'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

const Page = () => {
    const router = useRouter()
    const ws = useWorkspace()
    const { slug } = useParams() as { slug: string }

    useEffect(() => {
        router.push(`/${ws.url}/team/${slug}/overview`)
    }, [])

    return null
}

export default Page