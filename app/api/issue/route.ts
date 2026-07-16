// app/api/issue/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { connectDB } from "@/lib/db"
import { Issue } from "@/lib/models/Issue"
import { pusherServer } from "@/lib/pusherServer"
import { issueSchema } from "@/lib/validations/issue"

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()
        const body = await req.json()

        const parsed = issueSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message ?? "Validation failed", issues: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const issue = await Issue.create({ ...parsed.data, createdBy: userId })
        await issue.populate('assignee', 'name email picture')   // ✅ fixed

        const serialized = JSON.parse(JSON.stringify(issue))

        pusherServer.trigger(`team-${parsed.data.teamId}`, 'issue:created', serialized)
            .catch(err => console.error('Pusher error:', err))

        return NextResponse.json({ success: true, data: serialized }, { status: 201 })
    } catch (err) {
        console.error('POST /api/issue error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Server error" },
            { status: 500 }
        )
    }
}

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()

        const teamId = req.nextUrl.searchParams.get('teamId')
        const projectId = req.nextUrl.searchParams.get('projectId')

        if (!teamId) {
            return NextResponse.json({ error: "teamId is required" }, { status: 400 })
        }

        const query: Record<string, any> = { teamId }
        if (projectId) query.project = projectId

        const issues = await Issue.find(query)
            .populate('assignee', 'name email picture')
            .sort({ createdAt: -1 })

        return NextResponse.json({ success: true, data: issues })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}