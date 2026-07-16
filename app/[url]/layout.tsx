//[url]/layout.tsx
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { connectDB } from "@/lib/db"
import { Workspace } from "@/lib/models/Workspace"
import { User } from "@/lib/models/User"
import { WorkspaceProvider } from "@/lib/workspace-context"

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ url: string }>
}) {
  const { url } = await params
  if (!SLUG_REGEX.test(url)) redirect("/not-found")

  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  await connectDB()

  const workspace = (await Workspace.findOne({ url }).lean()) as any
  if (!workspace) redirect("/not-found")

  const user = (await User.findOne({ clerkId: userId }).lean()) as any
  const member = user && workspace.members.find(
    (m: any) => m.userId?.toString() === user._id.toString()
  )
  if (!member) redirect("/not-access")

  // ✅ save last visited workspace url
  await User.findByIdAndUpdate(user._id, { lastWorkspaceUrl: url })

  const safeWorkspace = {
    id: workspace._id.toString(),
    name: workspace.name,
    url: workspace.url,
    role: member.role as string,
  }

  return (
    <WorkspaceProvider workspace={safeWorkspace}>
      {children}
    </WorkspaceProvider>
  )
}