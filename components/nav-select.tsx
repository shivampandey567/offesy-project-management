"use client"

import { usePathname } from "next/navigation"

import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

export function NavSelect({
    selects,
}: {
    selects: {
        name: string
        url: string
        icon: React.ReactNode
    }[]
}) {
    const pathname = usePathname()
    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarMenu>
                {selects.map((item) => {
                    const isActive = pathname === item.url
                    return (
                        <SidebarMenuItem key={item.name}>
                            <SidebarMenuButton
                                asChild
                                tooltip={item.name}
                                className={isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}
                            >
                                <Link href={item.url}>
                                    {item.icon}
                                    <span>{item.name}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )
                })}
            </SidebarMenu>
        </SidebarGroup>
    )
}