// lib/ai/rag.ts
import { connectDB } from "@/lib/db"
import { Issue } from "@/lib/models/Issue"
import { IssueEmbedding } from "@/lib/models/IssueEmbedding"
import { embedText, embedBatch, cosineSim } from "./embeddings"

export type IssueDoc = {
    _id: any
    workspaceId: any
    title?: string
    description?: string
    status?: string
    priority?: string
    subIssues?: { title: string; done?: boolean }[]
}

export function issueToText(i: IssueDoc): string {
    const subs = (i.subIssues ?? []).map((s) => `- ${s.title}`).join('\n')
    return [
        `Title: ${i.title ?? ''}`,
        `Status: ${i.status ?? ''} | Priority: ${i.priority ?? ''}`,
        i.description ? `Description:\n${i.description}` : '',
        subs ? `Sub-issues:\n${subs}` : '',
    ]
        .filter(Boolean)
        .join('\n\n')
        .slice(0, 4000)
}

export async function ensureWorkspaceEmbeddings(workspaceId: string, excludeIssueId?: string) {
    await connectDB()

    const issues = await Issue.find({ workspaceId }).lean() as unknown as IssueDoc[]

    const cached = await IssueEmbedding.find({ workspaceId }).select('issueId hash').lean()
    const cachedMap = new Map(cached.map((c: any) => [String(c.issueId), c.hash]))

    const toEmbed: { issue: IssueDoc; text: string; hash: string }[] = []
    for (const issue of issues) {
        const issueIdStr = String(issue._id)
        if (excludeIssueId && issueIdStr === String(excludeIssueId)) continue
        const text = issueToText(issue)
        const hash = simpleHash(text)
        if (cachedMap.get(issueIdStr) === hash) continue
        toEmbed.push({ issue, text, hash })
    }

    if (toEmbed.length) {
        for (let i = 0; i < toEmbed.length; i += 20) {
            const group = toEmbed.slice(i, i + 20)
            const vectors = await embedBatch(group.map((g) => g.text))

            const ops = group.map((g, idx) => ({
                updateOne: {
                    filter: { issueId: g.issue._id },
                    update: {
                        $set: {
                            issueId: g.issue._id,
                            workspaceId: g.issue.workspaceId,
                            title: g.issue.title ?? '',
                            text: g.text,
                            embedding: vectors[idx],
                            hash: g.hash,
                        },
                    },
                    upsert: true,
                },
            }))
            if (ops.length) await IssueEmbedding.bulkWrite(ops)
        }
    }
}

export async function retrieveRelated(
    workspaceId: string,
    query: string,
    currentIssueId: string,
    k = 4
) {
    await connectDB()

    const [queryVec, docs] = await Promise.all([
        embedText(query),
        IssueEmbedding.find({ workspaceId, issueId: { $ne: currentIssueId } })
            .select('issueId title text embedding')
            .lean(),
    ])

    const scored = docs
        .map((d: any) => ({
            issueId: d.issueId,
            title: d.title,
            text: d.text,
            score: cosineSim(queryVec, d.embedding ?? []),
        }))
        .filter((d) => d.score > 0.35)
        .sort((a, b) => b.score - a.score)
        .slice(0, k)

    return scored
}

function simpleHash(s: string): string {
    let h = 0
    for (let i = 0; i < s.length; i++) {
        h = (h << 5) - h + s.charCodeAt(i)
        h |= 0
    }
    return h.toString(36)
}