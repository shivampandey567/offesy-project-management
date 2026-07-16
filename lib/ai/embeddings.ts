// lib/ai/embeddings.ts
const EMBED_MODEL = 'gemini-embedding-001'
const OUTPUT_DIM = 768 // smaller, faster, plenty for this RAG use case

export async function embedText(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${process.env.GOOGLE_AI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text: text.slice(0, 8000) }] },
        outputDimensionality: OUTPUT_DIM,
      }),
    }
  )
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Embedding failed: ${err}`)
  }
  const data = await res.json()
  return data.embedding?.values ?? []
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:batchEmbedContents?key=${process.env.GOOGLE_AI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: texts.map((t) => ({
          model: `models/${EMBED_MODEL}`,
          content: { parts: [{ text: t.slice(0, 8000) }] },
          outputDimensionality: OUTPUT_DIM,
        })),
      }),
    }
  )
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Batch embedding failed: ${err}`)
  }
  const data = await res.json()
  return (data.embeddings ?? []).map((e: any) => e.values ?? [])
}

export function cosineSim(a: number[], b: number[]): number {
  if (!a?.length || !b?.length || a.length !== b.length) return 0
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom === 0 ? 0 : dot / denom
}