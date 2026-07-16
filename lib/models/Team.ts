// lib/models/Team.ts
import mongoose from "mongoose"

const memberSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    role: { type: String, enum: ["admin", "member"], required: true },
    joinedAt: { type: Date, default: Date.now }
})

const TeamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true },
    icon: { type: String, default: '👤' },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', default: null },
    members: { type: [memberSchema], default: [] },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    description: { type: String, default: null }
}, { timestamps: true })

// ✅ unique per workspace, not globally
TeamSchema.index({ slug: 1, workspaceId: 1 }, { unique: true })
TeamSchema.index({ name: 1, workspaceId: 1 }, { unique: true })

export const Team = mongoose.models.Team || mongoose.model("Team", TeamSchema)