// hooks/useUploadAttachments.ts
'use client'
import { useState } from "react"

export type UploadedAttachment = {
    url: string
    name: string
    type: string
    size: number
    isImage: boolean
}

export const useUploadAttachments = () => {
    const [uploading, setUploading] = useState(false)

    const uploadAttachments = async (files: File[]): Promise<UploadedAttachment[]> => {
        if (files.length === 0) return []

        setUploading(true)
        try {
            const formData = new FormData()
            files.forEach((file) => formData.append("files", file, file.name))

            const res = await fetch("/api/upload/attachments", {
                method: "POST",
                body: formData,
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error ?? "Failed to upload attachments")
            }

            const json = await res.json()
            return json.data as UploadedAttachment[]
        } finally {
            setUploading(false)
        }
    }

    return { uploadAttachments, uploading }
}
