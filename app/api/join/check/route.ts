// /api/join/check/route.ts
import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Workspace } from "@/lib/models/Workspace"

export async function GET(req: NextRequest) {
    try {
        await connectDB()
        const url = req.nextUrl.searchParams.get("url")
        if (!url) return NextResponse.json({ available: false })

        const existing = await Workspace.findOne({ url })
        return NextResponse.json({ available: !existing })
    } catch (err) {
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}