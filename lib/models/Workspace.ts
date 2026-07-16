//lib/models/Workspace.ts
import mongoose, { Schema } from "mongoose"

const memberSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    role: { type: String, enum: ["admin", "member"], required: true },
    joinedAt: { type: Date, default: Date.now }
})

const WorkspaceSchema = new Schema({
    name: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    members: { type: [memberSchema], default: [] },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true })

// Index for quick member lookups
WorkspaceSchema.index({ "members.userId": 1 })

// Check if user is member and get their role
WorkspaceSchema.methods.getUserRole = function (userId: string) {
    const member = this.members.find((m: any) => m.userId === userId)
    return member?.role || null
}

// Add member with role
WorkspaceSchema.methods.addMember = function (userId: string, role: string) {
    // Prevent multiple managers
    if (role === "manager" && this.getManager()) {
        throw new Error("Workspace already has a manager")
    }
    this.members.push({ userId, role })
    return this.save()
}

// Update member role
WorkspaceSchema.methods.updateMemberRole = function (userId: string, newRole: string) {
    const member = this.members.find((m: any) => m.userId === userId)
    if (!member) throw new Error("Member not found")

    // If promoting to manager, demote existing manager
    if (newRole === "manager") {
        const currentManager = this.members.find((m: any) => m.role === "manager")
        if (currentManager) currentManager.role = "admin"
    }

    member.role = newRole
    return this.save()
}

// Remove member
WorkspaceSchema.methods.removeMember = function (userId: string) {
    this.members = this.members.filter((m: any) => m.userId !== userId)
    return this.save()
}

// Check if user is manager
WorkspaceSchema.methods.isManager = function (userId: string) {
    return this.getUserRole(userId) === "manager"
}

export const Workspace = mongoose.models.Workspace || mongoose.model("Workspace", WorkspaceSchema)