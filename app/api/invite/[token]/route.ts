//app/api/invite/[token]
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { connectDB } from "@/lib/db"
import { Invite } from "@/lib/models/Invite"
import { Workspace } from "@/lib/models/Workspace"
import { Team } from "@/lib/models/Team"
import { User } from "@/lib/models/User"

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()
        const { token } = await params

        const invite = await Invite.findOne({ token, status: 'pending' })
        if (!invite) return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 })

        if (invite.expiresAt < new Date()) {
            await Invite.findByIdAndUpdate(invite._id, { status: 'expired' })
            return NextResponse.json({ error: "Invite expired" }, { status: 410 })
        }

        const user = await User.findOne({ clerkId: userId }).lean() as any
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

        // add to workspace members if not already
        const workspace = await Workspace.findById(invite.workspaceId)
        const alreadyInWorkspace = workspace.members.some(
            (m: any) => m.userId.toString() === user._id.toString()
        )
        if (!alreadyInWorkspace) {
            await Workspace.findByIdAndUpdate(invite.workspaceId, {
                $push: { members: { userId: user._id, role: invite.role } }
            })
            await User.findByIdAndUpdate(user._id, {
                $addToSet: { workspaces: { workspaceId: invite.workspaceId, role: invite.role } }
            })
        }

        // add to team if teamId present
        if (invite.teamId) {
            const team = await Team.findById(invite.teamId)
            const alreadyInTeam = team?.members.some(
                (m: any) => m.userId.toString() === user._id.toString()
            )
            if (!alreadyInTeam) {
                await Team.findByIdAndUpdate(invite.teamId, {
                    $push: { members: { userId: user._id, role: 'member' } }
                })
            }
        }

        // mark invite accepted
        await Invite.findByIdAndUpdate(invite._id, { status: 'accepted' })

        return NextResponse.json({ success: true, workspaceUrl: workspace.url })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}