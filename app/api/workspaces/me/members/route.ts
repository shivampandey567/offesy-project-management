// app/api/workspace/me/members/route.ts
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"
import { Workspace } from "@/lib/models/Workspace"

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get("workspaceId")

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId query param is required" },
        { status: 400 }
      )
    }

    await connectDB()

    // Find the user to verify they belong to this workspace
    const user = await User.findOne({ clerkId: userId }).lean() as any
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userWorkspace = user.workspaces?.find(
      (w: any) => w.workspaceId.toString() === workspaceId
    )
    if (!userWorkspace) {
      return NextResponse.json(
        { error: "You are not a member of this workspace" },
        { status: 403 }
      )
    }

    // Fetch workspace with populated member details
    const workspace = await Workspace.findById(workspaceId)
      .populate({
        path: "members.userId",
        select: "name email avatar clerkId",
        model: "User",
      })
      .lean()

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const members = (workspace.members || []).map((m: any) => ({
      id: m.userId?._id?.toString() || m.userId?.toString(),
      name: m.userId?.name || "Unknown",
      email: m.userId?.email || null,
      avatar: m.userId?.avatar || null,
      clerkId: m.userId?.clerkId || null,
      role: m.role,
      joinedAt: m.joinedAt,
    }))

    return NextResponse.json({
      workspaceId,
      members,
      total: members.length,
      yourRole: userWorkspace.role,
    })
  } catch (error) {
    console.error("GET /api/workspace/me/members error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}