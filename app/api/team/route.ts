// api/team/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { connectDB } from "@/lib/db"
import { Team } from "@/lib/models/Team"
import { User } from "@/lib/models/User"
import { pusherServer } from "@/lib/pusherServer"

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()

        const { searchParams } = new URL(req.url)
        const workspaceId = searchParams.get('workspaceId')
        if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 })

        const user = await User.findOne({ clerkId: userId }).lean() as any
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

        // only return teams where user is a member
        const teams = await Team.find({
            workspaceId,
            'members.userId': user._id
        }).sort({ createdAt: -1 })

        return NextResponse.json({ success: true, data: teams })
    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()

        const { name, icon, workspaceId, description } = await req.json()
        if (!name || !workspaceId) return NextResponse.json({ error: "Name and workspaceId required" }, { status: 400 })

        const user = await User.findOne({ clerkId: userId }).lean() as any
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

        // check unique name within workspace
        const existingName = await Team.findOne({ name, workspaceId })
        if (existingName) return NextResponse.json({ error: "Team name already exists in this workspace" }, { status: 409 })

        // generate slug from first 3 letters — e.g. "Development" → "DEV"
        const baseSlug = name.slice(0, 3).toUpperCase()

        // make sure slug is unique within workspace
        let slug = baseSlug
        let count = 1
        while (await Team.findOne({ slug, workspaceId })) {
            slug = `${baseSlug}${count}`
            count++
        }

        const team = await Team.create({
            name,
            slug,
            icon: icon ?? '👤',
            workspaceId,
            description: description ?? null,
            adminId: user._id,
            members: [{ userId: user._id, role: "admin" }]
        })


        const serialized = JSON.parse(JSON.stringify(team))

        pusherServer.trigger(`workspace-${workspaceId}`, 'team:created', serialized)
            .catch(err => console.error('Pusher error:', err))

        return NextResponse.json({ success: true, data: serialized }, { status: 201 })
    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}