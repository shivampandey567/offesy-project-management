// app/api/project/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { connectDB } from "@/lib/db"
import { Project } from "@/lib/models/Project"
import { pusherServer } from "@/lib/pusherServer"
import { projectUpdateSchema } from "@/lib/validations/project"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()
        const { id } = await params

        const project = await Project.findById(id)
        if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

        return NextResponse.json({ success: true, data: project })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()
        const { id } = await params
        const body = await req.json()

        const parsed = projectUpdateSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }

        const before = await Project.findById(id)
        if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 })

        const project = await Project.findByIdAndUpdate(
            id,
            { $set: parsed.data },
            { returnDocument: 'after' }
        )

        const serialized = JSON.parse(JSON.stringify(project))

        pusherServer.trigger(`project-${id}`, 'project:updated', parsed.data)
            .catch(err => console.error('Pusher error:', err))

        pusherServer.trigger(`workspace-${String(project!.workspaceId)}`, 'project:updated', serialized)
            .catch(err => console.error('Pusher error:', err))

        // union of old + new teams, in case teamId was changed in this PATCH
        const teamIds = new Set([
            ...before.teamId.map(String),
            ...(project!.teamId ?? []).map(String),
        ])
        teamIds.forEach(tid => {
            pusherServer.trigger(`team-${tid}`, 'project:updated', serialized)
                .catch(err => console.error('Pusher error:', err))
        })

        return NextResponse.json({ success: true, data: project })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()
        const { id } = await params

        const project = await Project.findByIdAndDelete(id)
        if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

        pusherServer.trigger(`project-${id}`, 'project:deleted', {})
            .catch(err => console.error('Pusher error:', err))

        pusherServer.trigger(`workspace-${String(project.workspaceId)}`, 'project:deleted', { id })
            .catch(err => console.error('Pusher error:', err))

        project.teamId.forEach((tid: any) => {
            pusherServer.trigger(`team-${String(tid)}`, 'project:deleted', { id })
                .catch(err => console.error('Pusher error:', err))
        })

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}