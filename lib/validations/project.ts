// lib/validations/project.ts
import { z } from "zod"

const milestoneSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    dueDate: z.string().optional(),
})

// CREATE
export const projectCreateSchema = z.object({
    workspaceId: z.string().min(1, "workspaceId is required"),
    teamId: z.array(z.string()).min(1, "select at least one team"),
    icon: z.string().optional(),
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional(),
    status: z.enum(['Pending', 'Planned', 'Active', 'Completed', 'Cancelled']).default('Pending'),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).nullable().default(null),
    members: z.array(z.string()).default([]),
    dueDate: z.string().optional(),
    labels: z.array(z.string()).default([]),
    milestones: z.array(milestoneSchema).default([]),
})

// UPDATE — no .default() anywhere, PATCH schema stays clean
export const projectUpdateSchema = z.object({
    icon: z.string().optional(),
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(['Pending', 'Planned', 'Active', 'Completed', 'Cancelled']).optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).nullable().optional(),
    members: z.array(z.string()).optional(),
    teamId: z.array(z.string()).min(1).optional(),
    dueDate: z.string().optional(),
    labels: z.array(z.string()).optional(),
    milestones: z.array(milestoneSchema).optional(),
})