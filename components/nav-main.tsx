"use client"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function NavMain({
    title,isActive,items
}: {
    title: string
    isActive?: boolean
    items?: {
        icon?: React.ReactNode
        title: string
        url: string
    }[]
}) {
    const pathname = usePathname()
    return (
        <SidebarGroup>
            <SidebarMenu>
                <Collapsible
                    asChild
                    defaultOpen={isActive}
                    className="group/collapsible"
                >
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton>
                                <span className="text-[13px]">{title}</span>
                                <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenu>
                                {items?.map((subItem) => {
                                    const isActive = pathname === subItem.url
                                    return (
                                        <SidebarMenuItem key={subItem.title} className="pl-0.5">
                                            <SidebarMenuButton asChild className={isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}>
                                                <Link href={subItem.url}>
                                                    {subItem.icon}
                                                    <span>{subItem.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            </SidebarMenu>
        </SidebarGroup>
    )
}
