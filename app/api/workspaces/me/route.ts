//api/workspace/me/route.ts
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"
import { Workspace } from "@/lib/models/Workspace"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectDB()

    const user = await User.findOne({ clerkId: userId }).lean() as any
    if (!user) return NextResponse.json({ workspaces: [] })

    const ids = (user.workspaces || []).map((w: any) => w.workspaceId)
    const workspaces = await Workspace.find(
      { _id: { $in: ids } },
      { name: 1, url: 1 }
    ).lean()

    const data = workspaces.map((w: any) => ({
      id: w._id.toString(),
      name: w.name,
      url: w.url,
      role: user.workspaces.find(
        (uw: any) => uw.workspaceId.toString() === w._id.toString()
      )?.role,
    }))

    return NextResponse.json({ workspaces: data })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}