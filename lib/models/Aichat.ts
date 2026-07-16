// lib/models/AiChat.ts
import mongoose from "mongoose"

const AiChatMessageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
}, { _id: false })

const AiChatSchema = new mongoose.Schema({
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
    userId: { type: String, required: true }, // clerkId
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    messages: { type: [AiChatMessageSchema], default: [] },
}, { timestamps: true })

AiChatSchema.index({ issueId: 1, userId: 1 }, { unique: true })

export const AiChat = mongoose.models.AiChat || mongoose.model("AiChat", AiChatSchema)