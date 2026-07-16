import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { connectDB } from "@/lib/db"
import { Workspace } from "@/lib/models/Workspace"
import { User } from "@/lib/models/User"

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()

        const url = req.nextUrl.searchParams.get('workspaceUrl')
        if (!url) return NextResponse.json({ error: "Missing workspaceUrl" }, { status: 400 })

        const workspace = await Workspace.findOne({ url }).lean<any>()
        if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 })

        const userIds = (workspace.members ?? []).map((m: any) => m.userId).filter(Boolean)
        const users = await User.find({ _id: { $in: userIds } }).select('name email clerkId')

        const members = (workspace.members ?? []).map((m: any) => {
            const u = users.find((u: any) => String(u._id) === String(m.userId))
            return {
                userId: String(m.userId),
                clerkId: u?.clerkId ?? null,
                name: u?.name ?? 'Unknown',
                email: u?.email ?? '',
            }
        })

        return NextResponse.json({ success: true, data: members })
    } catch (err) {
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}


// import { NextRequest, NextResponse } from "next/server"
// import { auth } from "@clerk/nextjs/server"
// import { connectDB } from "@/lib/db"
// import { Workspace } from "@/lib/models/Workspace"
// import { User } from "@/lib/models/User"
// import { useWorkspace } from "@/lib/workspace-context"

// export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
//     try {
//         const { userId } = await auth()
//         if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//         await connectDB()
//         const ws=useWorkspace()
//         const { id } = await params  // this is the workspace `url`, e.g. "bro"

//         const workspace = await Workspace.findOne({ url: ws.url }).lean<any>()
//         if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 })

//         const userIds = (workspace.members ?? []).map((m: any) => m.userId).filter(Boolean)
//         const users = await User.find({ _id: { $in: userIds } }).select('name email clerkId')

//         const members = (workspace.members ?? []).map((m: any) => {
//             const u = users.find((u: any) => String(u._id) === String(m.userId))
//             return {
//                 userId: String(m.userId),
//                 clerkId: u?.clerkId ?? null,
//                 name: u?.name ?? 'Unknown',
//                 email: u?.email ?? '',
//             }
//         })

//         return NextResponse.json({ success: true, data: members })
//     } catch (err) {
//         return NextResponse.json({ error: "Server error" }, { status: 500 })
//     }
// }