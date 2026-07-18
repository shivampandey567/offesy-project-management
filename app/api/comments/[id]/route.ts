import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { connectDB } from "@/lib/db"
import { Comment } from "@/lib/models/Comment"
import { pusherServer } from "@/lib/pusherServer"
import { updateCommentSchema } from "@/lib/validations/comment"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id } = await params
        const body = await req.json()
        const parsed = updateCommentSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }

        await connectDB()
        const existing = await Comment.findById(id)
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
        if (existing.authorId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        const updated = await Comment.findByIdAndUpdate(id, { ...parsed.data, edited: true }, { new: true })

        pusherServer.trigger(
            `${existing.targetType}-comments-${existing.targetId}`,
            "comment:updated",
            JSON.parse(JSON.stringify(updated))
        ).catch(err => console.error("Pusher error:", err))

        return NextResponse.json({ success: true, data: updated })
    } catch (err) {
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id } = await params
        await connectDB()

        const existing = await Comment.findById(id)
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
        if (existing.authorId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        await Comment.findByIdAndDelete(id)

        pusherServer.trigger(
            `${existing.targetType}-comments-${existing.targetId}`,
            "comment:deleted",
            { id }
        ).catch(err => console.error("Pusher error:", err))

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}