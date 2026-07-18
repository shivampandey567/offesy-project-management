import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { connectDB } from "@/lib/db"
import { Comment } from "@/lib/models/Comment"
import { pusherServer } from "@/lib/pusherServer"
import { reactionSchema } from "@/lib/validations/comment"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id } = await params
        const body = await req.json()
        const parsed = reactionSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }

        await connectDB()
        const comment = await Comment.findById(id)
        if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 })

        const { emoji } = parsed.data
        const reactions = (comment.reactions ?? []) as { emoji: string; users: string[] }[]
        const existing = reactions.find(r => r.emoji === emoji)

        if (!existing) {
            reactions.push({ emoji, users: [userId] })
        } else {
            const idx = existing.users.indexOf(userId)
            if (idx === -1) {
                existing.users.push(userId)
            } else {
                existing.users.splice(idx, 1)
                if (existing.users.length === 0) {
                    const reactionIdx = reactions.findIndex(r => r.emoji === emoji)
                    reactions.splice(reactionIdx, 1)
                }
            }
        }

        comment.reactions = reactions
        await comment.save()

        const updated = JSON.parse(JSON.stringify(comment))

        pusherServer.trigger(
            `${comment.targetType}-comments-${comment.targetId}`,
            "comment:reaction",
            { _id: comment._id, reactions: updated.reactions }
        ).catch(err => console.error("Pusher error:", err))

        return NextResponse.json({ success: true, data: updated.reactions })
    } catch (err) {
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
