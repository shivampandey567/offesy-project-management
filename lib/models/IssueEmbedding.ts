// lib/models/IssueEmbedding.ts
import mongoose from "mongoose"

const IssueEmbeddingSchema = new mongoose.Schema({
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true, unique: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    title: { type: String, default: '' },
    text: { type: String, default: '' },
    embedding: { type: [Number], default: [] },
    hash: { type: String, default: '' },
}, { timestamps: true })

IssueEmbeddingSchema.index({ workspaceId: 1 })

export const IssueEmbedding = mongoose.models.IssueEmbedding || mongoose.model("IssueEmbedding", IssueEmbeddingSchema)