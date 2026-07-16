// app/api/issue/created/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { connectDB } from "@/lib/db"
import { Issue } from "@/lib/models/Issue"

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()

        const { searchParams } = new URL(req.url)
        const workspaceId = searchParams.get('workspaceId')

        const query: any = { createdBy: userId }
        if (workspaceId) query.workspaceId = workspaceId

        const issues = await Issue.find(query)
            .populate('assignee', 'name email picture')
            .populate('teamId', 'name icon slug')
            .sort({ createdAt: -1 })
            .lean()

        return NextResponse.json({ success: true, data: issues })
    } catch (err) {
        console.error('GET /api/issue/created error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Server error" },
            { status: 500 }
        )
    }
}