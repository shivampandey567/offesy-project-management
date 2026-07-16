// [url]/(dashboard)/inbox/page.tsx
import { connectDB } from "@/lib/db"

export default async function InboxPage({
  params,
}: {
  params: Promise<{ url: string }>
}) {
  const { url } = await params
  await connectDB()

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Inbox</h1>
      <p className="text-muted-foreground text-sm">
        Welcome to <span className="font-mono">{url}</span>
      </p>
    </div>
  )
}