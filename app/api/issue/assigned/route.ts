// app/api/issue/assigned/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { connectDB } from "@/lib/db"
import { Issue } from "@/lib/models/Issue"
import { User } from "@/lib/models/User"

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()

        const user = await User.findOne({ clerkId: userId }).select('_id').lean() as any
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

        const { searchParams } = new URL(req.url)
        const workspaceId = searchParams.get('workspaceId')

        const query: any = { assignee: user._id }
        if (workspaceId) query.workspaceId = workspaceId

        const issues = await Issue.find(query)
            .populate('assignee', 'name email picture')
            .populate('teamId', 'name icon slug')
            .sort({ createdAt: -1 })
            .lean()

        return NextResponse.json({ success: true, data: issues })
    } catch (err) {
        console.error('GET /api/issue/assigned error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Server error" },
            { status: 500 }
        )
    }
}