"use client"
import { useEffect, useState } from "react"

export type UserWorkspace = {
  id: string
  name: string
  url: string
  role: string
}

export function useUserWorkspaces() {
  const [workspaces, setWorkspaces] = useState<UserWorkspace[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch("/api/workspaces/me")
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setWorkspaces(d.workspaces || []) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { workspaces, loading }
}