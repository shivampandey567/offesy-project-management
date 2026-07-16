// app/[url]/(dashboard)/issue/[id]/ai/page.tsx
'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useWorkspace } from '@/lib/workspace-context'
import { useIssueById } from '@/hooks/useIssueById'
import AppHeader from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group'
import {
    ArrowUp,
    Sparkles,
    ListPlus,
    Copy,
    Check,
    Wand2,
    Lightbulb,
    ClipboardList,
    Square,
    Trash2,
    RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import TextareaAutosize from 'react-textarea-autosize'

type ChatMessage = { role: 'user' | 'assistant'; content: string }
type SubIssueDraft = { title: string; done: boolean; picked: boolean }

const SLASH_COMMANDS: { cmd: string; label: string; prompt: string }[] = [
    { cmd: '/breakdown', label: 'Break into sub-issues', prompt: 'Break this issue down into 4-6 actionable sub-issues.' },
    { cmd: '/summarize', label: 'Summarize the issue', prompt: 'Give me a 3-bullet summary of this issue and current state.' },
    { cmd: '/estimate', label: 'Estimate effort', prompt: 'Estimate effort (S/M/L/XL) for this issue and explain your reasoning.' },
    { cmd: '/risks', label: 'Identify risks', prompt: 'What are the key risks, edge cases, and unknowns for this issue?' },
    { cmd: '/rewrite', label: 'Rewrite description', prompt: 'Rewrite the description of this issue to be clearer and more actionable.' },
    { cmd: '/next', label: 'Suggest next step', prompt: 'What is the single most important next step I should take on this issue?' },
    { cmd: '/related', label: 'Find related issues', prompt: 'Are there related issues in this workspace I should know about? What do they suggest?' },
]

const SUGGESTIONS = [
    { icon: ClipboardList, cmd: '/breakdown' },
    { icon: Lightbulb, cmd: '/next' },
    { icon: Wand2, cmd: '/rewrite' },
    { icon: Sparkles, cmd: '/risks' },
]

const Page = () => {
    const { id } = useParams() as { id: string }
    const ws = useWorkspace()
    const { issue, loading, updateIssue } = useIssueById(id)

    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [historyLoaded, setHistoryLoaded] = useState(false)
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
    const [showSlash, setShowSlash] = useState(false)
    const [slashIdx, setSlashIdx] = useState(0)
    const abortRef = useRef<AbortController | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!id) return
        fetch(`/api/ai/issue-assistant/history?issueId=${id}`)
            .then((r) => r.json())
            .then((d) => {
                if (Array.isArray(d.messages)) setMessages(d.messages)
            })
            .catch(() => { })
            .finally(() => setHistoryLoaded(true))
    }, [id])

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const filteredSlash = useMemo(() => {
        if (!showSlash) return []
        const q = input.trim().toLowerCase()
        return SLASH_COMMANDS.filter(
            (c) => c.cmd.startsWith(q) || c.label.toLowerCase().includes(q.replace('/', ''))
        )
    }, [input, showSlash])

    const sendMessage = async (text: string) => {
        if (!text.trim() || !issue || sending) return

        const trimmed = text.trim()
        const slash = SLASH_COMMANDS.find((c) => c.cmd === trimmed.split(/\s+/)[0])
        const prompt = slash
            ? slash.prompt + (trimmed.slice(slash.cmd.length).trim() ? ` ${trimmed.slice(slash.cmd.length).trim()}` : '')
            : text

        const userMsg: ChatMessage = { role: 'user', content: prompt }
        setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '' }])
        setInput('')
        setShowSlash(false)
        setSending(true)

        const controller = new AbortController()
        abortRef.current = controller

        try {
            const res = await fetch('/api/ai/issue-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: prompt,
                    issueId: id,
                    workspaceId: (issue as any).workspaceId ?? (ws as any).id ?? ws.url,
                    issueContext: {
                        title: issue.title,
                        description: issue.description,
                        status: issue.status,
                        priority: issue.priority,
                        subIssues: issue.subIssues,
                    },
                    history: messages,
                }),
                signal: controller.signal,
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? 'AI request failed')

            setMessages((prev) => {
                const copy = [...prev]
                copy[copy.length - 1] = { role: 'assistant', content: data.reply ?? '' }
                return copy
            })
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                toast.error(err.message ?? 'Failed to get AI response', { position: 'top-right' })
                setMessages((prev) => {
                    const last = prev[prev.length - 1]
                    if (last?.role === 'assistant' && !last.content) return prev.slice(0, -1)
                    return prev
                })
            }
        } finally {
            setSending(false)
            abortRef.current = null
        }
    }

    const stopStreaming = () => abortRef.current?.abort()

    const clearHistory = async () => {
        await fetch(`/api/ai/issue-assistant/history?issueId=${id}`, { method: 'DELETE' })
        setMessages([])
        toast.success('Conversation cleared', { position: 'top-right' })
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showSlash && filteredSlash.length) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIdx((i) => Math.min(i + 1, filteredSlash.length - 1)); return }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSlashIdx((i) => Math.max(i - 1, 0)); return }
            if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
                e.preventDefault()
                const picked = filteredSlash[slashIdx]
                if (picked) sendMessage(picked.cmd)
                return
            }
            if (e.key === 'Escape') { setShowSlash(false); return }
        }
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage(input)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const v = e.target.value
        setInput(v)
        setShowSlash(v.trimStart().startsWith('/') && !v.includes('\n'))
        setSlashIdx(0)
    }

    const copyMessage = async (content: string, idx: number) => {
        await navigator.clipboard.writeText(content)
        setCopiedIdx(idx)
        setTimeout(() => setCopiedIdx(null), 1500)
    }

    if (loading) return <div className='p-6 text-sm text-muted-foreground'>Loading...</div>
    if (!issue) return <div className='p-6 text-sm text-muted-foreground'>Issue not found</div>

    return (
        <div className='w-full h-full'>
            <AppHeader
                secTitle='AI Assistant'
                subTitle={issue.title}
                direct={`/${ws.url}/issue/${id}`}
                onStarClick={() => { }}
                onMenuClick={() => { }}
            />

            <div className='flex items-center justify-center gap-2 pt-3 pb-1'>

                {messages.length > 0 && (
                    <button
                        onClick={clearHistory}
                        className='inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 backdrop-blur px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition'
                    >
                        <Trash2 size={12} /> Clear
                    </button>
                )}
            </div>

            <div className='flex-1 flex flex-col gap-5 p-4 md:px-20 lg:px-40 xl:px-60 overflow-y-auto'>
                {historyLoaded && messages.length === 0 && <EmptyState onPick={(cmd) => sendMessage(cmd)} />}

                {messages.map((m, i) => {
                    const isUser = m.role === 'user'
                    const isStreamingLast = sending && i === messages.length - 1 && m.role === 'assistant'
                    return (
                        <div key={i} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            {!isUser && (
                                <div className='shrink-0 h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-cyan-400 flex items-center justify-center shadow-md shadow-fuchsia-500/10'>
                                    <Sparkles size={14} className='text-white' />
                                </div>
                            )}
                            <div className={`group max-w-[85%] ${isUser ? 'order-1' : ''}`}>
                                <div
                                    className={`rounded-2xl px-4 py-3 text-sm shadow-sm border ${isUser
                                        ? 'bg-gradient-to-tr from-indigo-500 to-blue-500 text-white border-transparent'
                                        : 'bg-card/70 backdrop-blur border-border/60 text-foreground'
                                        }`}
                                >
                                    {isUser ? (
                                        <span className='whitespace-pre-wrap leading-relaxed'>{m.content}</span>
                                    ) : m.content ? (
                                        <>
                                            <div className='prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-p:leading-relaxed prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:mt-2 prose-headings:mb-1 prose-headings:font-semibold prose-code:text-xs prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted/70 prose-pre:text-foreground prose-pre:rounded-lg prose-pre:text-xs prose-pre:p-3 prose-pre:overflow-x-auto prose-strong:font-semibold prose-strong:text-foreground prose-a:text-indigo-500 hover:prose-a:text-indigo-600'>
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {m.content.replace(/```json\s*[\s\S]*?```/g, '').trim()}
                                                </ReactMarkdown>
                                                {isStreamingLast && (
                                                    <span className='inline-block w-1.5 h-4 -mb-0.5 ml-0.5 bg-foreground/70 animate-pulse rounded-sm align-middle' />
                                                )}
                                            </div>
                                            <SubIssuePreview content={m.content} issue={issue} updateIssue={updateIssue} />
                                        </>
                                    ) : (
                                        <TypingDots />
                                    )}
                                </div>
                                {!isUser && m.content && (
                                    <div className='mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                                        <button onClick={() => copyMessage(m.content, i)} className='text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted transition'>
                                            {copiedIdx === i ? (<><Check size={12} /> Copied</>) : (<><Copy size={12} /> Copy</>)}
                                        </button>
                                        <button onClick={() => sendMessage('Try again with a different angle.')} className='text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted transition'>
                                            <RefreshCw size={12} /> Regenerate
                                        </button>
                                    </div>
                                )}
                            </div>
                            {isUser && (
                                <div className='shrink-0 h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-medium order-2'>You</div>
                            )}
                        </div>
                    )
                })}

                <div ref={scrollRef} />
            </div>

            <div className='p-4 md:px-20 lg:px-40 xl:px-60 pb-6'>
                <div className='relative'>
                    {showSlash && filteredSlash.length > 0 && (
                        <div className='absolute bottom-full mb-2 left-0 right-0 rounded-xl border border-border bg-popover shadow-lg overflow-hidden z-10'>
                            <div className='px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60'>Slash commands</div>
                            {filteredSlash.map((c, idx) => (
                                <button
                                    key={c.cmd}
                                    onMouseEnter={() => setSlashIdx(idx)}
                                    onClick={() => sendMessage(c.cmd)}
                                    className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm ${idx === slashIdx ? 'bg-muted' : 'hover:bg-muted/60'}`}
                                >
                                    <code className='text-xs font-mono text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded'>{c.cmd}</code>
                                    <span className='text-foreground'>{c.label}</span>
                                    <span className='ml-auto text-xs text-muted-foreground line-clamp-1'>{c.prompt}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className='pointer-events-none absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/40 via-fuchsia-500/40 to-cyan-400/40 opacity-60 blur-sm' />
                    <div className='relative  rounded-2xl border border-border/70 bg-background shadow-sm'>
                        <InputGroup>
                            <TextareaAutosize
                                value={input}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                data-slot='input-group-control'
                                placeholder='Ask about this issue, or type / for commands...'
                                disabled={sending}
                                maxRows={8}
                                className='flex field-sizing-content min-h-14 w-full resize-none rounded-2xl bg-transparent px-4 py-3 text-base transition-[color,box-shadow] outline-none md:text-sm placeholder:text-muted-foreground/70'
                            />
                            <InputGroupAddon align='block-end'>
                                <div className='ml-auto flex items-center gap-2 pr-1 pb-1'>
                                    {sending ? (
                                        <Button size='sm' variant='outline' className='rounded-full h-8 px-3' onClick={stopStreaming}>
                                            <Square size={12} className='mr-1 fill-current' /> Stop
                                        </Button>
                                    ) : (
                                        <InputGroupButton
                                            className='rounded-full h-8 w-8 p-0 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 text-white hover:opacity-90 disabled:opacity-40'
                                            size='sm'
                                            variant='default'
                                            disabled={!input.trim()}
                                            onClick={() => sendMessage(input)}
                                        >
                                            <ArrowUp size={16} />
                                        </InputGroupButton>
                                    )}
                                </div>
                            </InputGroupAddon>
                        </InputGroup>
                    </div>
                </div>
                <p className='text-[11px] text-muted-foreground text-center mt-2'>
                    Type <kbd className='px-1 rounded bg-muted font-mono text-[10px]'>/</kbd> for commands · AI may be inaccurate, verify before applying.
                </p>
            </div>
        </div>
    )
}

const TypingDots = () => (
    <div className='flex items-center gap-1 py-1'>
        <span className='h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]' />
        <span className='h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]' />
        <span className='h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce' />
    </div>
)

const EmptyState = ({ onPick }: { onPick: (cmd: string) => void }) => (
            <div className='flex flex-wrap gap-2 max-w-2xl'>
                {SUGGESTIONS.map((s) => {
                    const c = SLASH_COMMANDS.find((x) => x.cmd === s.cmd)!
                    const Icon = s.icon
                    return (
                        <Button
                            key={s.cmd}
                            onClick={() => onPick(s.cmd)}
                            variant='secondary'
                            size='lg'
                            className='rounded-full cursor-pointer text-accent-foreground/80'
                        >
                            <Icon />
                            {c.label}
                        </Button>
                    )
                })}
            </div>
)

const SubIssuePreview = ({
    content,
    issue,
    updateIssue,
}: {
    content: string
    issue: any
    updateIssue: (patch: any) => void
}) => {
    const [drafts, setDrafts] = useState<SubIssueDraft[]>([])
    const [applied, setApplied] = useState(false)

    useEffect(() => {
        const match = content.match(/```json\s*([\s\S]*?)```/)
        if (!match) { setDrafts([]); return }
        try {
            const arr = JSON.parse(match[1])
            if (Array.isArray(arr)) {
                setDrafts(arr.filter((x) => x && typeof x.title === 'string').map((x) => ({ title: x.title, done: !!x.done, picked: true })))
            }
        } catch { setDrafts([]) }
    }, [content])

    if (!drafts.length) return null

    const toggle = (i: number) => setDrafts((d) => d.map((x, idx) => (idx === i ? { ...x, picked: !x.picked } : x)))
    const editTitle = (i: number, v: string) => setDrafts((d) => d.map((x, idx) => (idx === i ? { ...x, title: v } : x)))
    const removeItem = (i: number) => setDrafts((d) => d.filter((_, idx) => idx !== i))
    const pickedCount = drafts.filter((d) => d.picked).length

    const apply = () => {
        const chosen = drafts.filter((d) => d.picked).map((d) => ({ title: d.title, done: d.done }))
        if (!chosen.length) return
        const updated = [...(issue.subIssues ?? []), ...chosen]
        updateIssue({ subIssues: updated })
        setApplied(true)
        toast.success(`Added ${chosen.length} sub-issue${chosen.length > 1 ? 's' : ''}`, { position: 'top-right' })
    }

    return (
        <div className='mt-3 rounded-xl border border-border/60 bg-background/60 backdrop-blur p-3'>
            <div className='flex items-center justify-between mb-2'>
                <div className='text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2'>
                    <ListPlus size={13} /> Proposed sub-issues
                    <span className='text-[10px] font-normal normal-case text-muted-foreground/70'>({pickedCount}/{drafts.length} selected)</span>
                </div>
                <Button
                    size='sm'
                    disabled={applied || pickedCount === 0}
                    onClick={apply}
                    className='rounded-full h-7 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 text-white hover:opacity-90 border-0 disabled:opacity-40'
                >
                    {applied ? (<><Check size={12} className='mr-1' /> Applied</>) : (<><ListPlus size={12} className='mr-1' /> Apply {pickedCount || ''}</>)}
                </Button>
            </div>
            <div className='flex flex-col gap-1.5'>
                {drafts.map((d, i) => (
                    <div key={i} className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 transition ${d.picked ? 'bg-muted/40' : 'opacity-50'}`}>
                        <input type='checkbox' checked={d.picked} onChange={() => toggle(i)} disabled={applied} className='h-4 w-4 accent-indigo-500 cursor-pointer' />
                        <input
                            type='text'
                            value={d.title}
                            onChange={(e) => editTitle(i, e.target.value)}
                            disabled={applied}
                            className='flex-1 bg-transparent text-sm outline-none border-b border-transparent focus:border-border py-0.5'
                        />
                        {!applied && (
                            <button onClick={() => removeItem(i)} className='opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition text-xs'>
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Page