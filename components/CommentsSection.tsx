'use client'

import { useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import TextareaAutosize from 'react-textarea-autosize'
import {
    Paperclip,
    Send,
    MoreHorizontal,
    X,
    FileText,
    Smile,
    Reply,
    SmilePlus,
    Forward,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, getAvatarVariant, getInitials } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useComments } from '@/hooks/useComments'
import { useUploadAttachments } from '@/hooks/useUploadAttachments'
import { cn } from '@/lib/utils'
import { InputGroup, InputGroupAddon, InputGroupButton } from './ui/input-group'

type Member = { userId: string; clerkId?: string | null; name: string }

type CommentsSectionProps = {
    targetType: 'issue' | 'project'
    targetId: string
    workspaceId: string
    members: Member[]
    onImageClick?: (url: string) => void
}

const REACTION_EMOJIS = ['👍', '❤️', '😄', '🎉', '😕', '👀', '🚀', '👏']

const CommentsSection = ({ targetType, targetId, workspaceId, members, onImageClick }: CommentsSectionProps) => {
    const { user } = useUser()
    const { comments, loading, posting, addComment, editComment, deleteComment, toggleReaction } =
        useComments(targetType, targetId, workspaceId)
    const { uploadAttachments, uploading } = useUploadAttachments()

    const [text, setText] = useState('')
    const [attachment, setAttachment] = useState<any>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingText, setEditingText] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const listEndRef = useRef<HTMLDivElement>(null)

    const currentUserId = user?.id ?? ''
    const getMemberById = (id: string) => members.find(m => m.userId === id || m.clerkId === id)
    const getMemberName = (id: string) => getMemberById(id)?.name ?? 'Unknown'

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            const [uploaded] = await uploadAttachments([file])
            setAttachment(uploaded)
        } catch (err: any) {
            toast.error(err.message ?? 'Failed to upload file', { position: 'top-right' })
        } finally {
            e.target.value = ''
        }
    }

    const handlePost = async () => {
        if (!text.trim() && !attachment) return
        try {
            await addComment(text.trim(), attachment ?? undefined)
            setText('')
            setAttachment(null)
        } catch {
            toast.error('Failed to post comment', { position: 'top-right' })
        }
    }

    const handleSaveEdit = async (id: string) => {
        if (!editingText.trim() && !comments.find((c: any) => c._id === id)?.attachment) {
            toast.error('Comment cannot be empty', { position: 'top-right' })
            return
        }
        await editComment(id, editingText.trim())
        setEditingId(null)
        setEditingText('')
    }

    const handleDelete = async (id: string) => {
        await deleteComment(id)
        toast('Comment deleted', { position: 'top-right' })
    }

    // ✅ simple timestamp — no relative-time/tooltip machinery
    const formatTimestamp = (date: string | Date) =>
        new Date(date).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        })

    return (
        <Card className='bg-background ring-0 w-full min-w-0 border-0 shadow-none'>
            <CardHeader className='px-0 pb-1 pt-0'>
                <CardTitle className='text-sm font-semibold text-accent-foreground/80 w-fit tracking-tight'>
                    Comments {comments.length > 0 && `(${comments.length})`}
                </CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col gap-5 px-0'>
                {loading ? (
                    <div className='flex flex-col gap-4'>
                        <Skeleton className="h-20 w-full rounded-2xl" />
                        <Skeleton className="h-20 w-3/4 rounded-2xl" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className='flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed py-10 text-center'>
                        <div className='rounded-full bg-muted p-3'>
                            <Reply className='size-5 text-muted-foreground' />
                        </div>
                        <p className='text-sm text-muted-foreground'>No comments yet. Start the conversation.</p>
                    </div>
                ) : (
                    // ✅ more breathing room between comments
                    <div className='flex flex-col gap-3'>
                        {comments.map((c: any) => {
                            const author = getMemberById(c.authorId)
                            const isOwn = currentUserId === c.authorId
                            const isEditing = editingId === c._id
                            const reactions: { emoji: string; users: string[] }[] = c.reactions ?? []

                            return (
                                <div
                                    key={c._id}
                                    className='group flex gap-3'
                                >
                                    <Avatar size='sm' className='mt-0.5 shrink-0 ring-2 ring-background shadow-sm'>
                                        <AvatarFallback variant={getAvatarVariant(author?.name ?? 'U')}>
                                            {getInitials(author?.name ?? 'Unknown')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className='flex-1 min-w-0 flex flex-col'>
                                        <div className='flex items-center gap-2 leading-none'>
                                            <span className='text-sm font-semibold'>{isOwn ? 'You' : author?.name ?? 'Unknown'}</span>
                                            <span className='text-xs text-muted-foreground'>
                                                {formatTimestamp(c.createdAt)}
                                                {c.edited && ' · edited'}
                                            </span>
                                            {isOwn && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant='ghost'
                                                            size='icon-sm'
                                                            className='ml-auto rounded-full'
                                                        >
                                                            <MoreHorizontal size={14} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align='end'>
                                                        <DropdownMenuItem onClick={() => { setEditingId(c._id); setEditingText(c.text) }}>
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(c._id)}
                                                            variant='destructive'
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>

                                        {isEditing ? (
                                            <div className='flex flex-col gap-2 mt-2 w-full pr-1'>
                                                <TextareaAutosize
                                                    value={editingText}
                                                    onChange={(e) => setEditingText(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault()
                                                            handleSaveEdit(c._id)
                                                        }
                                                        if (e.key === 'Escape') setEditingId(null)
                                                    }}
                                                    autoFocus
                                                    className='w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
                                                />
                                                <div className='flex gap-2'>
                                                    <Button size='xs' onClick={() => handleSaveEdit(c._id)}>Save</Button>
                                                    <Button size='xs' variant='ghost' onClick={() => setEditingId(null)}>Cancel</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {c.text && (
                                                    <p className='text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed w-full min-w-0'>
                                                        {c.text}
                                                    </p>
                                                )}
                                                {c.attachment && (
                                                    <div className='mt-3'>
                                                        {c.attachment.isImage ? (
                                                            <button
                                                                type='button'
                                                                onClick={() => onImageClick?.(c.attachment.url)}
                                                                className='group/image relative overflow-hidden rounded-xl border bg-muted'
                                                            >
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img
                                                                    src={c.attachment.url}
                                                                    alt={c.attachment.name}
                                                                    className='max-h-56 rounded-xl border object-cover transition-transform group-hover/image:scale-[1.02]'
                                                                />
                                                            </button>
                                                        ) : (
                                                            <a

                                                                href={c.attachment.url}
                                                                target='_blank'
                                                                rel='noopener noreferrer'
                                                                className='inline-flex items-center gap-2.5 rounded-xl border bg-background px-3 py-2 text-xs text-muted-foreground shadow-sm hover:bg-muted transition-colors'
                                                            >
                                                                <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-muted'>
                                                                    <FileText size={16} />
                                                                </div>
                                                                <span className='max-w-40 truncate font-medium'>{c.attachment.name}</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                                <div className='mt-1 flex flex-wrap items-center gap-2'>
                                                    {reactions.map((r) => {
                                                        const reactedByMe = r.users.includes(currentUserId)
                                                        return (
                                                            <button
                                                                key={r.emoji}
                                                                type='button'
                                                                onClick={() => toggleReaction(c._id, r.emoji, currentUserId)}
                                                                title={r.users.slice(0, 3).map(getMemberName).join(', ')}
                                                                className={cn(
                                                                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
                                                                    reactedByMe
                                                                        ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
                                                                        : 'border-border bg-background hover:bg-muted'
                                                                )}
                                                            >
                                                                <span>{r.emoji}</span>
                                                                <span className='font-medium'>{r.users.length}</span>
                                                            </button>
                                                        )
                                                    })}

                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant='ghost'
                                                                size='icon-xs'
                                                                className='rounded-full text-muted-foreground'
                                                            >
                                                                <SmilePlus />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent align='start' className='w-auto p-2'>
                                                            <div className='flex gap-1'>
                                                                {REACTION_EMOJIS.map(emoji => (
                                                                    <button
                                                                        key={emoji}
                                                                        type='button'
                                                                        onClick={() => toggleReaction(c._id, emoji, currentUserId)}
                                                                        className='flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-muted'
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                <div className='grid w-full flex-col mt-2 gap-4 px-1'>
                    {attachment && (
                        <div className='flex items-center gap-3 rounded-xl border bg-muted/50 p-2 w-fit pr-3 -mt-3'>
                            {attachment.isImage ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={attachment.url} alt={attachment.name} className='h-10 w-10 rounded-lg object-cover' />
                            ) : (
                                <FileText size={18} className='text-muted-foreground' />
                            )}
                            <span className='text-xs text-muted-foreground max-w-40 truncate'>{attachment.name}</span>
                            <Button variant='ghost' size='icon-xs' className='h-6 w-6 rounded-full' onClick={() => setAttachment(null)}>
                                <X size={13} />
                            </Button>
                        </div>
                    )}
                    <InputGroup>
                        <TextareaAutosize
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handlePost()
                                }
                            }}
                            placeholder="Write a comment..."
                            data-slot="input-group-control"
                            minRows={1}
                            maxRows={6}
                            className="flex field-sizing-content min-h-12 w-full resize-none rounded-lg bg-transparent px-3 py-2.5 text-base transition-[color,box-shadow] outline-none md:text-sm"
                        />
                        <InputGroupAddon align="block-end" className='bg-transparent rounded-lg'>
                            <input
                                ref={fileInputRef}
                                type='file'
                                accept='image/*,.pdf,.doc,.docx'
                                className='hidden'
                                onChange={handleFileChange}
                            />
                            <InputGroupButton
                                size="icon-sm"
                                variant="ghost"
                                className="rounded-full text-muted-foreground hover:text-foreground"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                <Paperclip />
                            </InputGroupButton>
                            <InputGroupButton
                                className="ml-auto rounded-full"
                                size="icon-sm"
                                variant="default"
                                onClick={handlePost}
                                disabled={posting || uploading || (!text.trim() && !attachment)}
                            >
                                <Forward />
                            </InputGroupButton>
                        </InputGroupAddon>
                    </InputGroup>

                </div>
            </CardContent>
        </Card>
    )
}

export default CommentsSection