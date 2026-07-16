// lib/workspace-context.tsx
"use client"
import { createContext, useContext } from "react"

type Workspace = { id: string; name: string; url: string; role?: string }  // role optional
const Ctx = createContext<Workspace | null>(null)

export function WorkspaceProvider({
  workspace,
  children,
}: {
  workspace: Workspace
  children: React.ReactNode
}) {
  return <Ctx.Provider value={workspace}>{children}</Ctx.Provider>
}

export const useWorkspace = () => {
  const ws = useContext(Ctx)
  if (!ws) throw new Error("useWorkspace must be inside WorkspaceProvider")
  return ws
}