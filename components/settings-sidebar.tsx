'use client'
import * as React from "react"

import { SearchForm } from "./search-form"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "./ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// This is sample data.
const data = {
  navMain: [
    {
      title: "Personal",
      url: "#",
      items: [
        {
          title: "Preferences",
          url: "#",
        },
        {
          title: "Profile",
          url: "#",
          isActive: true,
        },
        {
          title: "Notifications",
          url: "#",
        },
        {
          title: "Code & reviews",
          url: "#",
        },
        {
          title: "Security & access",
          url: "#",
        },
        {
          title: "Connected accounts",
          url: "#",
        },
        {
          title: "Agent personalization",
          url: "#",
        },
      ],
    },
    {
      title: "Issues",
      url: "#",
      items: [
        {
          title: "Labels",
          url: "#",
        },
        {
          title: "Templates",
          url: "#",
        },
        {
          title: "SLAs",
          url: "#",
        },
      ],
    },
    {
      title: "Projects",
      url: "#",
      items: [
        {
          title: "Labels",
          url: "#",
        },
        {
          title: "Templates",
          url: "#",
        },
        {
          title: "Statuses",
          url: "#",
        },
        {
          title: "Updates",
          url: "#",
        },
      ],
    },
  ],
}

export function SettingsSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <Button variant='ghost' onClick={()=>router.back()} className='rounded-full w-fit hover:bg-black/10'><ChevronLeft />Back to app</Button>
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className="text-sm">{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <a href={item.url}>{item.title}</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
