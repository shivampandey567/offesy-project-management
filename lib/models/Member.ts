import mongoose from "mongoose"

const MemberSchema = new mongoose.Schema({
    email: { type: String, required: true },
    dept: { type: String },
    workTime: { type: String },
    job: { type: String },
    managerId: { type: String, required: true },
    isRegister: { type: Boolean, default: false },
}, { timestamps: true })

export const Member = mongoose.models.Member || mongoose.model("Member", MemberSchema)