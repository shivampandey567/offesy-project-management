import { z } from "zod"

export const commentAttachmentSchema = z.object({
    url: z.string().url(),
    name: z.string(),
    type: z.string(),
    size: z.number(),
    isImage: z.boolean(),
})

export const createCommentSchema = z.object({
    targetType: z.enum(["issue", "project"]),
    targetId: z.string(),
    workspaceId: z.string(),
    text: z.string().max(4000).optional().default(""),
    attachment: commentAttachmentSchema.optional(),
})

export const updateCommentSchema = z.object({
    text: z.string().max(4000).optional(),
    attachment: commentAttachmentSchema.nullable().optional(),
})

export const reactionSchema = z.object({
    emoji: z.string().min(1).max(8),
})