'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import React, { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { useWorkspace } from '@/lib/workspace-context'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/app-header'

const teamSchema = z.object({
    name: z.string()
        .min(3, 'Team name must be at least 3 characters')
        .max(20, 'Team name must be at most 20 characters')
        .regex(/^[a-zA-Z0-9 ]+$/, 'Only letters, numbers and spaces allowed'),
})

const EMOJIS = ['👤', '🚀', '💡', '🔧', '📊', '🎯', '💼', '🛠️', '📱', '🎨', '🔒', '😀', '⚡', '🌐', '🤝', '📋', '🏆', '💻', '🔬', '📢']

type NameStatus = 'idle' | 'checking' | 'taken'

const Page = () => {
    const [name, setName] = useState('')
    const [icon, setIcon] = useState<string>('👤')
    const [error, setError] = useState<string | null>(null)
    const [nameStatus, setNameStatus] = useState<NameStatus>('idle')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const ws = useWorkspace()
    const router = useRouter()

    useEffect(() => {
        if (!name || name.length < 3) {
            setNameStatus('idle')
            return
        }

        setNameStatus('checking')

        if (debounceRef.current) clearTimeout(debounceRef.current)

        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/team/check?name=${encodeURIComponent(name)}&workspaceId=${ws.id}`)
                const data = await res.json()
                if (!data.available) {
                    setNameStatus('taken')
                } else {
                    setNameStatus('idle')
                }
            } catch {
                setNameStatus('idle')
            }
        }, 500)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [name, ws.id])

    const reset = () => {
        setName('')
        setIcon('👤')
        setError(null)
        setNameStatus('idle')
    }

    const handleSubmit = async () => {
        const result = teamSchema.safeParse({ name })
        if (!result.success) {
            setError(result.error.issues[0]?.message ?? 'Invalid input')
            return
        }

        if (nameStatus === 'taken') {
            setError('This team name is already used in this workspace')
            return
        }

        if (nameStatus === 'checking') return

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, icon, workspaceId: ws.id })
            })

            if (!res.ok) {
                const err = await res.json()
                if (err.error === 'Team name already exists in this workspace') {
                    setNameStatus('taken')
                    toast.error('Team name already used', {
                        description: `"${name}" already exists in this workspace.`,
                        position: 'top-right'
                    })
                    return
                }
                throw new Error(err.error || 'Failed to create team')
            }

            const result = await res.json()
            toast.success('Team created', {
                description: `${icon} ${name} has been created.`,
                position: 'top-right'
            })
            reset()
            router.push(`/${ws.url}/team/${result.data.slug}/overview`)
        } catch (err: any) {
            toast.error('Failed to create team', {
                description: err.message,
                position: 'top-right'
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className='w-full h-full'>
            <AppHeader title='New team'/>
            <div className='flex flex-1 justify-center p-2 pt-20'>
                <Card className='w-full md:w-lg bg-backgound ring-0'>
                    <CardHeader>
                        <CardTitle className='text-[20px]'>Create a new team</CardTitle>
                        <CardDescription>Create a new team to manage separate workflow</CardDescription>
                    </CardHeader>
                    <CardContent className='mt-4'>
                        <FieldGroup>
                            <Field>
                                <FieldLabel className='text-muted-foreground'>Icon & Name</FieldLabel>
                                <div className="flex gap-3">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                type="button"
                                                className="h-10 w-10 rounded-md p-0 shrink-0 text-lg"
                                                variant="outline"
                                            >
                                                {icon}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            className="grid grid-cols-5 gap-1 p-2 w-44"
                                            side="bottom"
                                            align="start"
                                        >
                                            {EMOJIS.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    className="text-xl p-1 rounded-md hover:bg-muted transition-colors"
                                                    onClick={() => setIcon(emoji)}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <div className='flex flex-col flex-1 gap-1'>
                                        <InputGroup className="h-10">
                                            <InputGroupInput
                                                placeholder="e.g. Development"
                                                className="font-medium"
                                                autoComplete="off"
                                                value={name}
                                                onChange={(e) => {
                                                    const clean = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '')
                                                    setName(clean)
                                                    setError(null)
                                                }}
                                            />
                                        </InputGroup>

                                        {nameStatus === 'taken' && (
                                            <p className='text-xs text-red-500'>This team name is already used</p>
                                        )}
                                        {error && <p className='text-xs text-red-500'>{error}</p>}
                                    </div>
                                </div>
                            </Field>
                        </FieldGroup>
                    </CardContent>
                    <CardFooter className='border-none bg-background flex justify-end'>
                        <Button
                            onClick={handleSubmit}
                            variant='outline'
                            size='lg'
                            className='rounded-full'
                            disabled={nameStatus === 'taken' || nameStatus === 'checking' || isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Create'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

export default Page