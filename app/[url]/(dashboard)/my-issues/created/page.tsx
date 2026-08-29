//app/[url]/(dashboard)/my-issues/assigned/page.tsx
'use client'

import AppHeader from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Avatar, AvatarFallback, getAvatarVariant, getInitials } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useWorkspace } from '@/lib/workspace-context'
import { useMyIssues } from '@/hooks/useMyIssues'
import { Calendar, ListFilter, Search, UserCircle } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { TaskActionIcon, TaskStatusIcon } from '@/components/ui/task-status'

const Page = () => {
  const pathname = usePathname()
  const ws = useWorkspace()
  const [search, setSearch] = useState('')
  const router = useRouter()

  const { issues, loading } = useMyIssues('created', ws.id)

  const filteredIssues = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return issues
    return issues.filter((i) => i.title?.toLowerCase().includes(q))
  }, [issues, search])

  return (
    <div className='w-full h-full flex-col'>
      <AppHeader title='My issues' />
      <div className="flex items-center gap-2 p-2">
        <Link href={`/${ws.url}/my-issues/assigned`}>
          <Button variant='outline' size='sm' className={`rounded-full text-muted-foreground ${pathname === `/${ws.url}/my-issues/assigned` ? 'bg-sidebar text-accent-foreground' : ''}`}>Assigned</Button>
        </Link>
        <Link href={`/${ws.url}/my-issues/created`}>
          <Button variant='outline' size='sm' className={`rounded-full text-muted-foreground ${pathname === `/${ws.url}/my-issues/created` ? 'bg-sidebar text-accent-foreground' : ''}`}>Created</Button>
        </Link>
        <div className="w-full">
          <InputGroup className="w-full h-7 rounded-full">
            <InputGroupInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search issues..."
            />
            <InputGroupAddon className="ml-2"><Search /></InputGroupAddon>
          </InputGroup>
        </div>
        <Button className="rounded-full" variant='outline' size='icon-sm'><ListFilter /></Button>
      </div>

      <div className='flex flex-col flex-1 p-2'>
        <div className='w-full overflow-x-auto'>
          <table className='min-w-full text-sm'>
            <tbody>
              {loading ? (
                <tr>
                  <td className='flex flex-col gap-2 py-4 px-2'>
                    <Skeleton className='h-8 w-full rounded-md'></Skeleton>
                    <Skeleton className='h-8 w-full rounded-md'></Skeleton>
                    <Skeleton className='h-8 w-full rounded-md'></Skeleton>
                    <Skeleton className='h-8 w-full rounded-md'></Skeleton>
                    <Skeleton className='h-8 w-full rounded-md'></Skeleton>
                    <Skeleton className='h-8 w-full rounded-md'></Skeleton>
                  </td>
                </tr>
              ) : filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={6} className='px-4 py-6 text-center text-muted-foreground'>
                    {search ? 'No issues match your search' : 'No issues created by you'}
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => {
                  const team = issue.teamId // populated: { _id, name, icon, slug }

                  return (
                    <tr key={issue._id} onClick={() => router.push(`/${ws.url}/issue/${issue._id}`)} className='hover:bg-sidebar/60 transition-colors cursor-pointer'>
                      <td className='pl-2 lg:px-4 py-2.5 w-6'>
                        {issue.action ? <TaskActionIcon action={issue.action} /> : <TaskStatusIcon status={issue.status} />}
                      </td>
                      <td className='px-2 lg:px-4 py-2.5 max-w-45 md:w-full'>
                        <span className='truncate line-clamp-1'>{issue.title}</span>
                      </td>
                      {team && (
                        <td className='px-2 lg:px-4 xl:px-6 py-2.5 table-cell whitespace-nowrap'>
                          <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                            {team.icon}{team.slug}
                          </span>
                        </td>
                      )}
                      <td className='px-0 lg:px-4 xl:px-6 py-2.5 text-muted-foreground text-xs'>
                          {issue.action ? issue.action : issue.status }
                      </td>
                      <td className='lg:px-4 xl:px-6 py-2.5 hidden lg:flex text-xs items-center mt-1 gap-1 text-muted-foreground whitespace-nowrap'>
                        <Calendar size={12} />
                        {issue.dueDate
                          ? new Date(issue.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : ''}
                      </td>
                      <td className='px-2 lg:px-4 xl:pl-6 xl:pr-4 py-2.5 text-right'>
                        {issue.assignee ? (
                          <div className='flex items-center justify-end -space-x-3'>
                            <Avatar size='sm'>
                              <AvatarFallback variant={getAvatarVariant(issue.assignee?.name)}>
                                {getInitials(issue.assignee?.name)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        ) : (
                          <span className='flex justify-end text-muted-foreground'>
                            <UserCircle size={18} strokeWidth={1.5} />
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Page