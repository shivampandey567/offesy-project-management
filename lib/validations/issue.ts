import { z } from "zod"

export const MAX_TITLE_WORDS = 150
export const MAX_DESCRIPTION_WORDS = 1000
export const MAX_ATTACHMENT_TOTAL_BYTES = 10 * 1024 * 1024

const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

export const attachmentInputSchema = z.object({
    url: z.string(),
    name: z.string(),
    type: z.string().optional(),
    size: z.number(),
    isImage: z.boolean().optional(),
})

const subIssueSchema = z.object({
    title: z.string(),
    done: z.boolean(),
})

export const issueSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "Title is required")
        .refine((v) => countWords(v) <= MAX_TITLE_WORDS, `Title must be ${MAX_TITLE_WORDS} words or fewer`),

    description: z
        .string()
        .trim()
        .optional()
        .default("")
        .refine((v) => countWords(v ?? "") <= MAX_DESCRIPTION_WORDS, `Description must be ${MAX_DESCRIPTION_WORDS} words or fewer`),

    priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional().nullable(),

    teamId: z.string().min(1, "Team is required"),
    workspaceId: z.string().min(1, "Workspace is required"),

    assignee: z.string().optional().nullable(),

    project: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),

    subIssues: z.array(subIssueSchema).optional().default([]),

    attachments: z
        .array(attachmentInputSchema)
        .optional()
        .default([])
        .refine(
            (arr) => arr.reduce((sum, f) => sum + (f.size || 0), 0) <= MAX_ATTACHMENT_TOTAL_BYTES,
            "Total attachment size must not exceed 10MB"
        ),
})

export const issueUpdateSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "Title is required")
        .refine((v) => countWords(v) <= MAX_TITLE_WORDS, `Title must be ${MAX_TITLE_WORDS} words or fewer`)
        .optional(),

    description: z
        .string()
        .trim()
        .refine((v) => countWords(v ?? "") <= MAX_DESCRIPTION_WORDS, `Description must be ${MAX_DESCRIPTION_WORDS} words or fewer`)
        .optional(),

    priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional().nullable(),

    assignee: z.string().optional().nullable(),

    project: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),

    subIssues: z.array(subIssueSchema).optional(),

    status: z.enum(["Pending", "Active", "Done", "Refused"]).optional(),
    action: z.enum(["Hold", "Cancelled"]).nullable().optional(),

    attachments: z
        .array(attachmentInputSchema)
        .optional()
        .refine(
            (arr) => !arr || arr.reduce((sum, f) => sum + (f.size || 0), 0) <= MAX_ATTACHMENT_TOTAL_BYTES,
            "Total attachment size must not exceed 10MB"
        ),
})

export type IssueInput = z.infer<typeof issueSchema>
export type IssueUpdateInput = z.infer<typeof issueUpdateSchema>