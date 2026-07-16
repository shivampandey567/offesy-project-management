// app/api/ai/issue-assistant/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import { AiChat } from '@/lib/models/Aichat'
import { ensureWorkspaceEmbeddings, retrieveRelated } from '@/lib/ai/rag'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { message, issueId, workspaceId, issueContext, history } = await req.json()
        if (!message || !issueId || !workspaceId) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        await connectDB()

        const persistUserMsg = AiChat.updateOne(
            { issueId, userId },
            {
                $setOnInsert: { issueId, userId, workspaceId },
                $push: { messages: { role: 'user', content: message } },
            },
            { upsert: true }
        )

        ensureWorkspaceEmbeddings(workspaceId, issueId).catch((e) =>
            console.warn('embed refresh failed', e?.message)
        )

        const [_persist, related] = await Promise.all([
            persistUserMsg,
            retrieveRelated(workspaceId, `${issueContext?.title ?? ''} ${message}`, issueId, 4).catch(
                () => []
            ),
        ])

        const ragBlock = related.length
            ? `\nRelated issues in this workspace (for context, do not repeat verbatim):\n${related
                .map((r, i) => `[${i + 1}] ${r.title}\n${r.text.slice(0, 500)}`)
                .join('\n---\n')}\n`
            : ''

        const systemPrompt = `You are an expert project-management copilot embedded inside an issue-tracking app.
You help the user understand, plan, unblock, and break down a specific issue.

Current issue
─────────────
- Title: ${issueContext?.title ?? ''}
- Description: ${issueContext?.description || 'None'}
- Status: ${issueContext?.status ?? ''}
- Priority: ${issueContext?.priority || 'None'}
- Existing sub-issues: ${(issueContext?.subIssues ?? []).map((s: any) => s.title).join(', ') || 'None'}
${ragBlock}
Guidelines
──────────
1. Be concise, structured, action-oriented. Short paragraphs, bullet lists.
2. Use **bold** for key terms and \`inline code\` for identifiers/commands.
3. When asked to generate sub-issues, ALWAYS return a fenced JSON block:
\`\`\`json
[{"title": "Clear, actionable task", "done": false}]
\`\`\`
4. Reference related issues by their title when relevant (from the context above).
5. If unsure, ask a single clarifying question.`

        const contents = [
            ...(history ?? []).slice(-6).map((m: { role: string; content: string }) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            })),
            { role: 'user', parts: [{ text: message }] },
        ]

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemPrompt }] },
                    contents,
                    generationConfig: {
                        maxOutputTokens: 700,
                        temperature: 0.6,
                        thinkingConfig: { thinkingBudget: 0 },
                    },
                }),
            }
        )

        const data = await response.json()

        if (!response.ok) {
            console.error('Gemini API error:', data)
            return NextResponse.json({ error: data.error?.message ?? 'AI request failed' }, { status: 500 })
        }

        const reply = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') ?? ''

        if (reply) {
            AiChat.updateOne(
                { issueId, userId },
                { $push: { messages: { role: 'assistant', content: reply } } }
            ).catch((e) => console.warn('persist reply failed', e?.message))
        }

        return NextResponse.json({ success: true, reply })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}