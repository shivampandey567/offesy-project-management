// app/api/upload/attachments/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { put } from "@vercel/blob"
import { MAX_ATTACHMENT_TOTAL_BYTES } from "@/lib/validations/issue"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await req.formData()
        const files: File[] = []

        formData.forEach((value) => {
            if (value instanceof File) files.push(value)
        })

        if (files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 })
        }

        const totalSize = files.reduce((sum, f) => sum + f.size, 0)
        if (totalSize > MAX_ATTACHMENT_TOTAL_BYTES) {
            return NextResponse.json(
                { error: `Total attachment size must not exceed ${MAX_ATTACHMENT_TOTAL_BYTES} bytes` },
                { status: 400 }
            )
        }

        const attachments: {
            url: string
            name: string
            type: string
            size: number
            isImage: boolean
        }[] = []

        for (const file of files) {
            const path = `issues/${userId}/${Date.now()}-${file.name}`

            const blob = await put(path, file, {
                access: "public",
                contentType: file.type || "application/octet-stream",
            })

            attachments.push({
                url: blob.url,
                name: file.name,
                type: file.type || "application/octet-stream",
                size: file.size,
                isImage: file.type.startsWith("image/"),
            })
        }

        return NextResponse.json({ success: true, data: attachments }, { status: 201 })
    } catch (err) {
        console.error("POST /api/upload/attachments error:", err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Server error" },
            { status: 500 }
        )
    }
}
