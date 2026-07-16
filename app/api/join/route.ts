//api/join/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { connectDB } from "@/lib/db"
import { Workspace } from "@/lib/models/Workspace"
import { User } from "@/lib/models/User"

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()
        const { name, url } = await req.json()
        if (!name || !url) return NextResponse.json({ error: "Name and URL required" }, { status: 400 })

        const existing = await Workspace.findOne({ url })
        if (existing) return NextResponse.json({ error: "URL already taken" }, { status: 409 })

        //get or create user
        const user = await User.findOneAndUpdate(
            { clerkId: userId },
            { $setOnInsert: { clerkId: userId } },
            { returnDocument: 'after', upsert: true, runValidators: false }
        )

        //create workspace
        const workspace = await Workspace.create({
            name,
            url,
            adminId: user._id,
            members: [{ userId: user._id, role: "admin" }]
        })

        //add workspace to user
        await User.findByIdAndUpdate(user._id, {
            $addToSet: {
                workspaces: { workspaceId: workspace._id, role: "admin" }
            },
            $set: {
                lastWorkspaceUrl: url  // ✅ save last workspace
            }
        })

        return NextResponse.json({ success: true, data: workspace }, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}