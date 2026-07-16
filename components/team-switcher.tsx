"use client"

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Check, ChevronDown, ClipboardPen, Plus, Search } from "lucide-react"
import { Button } from "./ui/button"
import { ThemeToggle } from "./theme-toggle"
import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useWorkspace } from "@/lib/workspace-context"
import { useUserWorkspaces } from "@/hooks/useUserWorkspaces"

// Stable color from string (so every workspace has a consistent badge color)
const COLORS = ["bg-emerald-500", "bg-indigo-500", "bg-rose-500", "bg-amber-500", "bg-sky-500", "bg-fuchsia-500"]
const colorFor = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return COLORS[Math.abs(h) % COLORS.length]
}

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const current = useWorkspace()                // ← current workspace from layout
  const { workspaces, loading } = useUserWorkspaces()

  const initials = current.name.slice(0, 2).toUpperCase()

  const switchTo = (url: string) => {
    if (url === current.url) return
    router.push(`/${url}/inbox`)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="p-1 data-[state=open]:bg-sidebar-accent w-[70%]">
              <div className={`flex aspect-square size-6 items-center justify-center rounded-md text-white text-[10px] font-semibold ${colorFor(current.url)}`}>
                {initials}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate text-accent-foreground font-medium">{current.name}</span>
              </div>
              <ChevronDown className="ml-auto text-muted-foreground" strokeWidth="2.5" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="flex items-center bg-sidebar rounded-lg justify-between">
              Change theme <ThemeToggle />
            </DropdownMenuLabel>

            <DropdownMenuItem
              className="p-2 font-medium text-muted-foreground"
              onClick={() => router.push(`/${current.url}/settings`)}
            >
              Settings
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Switch workspace — listed dynamically */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="font-medium text-muted-foreground gap-2 p-2">
                Switch workspace
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-40 md:w-60">
                  <DropdownMenuLabel className="text-muted-foreground truncate line-clamp-1 ml-1">
                    {user?.primaryEmailAddress?.emailAddress}
                  </DropdownMenuLabel>

                  {loading ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground">Loading…</div>
                  ) : workspaces.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground">No workspaces</div>
                  ) : (
                    workspaces.map((w) => {
                      const active = w.url === current.url
                      return (
                        <DropdownMenuItem
                          key={w.id}
                          onClick={() => switchTo(w.url)}
                          className="flex items-center gap-2 p-2 rounded-full"
                        >
                          <div className={`flex aspect-square size-6 items-center justify-center rounded-full text-white !text-white text-[10px] font-semibold ${colorFor(w.url)}`}>
                            {w.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm line-clamp-1">{w.name}</p>
                          </div>
                          {active && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                        </DropdownMenuItem>
                      )
                    })
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/join")} className="gap-2">
                    <Plus className="h-3.5 w-3.5" /> Create a workspace
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSeparator />
            <DropdownMenuItem className="p-2 font-medium text-muted-foreground" onClick={() => signOut(() => router.push("/"))}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button size="icon-sm" variant="ghost"><Search /></Button>
        <Button size="icon-sm" variant="outline" className="rounded-full bg-background text-accent-foreground">
          <ClipboardPen />
        </Button>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}