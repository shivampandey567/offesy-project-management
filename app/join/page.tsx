'use client'

import { CreateWorkspace } from './components/createWorkspace'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

const page = () => {
    const router = useRouter()
    return (
        <div className='w-full min-h-screen flex items-center justify-center px-2'>
            <Button onClick={() => router.back()} variant='ghost' className='rounded-full fixed top-5 left-2 md:left-4'><ChevronLeft/>Back to app</Button>
            <CreateWorkspace />
        </div>
    )
}

export default page