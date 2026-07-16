"use client"

import * as React from "react"
import { useMemo } from "react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Inbox, Box, UserSquare, Users, Layers2, ClipboardCheck } from "lucide-react"
import { NavSelect } from "./nav-select"
import { NavSecondary } from "./nav-secondary"
import { useWorkspace } from "@/lib/workspace-context"
import { useTeams } from "@/hooks/useTeams"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const ws = useWorkspace()
  const { teams } = useTeams(ws.id)

  const data = useMemo(() => ({
    selects: [
      { name: "Inbox", url: `/${ws.url}/inbox`, icon: <Inbox /> },
      { name: "My issues", url: `/${ws.url}/my-issues/assigned`, icon: <ClipboardCheck /> },
    ],
    workspace: [
      { icon: <Box />, title: "Projects", url: `/${ws.url}/projects` },
      { icon: <UserSquare />, title: "Teams", url: `/${ws.url}/teams` },
      { icon: <Users />, title: "Members", url: `/${ws.url}/members` },
    ],
    teams: teams.map(team => ({
      icon: <span>{team.icon}</span>,
      isActive: false,
      title: team.name,
      url: `/${ws.url}/team/${team.slug}/overview`,
      items: [
        { icon: <Layers2 />, title: "Issues", url: `/${ws.url}/team/${team.slug}/issues` },
        { icon: <Box />, title: "Projects", url: `/${ws.url}/team/${team.slug}/projects` },
      ]
    }))
  }), [teams, ws])  // ✅ recomputes when teams or ws changes

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader><TeamSwitcher /></SidebarHeader>
      <SidebarContent>
        <NavSelect selects={data.selects} />
        <NavMain title="Workspace" isActive={true} items={data.workspace} />
        <NavSecondary title="Your teams" isActive={true} items={data.teams} />
      </SidebarContent>
      <SidebarFooter><NavUser /></SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}