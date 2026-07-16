import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await connectDB()
        const user = await User.findOne({ clerkId: userId }).lean() as any
        if (!user) return NextResponse.json({ name: null })

        return NextResponse.json({ name: user.name || null })
    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}