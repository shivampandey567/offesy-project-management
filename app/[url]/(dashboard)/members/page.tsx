'use client'
import React, { useState } from 'react'
import InviteCard from './components/inviteCard'
import AppHeader from '@/components/app-header'
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers'
import { useWorkspace } from '@/lib/workspace-context'
import { Avatar, AvatarFallback, getAvatarVariant, getInitials } from '@/components/ui/avatar'
import TextBg from '@/components/ui/textbg'

const Page = () => {
  const [open, setOpen] = useState(false)
  const ws = useWorkspace()
  const { members, loading: membersLoading } = useWorkspaceMembers(ws.id)

  const WorkspaceMembers = members.map((m) => ({
    userId: m.id,
    clerkId: m.clerkId,
    name: m.name,
    email: m.email || undefined,
  }))
  return (
    <div className='flex flex-col'>
      <AppHeader title='Members' count={WorkspaceMembers.length} onPlusClick={() => setOpen(true)} />
      <div className='flex flex-1 flex-col p-2'>
        <InviteCard open={open} onOpenChange={setOpen} />
        <div className='w-full overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-accent-foreground/80 text-xs text-left'>
                <th className='px-4 py-2.5 font-medium'>Name</th>
                <th className='px-4 py-2.5 hidden md:block font-medium'>Email</th>
                <th className='px-4 py-2.5 font-medium'>Role</th>
              </tr>
            </thead>
            <tbody>
              {membersLoading ? (
                <tr>
                  <td colSpan={3} className='px-4 py-6 text-center text-muted-foreground'>
                    Loading members…
                  </td>
                </tr>
              ) : WorkspaceMembers.length === 0 ? (
                <tr>
                  <td colSpan={3} className='px-4 py-6 text-center text-muted-foreground'>
                    No members in this team yet
                  </td>
                </tr>
              ) : (
                WorkspaceMembers.map((m) => (
                  <tr key={m.userId} className='hover:bg-sidebar/60 transition-colors'>
                    <td className='px-4 py-2.5'>
                      <div className='flex items-center gap-2.5'>
                        <Avatar size='sm'>
                          <AvatarFallback variant={getAvatarVariant(m.name)}>
                            {getInitials(m.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex flex-col leading-tight'>
                          <span className='font-medium'>{m.name}</span>
                          {m.email && (
                            <span className='md:hidden text-muted-foreground text-xs'>
                              {m.email.split('@')[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-2.5 hidden md:block text-muted-foreground'>{m.email ?? '—'}</td>
                    <td className='px-4 py-2.5'>
                      {/* <TextBg variant={m.role === 'admin' ? 'blue' : 'teal'}>
                        {m.role === 'admin' ? 'admin' : 'member'}
                      </TextBg> */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Page