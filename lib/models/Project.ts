import mongoose from "mongoose"

const MileSchema = new mongoose.Schema({
    name: { type: String },
    description: { type: String },
    dueDate: { type: String },
}, { timestamps: true })

const ProjectSchema = new mongoose.Schema({
    icon: { type: String },
    name: { type: String, required: true },
    description: { type: String },
    status: {
        type: String,
        enum: ['Pending', 'Planned', 'Active', 'Completed', 'Cancelled'],
        default: 'Pending',
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent', null],
        default: null,
    },
    members: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    dueDate: { type: String },
    labels: { type: [String], default: [] },
    milestones: { type: [MileSchema], default: [] },
    createdBy: { type: String, required: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    teamId: { type: [mongoose.Schema.Types.ObjectId], ref: 'Team', required: true },
}, { timestamps: true })

ProjectSchema.index({ workspaceId: 1, createdAt: -1 })

export const Project = mongoose.models.Project || mongoose.model("Project", ProjectSchema)