import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { connectDB } from "@/lib/db"
import { Team } from "@/lib/models/Team"

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()

        const { searchParams } = new URL(req.url)
        const name = searchParams.get('name')
        const workspaceId = searchParams.get('workspaceId')

        if (!name || !workspaceId) return NextResponse.json({ error: "name and workspaceId required" }, { status: 400 })

        const existing = await Team.findOne({ name, workspaceId })
        return NextResponse.json({ available: !existing })
    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}