import mongoose from "mongoose"
import '@/lib/models/Project'
import '@/lib/models/User'
import '@/lib/models/Team' 
import '@/lib/models/Workspace' 
import '@/lib/models/Issue' 
import '@/lib/models/Aichat'
import '@/lib/models/IssueEmbedding'

const MONGODB_URI = process.env.MONGODB_URI as string

if (!MONGODB_URI) throw new Error("Please define MONGODB_URI in .env.local")

let cached = (global as any).mongoose || { conn: null, promise: null }

export async function connectDB() {
    if (cached.conn) return cached.conn
    cached.promise = cached.promise || mongoose.connect(MONGODB_URI)
    cached.conn = await cached.promise
    return cached.conn
}