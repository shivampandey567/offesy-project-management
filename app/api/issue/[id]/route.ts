// app/api/issue/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import mongoose from "mongoose"
import { connectDB } from "@/lib/db"
import { Issue } from "@/lib/models/Issue"
import { User } from "@/lib/models/User"
import { pusherServer } from "@/lib/pusherServer"
import { issueSchema } from "@/lib/validations/issue"
import { issueUpdateSchema } from "@/lib/validations/issue"   // 👈 swap import


const canAccess = (issue: any, clerkUserId: string, userMongoId: string) => {
    if (issue.createdBy === clerkUserId) return true
    const assigneeId = String(issue.assignee?._id ?? issue.assignee)
    return assigneeId.includes(String(userMongoId))
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()
        const { id } = await params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid issue id" }, { status: 400 })
        }

        const user = await User.findOne({ clerkId: userId }).select('_id').lean() as any
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

        const issue = await Issue.findById(id)
            .populate('assignee', 'name email picture')
            .populate('teamId', 'name icon slug')
            .lean() as any

        if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 })

        if (!canAccess(issue, userId, user._id.toString())) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // ── role flags ──
        const isCreator = issue.createdBy === userId
        const userMongoId = user._id.toString()
        const assigneeId = String(issue.assignee?._id ?? issue.assignee)
        const isAssignee = assigneeId === userMongoId

        return NextResponse.json({
            success: true,
            data: issue,
            meta: { isCreator, isAssignee }
        })
    } catch (err) {
        console.error('GET /api/issue/[id] error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Server error" },
            { status: 500 }
        )
    }
}

const CREATOR_ONLY_FIELDS = [
    'title', 'description', 'markup', 'priority',
    'assignee', 'dueDate', 'action', 'project', 'attachments',
]


export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()
        const { id } = await params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid issue id" }, { status: 400 })
        }

        const body = await req.json()

        const user = await User.findOne({ clerkId: userId }).select('_id').lean() as any
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

        const existing = await Issue.findById(id).lean() as any
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
        if (!canAccess(existing, userId, user._id.toString())) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // ✅ non-creators (plain assignees) may only touch status + subIssues
        const isCreatorUser = existing.createdBy === userId
        if (!isCreatorUser) {
            const disallowed = Object.keys(body).filter((k) => CREATOR_ONLY_FIELDS.includes(k))
            if (disallowed.length > 0) {
                return NextResponse.json(
                    { error: `Not allowed to update: ${disallowed.join(', ')}` },
                    { status: 403 }
                )
            }
        }

        // ✅ use the update schema — no field gets a phantom default anymore
        const parsed = issueUpdateSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message ?? "Validation failed" },
                { status: 400 }
            )
        }

        const issue = await Issue.findByIdAndUpdate(id, { $set: parsed.data }, { returnDocument: 'after' })
            .populate('assignee', 'name email picture')
            .populate('teamId', 'name icon slug')

        if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 })

        const serialized = JSON.parse(JSON.stringify(issue))

        // 👇 only send the diff over Pusher, not the whole doc
        const pusherPayload = { _id: id, ...JSON.parse(JSON.stringify(parsed.data)) }

        pusherServer.trigger(`issue-${id}`, 'issue:updated', pusherPayload)
            .catch(err => console.error('Pusher error:', err))
        pusherServer.trigger(`team-${String(issue.teamId._id ?? issue.teamId)}`, 'issue:updated', pusherPayload)
            .catch(err => console.error('Pusher error:', err))

        return NextResponse.json({ success: true, data: serialized })  // full doc still returned to caller via HTTP, that's fine — only Pusher has the 10KB cap
    } catch (err) {
        console.error('PATCH /api/issue/[id] error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Server error" },
            { status: 500 }
        )
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()
        const { id } = await params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid issue id" }, { status: 400 })
        }

        const user = await User.findOne({ clerkId: userId }).select('_id').lean() as any
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

        const existing = await Issue.findById(id).lean() as any
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
        if (!canAccess(existing, userId, user._id.toString())) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        if (existing.createdBy !== userId) {
            return NextResponse.json({ error: "Only the creator can delete this issue" }, { status: 403 })
        }

        const issue = await Issue.findByIdAndDelete(id)

        pusherServer.trigger(`issue-${id}`, 'issue:deleted', { id })
            .catch(err => console.error('Pusher error:', err))
        pusherServer.trigger(`team-${String(existing.teamId)}`, 'issue:deleted', { id })
            .catch(err => console.error('Pusher error:', err))

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('DELETE /api/issue/[id] error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Server error" },
            { status: 500 }
        )
    }
}