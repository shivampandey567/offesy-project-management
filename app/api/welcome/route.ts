//api/welcome/rote.ts
import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        // get email from Clerk
        const clerkUser = await currentUser()
        const email = clerkUser?.emailAddresses[0]?.emailAddress
        if (!email) { return NextResponse.json({ error: "No email found" }, { status: 400 }) }

        await connectDB()
        const { name, title, picture } = await req.json()

        if (!name || name.length < 3 || name.length > 30) {
            return NextResponse.json(
                { error: "Name must be between 3 and 30 characters" },
                { status: 400 }
            )
        }

        if (!title || title.length < 3 || title.length > 30) {
            return NextResponse.json(
                { error: "Title must be between 3 and 30 characters" },
                { status: 400 }
            )
        }

        const updatedUser = await User.findOneAndUpdate(
            { clerkId: userId },
            {
                $set: {
                    name,
                    title,
                    email,
                    picture: picture || null,
                },
            },
            { returnDocument: 'after', upsert: true, runValidators: false }
        )

        return NextResponse.json({ success: true, data: updatedUser }, { status: 200 })
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Server error" },
            { status: 500 }
        )
    }
}