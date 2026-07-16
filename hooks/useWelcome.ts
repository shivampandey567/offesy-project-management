import { useWorkspace } from "@/lib/workspace-context"
import { usePathname, useRouter } from "next/navigation"
import { useState, useCallback } from "react"

interface ProfileData {
    name: string
    title: string
    picture?: string | null
}

export const useWelcome = () => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const router = useRouter()
    const pathname = usePathname()
    const workspaceUrl = pathname.replace('/welcome', '')

    const handleFileChange = useCallback((file: File): Promise<string> => {

        return new Promise((resolve) => {
            const img = new Image()
            const url = URL.createObjectURL(file)

            img.onload = () => {
                const canvas = document.createElement('canvas')

                // max 200x200 for avatar
                const MAX = 200
                let w = img.width
                let h = img.height

                if (w > h) {
                    if (w > MAX) { h = (h * MAX) / w; w = MAX }
                } else {
                    if (h > MAX) { w = (w * MAX) / h; h = MAX }
                }

                canvas.width = w
                canvas.height = h

                const ctx = canvas.getContext('2d')!
                ctx.drawImage(img, 0, 0, w, h)

                // 0.7 quality jpeg
                const base64 = canvas.toDataURL('image/jpeg', 0.7)

                URL.revokeObjectURL(url)
                setPreviewImage(base64)
                resolve(base64)
            }

            img.src = url
        })
    }, [])

    const updateProfile = async (data: ProfileData) => {
        setIsSubmitting(true)
        try {
            const res = await fetch("/api/welcome", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to update profile")
            }
            const result = await res.json()

            // Navigate to the new workspace
            router.push(`${workspaceUrl}/inbox`)

            return result

        } finally {
            setIsSubmitting(false)
        }
    }

    const resetPicture = useCallback(() => {
        setPreviewImage(null)
    }, [])

    return { updateProfile, isSubmitting, previewImage, handleFileChange, resetPicture }
}