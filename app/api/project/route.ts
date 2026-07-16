// app/api/project/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { connectDB } from "@/lib/db"
import { Project } from "@/lib/models/Project"
import { pusherServer } from "@/lib/pusherServer"
import { projectCreateSchema } from "@/lib/validations/project"

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()
        const body = await req.json()

        const parsed = projectCreateSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }

        const project = await Project.create({
            ...parsed.data,
            createdBy: userId, // clerkId — the manager who created it
        })

        const serialized = JSON.parse(JSON.stringify(project))

        // workspace-level feed
        pusherServer.trigger(`workspace-${parsed.data.workspaceId}`, 'project:created', serialized)
            .catch(err => console.error('Pusher error:', err))

        // fan out to each team this project belongs to
        parsed.data.teamId.forEach(tid => {
            pusherServer.trigger(`team-${tid}`, 'project:created', serialized)
                .catch(err => console.error('Pusher error:', err))
        })

        return NextResponse.json({ success: true, data: project }, { status: 201 })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()

        const workspaceId = req.nextUrl.searchParams.get('workspaceId')
        const teamId = req.nextUrl.searchParams.get('teamId') // optional filter — projects for one team

        if (!workspaceId) {
            return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
        }

        const query: Record<string, any> = { workspaceId }
        if (teamId) query.teamId = teamId // Mongo matches if teamId is inside the array

        const projects = await Project.find(query).sort({ createdAt: -1 })

        return NextResponse.json({ success: true, data: projects })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}