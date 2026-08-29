// lib/models/Issue.ts
import mongoose, { Schema } from "mongoose"

const attachmentSchema = new Schema({
    url: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, default: null },
    size: { type: Number, default: null },
    isImage: { type: Boolean, default: false },
}, { _id: false })

const IssueSchema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },

    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent',null],
        default: null,
    },

    // scoping — every issue belongs to one team, within one workspace
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },

    // optional grouping under a project (matches your existing Project model usage in Task)
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },

    // multi-assignee, matches teamMembers-based picker in IssueCard
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Clerk userId of the creator (string, consistent with Task's managerId pattern)
    createdBy: { type: String, required: true },

    dueDate: { type: Date, default: null },

    attachments: {
        type: [attachmentSchema],
        default: [],
        validate: {
            validator: (arr: any[]) => arr.reduce((sum, f) => sum + (f.size || 0), 0) <= 10 * 1024 * 1024,
            message: 'Total attachment size must not exceed 10MB',
        },
    },


    subIssues: {
        type: [{
            title: { type: String, required: true },
            done: { type: Boolean, default: false },
        }],
        default: [],
    },

    // soft-state, mirrors Task's action field (hold/cancelled) if you want parity
    action: { type: String, enum: ['Hold', 'Cancelled', null], default: null },

    status: {
        type: String,
        enum: ['Pending', 'Active', 'Done', 'Refused'],
        default: 'Pending',
    },

    labels: { type: [String], default: [] },

}, { timestamps: true })

// Fast lookups: all issues for a team, filterable by status/priority
IssueSchema.index({ teamId: 1, status: 1 })
IssueSchema.index({ workspaceId: 1, createdAt: -1 })
IssueSchema.index({ assignee: 1 })
IssueSchema.index({ project: 1 })

export const Issue = mongoose.models.Issue || mongoose.model('Issue', IssueSchema)