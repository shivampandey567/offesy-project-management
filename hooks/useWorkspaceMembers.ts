// hooks/use-workspace-members.ts
import { useEffect, useState } from "react"

interface Member {
  id: string
  name: string
  email: string | null
  avatar: string | null
  clerkId: string | null
  role: "admin" | "member"
  joinedAt: string
}

export const useWorkspaceMembers = (workspaceId?: string) => {
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!workspaceId) {
            setMembers([])
            setLoading(false)
            return
        }

        setLoading(true)
        fetch(`/api/workspaces/me/members?workspaceId=${workspaceId}`)
            .then(res => res.json())
            .then(data => {
                setMembers(data.members || [])
                setLoading(false)
            })
            .catch(() => {
                setMembers([])
                setLoading(false)
            })
    }, [workspaceId])

    return { members, loading }
}