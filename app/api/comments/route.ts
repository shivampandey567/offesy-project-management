import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { connectDB } from "@/lib/db"
import { Comment } from "@/lib/models/Comment"
import { pusherServer } from "@/lib/pusherServer"
import { createCommentSchema } from "@/lib/validations/comment"

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const targetType = searchParams.get("targetType")
        const targetId = searchParams.get("targetId")
        if (!targetType || !targetId) {
            return NextResponse.json({ error: "targetType and targetId required" }, { status: 400 })
        }

        await connectDB()
        const comments = await Comment.find({ targetType, targetId }).sort({ createdAt: 1 })

        return NextResponse.json({ success: true, data: comments })
    } catch (err) {
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const body = await req.json()
        const parsed = createCommentSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }

        await connectDB()
        const comment = await Comment.create({ ...parsed.data, authorId: userId })

        pusherServer.trigger(
            `${parsed.data.targetType}-comments-${parsed.data.targetId}`,
            "comment:created",
            JSON.parse(JSON.stringify(comment))
        ).catch(err => console.error("Pusher error:", err))

        return NextResponse.json({ success: true, data: comment }, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}