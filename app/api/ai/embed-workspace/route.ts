// app/api/ai/embed-workspace/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ensureWorkspaceEmbeddings } from '@/lib/ai/rag'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workspaceId } = await req.json()
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })

    try {
        await ensureWorkspaceEmbeddings(workspaceId)
        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? 'failed' }, { status: 500 })
    }
}