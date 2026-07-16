'use client'
import AppHeader from '@/components/app-header'
import { useWorkspace } from '@/lib/workspace-context'
import { useRouter } from 'next/navigation'
import React from 'react'

const Page = () => {
  const ws=useWorkspace()
  const router=useRouter()
  return (
    <div className='w-full h-full'>
      <AppHeader title='Teams' count={5} onPlusClick={()=>router.push(`/${ws.url}/new-team`)}/>
      <div className='flex flex-1 flex-col p-2'>

      </div>
    </div>
  )
}

export default Page