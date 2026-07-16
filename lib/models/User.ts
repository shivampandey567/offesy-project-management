//lib/models/User.ts
import mongoose from "mongoose"

const workspaceSchema = new mongoose.Schema({
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', default: null },
    role: { type: String, enum: ["admin", "member"], required: true },
})

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, minlength: 3, maxlength: 30 },
    email: { type: String, required: true },
    title: { type: String, required: true, minlength: 3, maxlength: 30 },
    picture: { type: String, default: null },
    clerkId: { type: String, required: true, unique: true },
    workspaces: { type: [workspaceSchema], default: [] },
    lastWorkspaceUrl: { type: String, default: null },
}, { timestamps: true })

// Get role in a specific workspace
UserSchema.methods.getRoleInWorkspace = function (workspaceId: string) {
    const ws = this.workspaces.find(
        (w: any) => w.workspaceId?.toString() === workspaceId
    )
    return ws?.role || null
}

// Check if user is in a workspace
UserSchema.methods.isInWorkspace = function (workspaceId: string) {
    return this.workspaces.some(
        (w: any) => w.workspaceId?.toString() === workspaceId
    )
}

// Add or update workspace role
UserSchema.methods.addOrUpdateWorkspace = function (workspaceId: string, role: string) {
    const index = this.workspaces.findIndex(
        (w: any) => w.workspaceId?.toString() === workspaceId
    )

    if (index >= 0) {
        this.workspaces[index].role = role
    } else {
        this.workspaces.push({ workspaceId, role })
    }

    return this.save()
}

// Remove workspace
UserSchema.methods.removeWorkspace = function (workspaceId: string) {
    this.workspaces = this.workspaces.filter(
        (w: any) => w.workspaceId?.toString() !== workspaceId
    )
    return this.save()
}

export const User = mongoose.models.User || mongoose.model("User", UserSchema)