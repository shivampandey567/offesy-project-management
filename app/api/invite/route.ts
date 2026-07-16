import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { connectDB } from "@/lib/db"
import { Invite } from "@/lib/models/Invite"
import { Workspace } from "@/lib/models/Workspace"
import { Resend } from "resend"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()

        const { email, workspaceId, teamId, role } = await req.json()
        if (!email || !workspaceId) return NextResponse.json({ error: "email and workspaceId required" }, { status: 400 })

        const workspace = await Workspace.findById(workspaceId).lean() as any
        if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })

        // generate unique token
        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48) // 48 hours

        // upsert invite — replace if already pending
        await Invite.findOneAndUpdate(
            { email, workspaceId },
            { token, role: role ?? 'member', teamId: teamId ?? null, status: 'pending', expiresAt },
            { upsert: true, new: true }
        )

        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`

        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: `You're invited to join ${workspace.name}`,
            html: `
                <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
                    <h2>You've been invited to join <strong>${workspace.name}</strong></h2>
                    <p>Click the button below to accept your invitation. This link expires in 48 hours.</p>
                    <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #5b4cf5; color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">
                        Accept Invitation
                    </a>
                    <p style="color: #888; font-size: 12px; margin-top: 24px;">If you didn't expect this, ignore this email.</p>
                </div>
            `
        })

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}