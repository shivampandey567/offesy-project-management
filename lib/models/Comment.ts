import { Schema, models, model } from "mongoose"

const CommentSchema = new Schema(
    {
        targetType: { type: String, enum: ["issue", "project"], required: true },
        targetId: { type: Schema.Types.ObjectId, required: true },
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
        authorId: { type: String, required: true },
        text: { type: String, default: "" },
        attachment: {
            url: { type: String },
            name: { type: String },
            type: { type: String },
            size: { type: Number },
            isImage: { type: Boolean },
        },
        edited: { type: Boolean, default: false },
        reactions: [
            {
                emoji: { type: String, required: true },
                users: [{ type: String, required: true }],
            },
        ],
    },
    { timestamps: true }
)

CommentSchema.index({ targetType: 1, targetId: 1, createdAt: 1 })

export const Comment = models.Comment || model("Comment", CommentSchema)