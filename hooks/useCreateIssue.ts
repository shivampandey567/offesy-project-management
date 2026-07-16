// hooks/useCreateIssue.ts
'use client'
import { issueSchema } from "@/lib/validations/issue"
import { useState } from "react"

export const useCreateIssue = () => {
    const [submitting, setSubmitting] = useState(false)

    const createIssue = async (payload: Record<string, any>) => {
        const parsed = issueSchema.safeParse(payload)
        if (!parsed.success) {
            throw new Error(parsed.error.issues[0]?.message ?? 'Invalid issue data')
        }

        setSubmitting(true)
        try {
            const res = await fetch('/api/issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed.data),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error ?? 'Failed to create issue')
            }
            return res.json()
        } finally {
            setSubmitting(false)
        }
    }

    return { createIssue, submitting }
}