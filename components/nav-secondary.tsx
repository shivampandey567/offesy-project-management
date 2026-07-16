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
import { ChevronRight, ChevronRightIcon, Plus } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useWorkspace } from "@/lib/workspace-context"

export function NavSecondary({
    title, isActive, items
}: {
    title: string
    isActive?: boolean
    items?: {
        icon?: React.ReactNode
        isActive?: boolean
        title: string
        url: string
        items?: {
            icon?: React.ReactNode
            title: string
            url: string
        }[]
    }[]
}) {
    const pathname = usePathname()
    const ws = useWorkspace()
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
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenu onClick={(e) => e.stopPropagation()}>
                                {items?.map((item) => {
                                    const isActive = pathname === item.url
                                    return (
                                        <Collapsible
                                            asChild
                                            key={item.title}
                                            defaultOpen={item.isActive}
                                            className="group/item"
                                        >
                                            <SidebarMenuItem key={item.title} className="pl-0.5">
                                                <SidebarMenuButton asChild>
                                                    <Link href={item.url}>
                                                        {item.icon}
                                                        <span>{item.title}</span>
                                                        <CollapsibleTrigger asChild>
                                                            <ChevronRight className="hover:bg-black/10 rounded-full transition-transform duration-200 group-data-[state=open]/item:rotate-90" />
                                                        </CollapsibleTrigger>
                                                    </Link>
                                                </SidebarMenuButton>
                                                <CollapsibleContent>
                                                    <SidebarMenu>
                                                        {item.items?.map((subItem) => (
                                                            <SidebarMenuItem key={subItem.title} className="pl-4">
                                                                <SidebarMenuButton asChild >
                                                                    <Link href={subItem.url}>
                                                                        {subItem.icon}
                                                                        <span>{subItem.title}</span>
                                                                    </Link>
                                                                </SidebarMenuButton>
                                                            </SidebarMenuItem>
                                                        ))}
                                                    </SidebarMenu>
                                                </CollapsibleContent>
                                            </SidebarMenuItem>
                                        </Collapsible>
                                    )
                                })}
                                <Link href={`/${ws.url}/new-team`}>
                                    <SidebarMenuItem className="ml-0.5">
                                        <SidebarMenuButton className="gap-2">
                                            <Plus />
                                            <span>Create</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </Link>
                            </SidebarMenu>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            </SidebarMenu>
        </SidebarGroup>
    )
}
