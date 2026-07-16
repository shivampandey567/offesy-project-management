// app/api/team/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { connectDB } from "@/lib/db"
import { Team } from "@/lib/models/Team"
import { pusherServer } from "@/lib/pusherServer"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()
        const { id } = await params
        const { searchParams } = new URL(req.url)
        const workspaceId = searchParams.get('workspaceId')

        if (!workspaceId) {
            return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
        }

        // ✅ scoped by both slug AND workspaceId
        const team = await Team.findOne({ slug: id, workspaceId }).lean()

        return NextResponse.json({ success: true, data: team })
    } catch (err) {
        console.error('GET /api/team/[id] error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Server error" },
            { status: 500 }
        )
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()
        const { id } = await params
        const { searchParams } = new URL(req.url)
        const workspaceId = searchParams.get('workspaceId')
        const body = await req.json()

        if (!workspaceId) {
            return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
        }

        const team = await Team.findOneAndUpdate(
            { slug: id, workspaceId },
            { $set: body },
            { returnDocument: 'after' }
        )
        if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 })

        const serialized = JSON.parse(JSON.stringify(team))

        pusherServer.trigger(`team-${team._id}`, 'team:updated', serialized)
            .catch(err => console.error('Pusher error:', err))

        pusherServer.trigger(`workspace-${team.workspaceId}`, 'team:updated', serialized)
            .catch(err => console.error('Pusher error:', err))

        return NextResponse.json({ success: true, data: serialized })
    } catch (err) {
        console.error('PATCH /api/team/[id] error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Server error" },
            { status: 500 }
        )
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()
        const { id } = await params
        const { searchParams } = new URL(req.url)
        const workspaceId = searchParams.get('workspaceId')

        if (!workspaceId) {
            return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
        }

        const team = await Team.findOneAndDelete({ slug: id, workspaceId })
        if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 })

        pusherServer.trigger(`team-${team._id}`, 'team:deleted', { id: team._id.toString() })
            .catch(err => console.error('Pusher error:', err))

        pusherServer.trigger(`workspace-${team.workspaceId}`, 'team:deleted', { id: team._id.toString() })
            .catch(err => console.error('Pusher error:', err))

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('DELETE /api/team/[id] error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Server error" },
            { status: 500 }
        )
    }
}