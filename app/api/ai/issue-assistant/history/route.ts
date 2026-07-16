// app/api/ai/issue-assistant/history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import { AiChat } from '@/lib/models/Aichat'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const issueId = searchParams.get('issueId')
    if (!issueId) return NextResponse.json({ error: 'issueId required' }, { status: 400 })

    await connectDB()

    const chat = await AiChat.findOne({ issueId, userId }).lean() as any
    const messages = (chat?.messages ?? []).map((m: any) => ({
        role: m.role,
        content: m.content,
    }))
    return NextResponse.json({ messages })
}

export async function DELETE(req: NextRequest) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const issueId = searchParams.get('issueId')
    if (!issueId) return NextResponse.json({ error: 'issueId required' }, { status: 400 })

    await connectDB()

    await AiChat.deleteOne({ issueId, userId })
    return NextResponse.json({ success: true })
}