'use client'

import {
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar"
import { ChevronRight, Ellipsis, LinkIcon, Plus, Star } from "lucide-react"
import { Button } from "./ui/button"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu"

const AppHeader = ({
    icon, title, count, secTitle, subTitle, direct,
    onPlusClick, onLinkClick, onStarClick, onMenuClick, menuContent
}: {
    icon?: string, title?: string, count?: number, secTitle?: string, subTitle?: string, direct?: string,
    onPlusClick?: () => void, onLinkClick?: () => void, onStarClick?: () => void,
    onMenuClick?: () => void, menuContent?: React.ReactNode
}) => {

    const { open, isMobile, openMobile } = useSidebar()
    const isOpen = isMobile ? openMobile : open

    return (
        <>
            <header className="absolute w-full bg-background border-b-1 border-sidebar rounded-t-lg flex h-11 shrink-0 items-center z-50">
                <div className="flex items-center justify-between w-full px-2">
                    <div className="flex gap-3">
                        <SidebarTrigger className={`${isOpen ? 'md:hidden' : ''} cursor-e-resize`} />
                        <span className={`font-medium text-accent-foreground/90 flex items-center gap-2 text-sm ${isOpen ? 'md:ml-2' : ''} `}>
                            {icon && <span>{icon}</span>}
                            {title && <span>{title}</span>}
                            {secTitle && subTitle && (
                                <span className="flex items-center gap-1">
                                    <span>
                                        <Link href={direct || '/'}><span className="max-w-20 md:max-w-50 lg:max-w-80 line-clamp-1">{secTitle}</span></Link>
                                    </span>
                                    <ChevronRight size={15}/>
                                    <span className="max-w-30 md:max-w-60 lg:max-w-100 line-clamp-1">{subTitle}</span>
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                {count && <span className="text-muted-foreground">{count}</span>}
                                {onStarClick && <Button size='icon-xs' variant='ghost' className="rounded-full" onClick={onStarClick}><Star /></Button>}
                                {menuContent ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size='icon-sm' variant='ghost' className="rounded-full"><Ellipsis /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            {menuContent}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : onMenuClick ? (
                                    <Button size='icon-sm' variant='ghost' className="rounded-full" onClick={onMenuClick}><Ellipsis /></Button>
                                ) : null}
                            </span>
                        </span>
                    </div>
                    {onPlusClick && (
                        <Button size='icon' variant='ghost' className="rounded-full md:mr-2" onClick={onPlusClick}>
                            <Plus />
                        </Button>
                    )}
                    {onLinkClick && (
                        <Button size='icon-sm' variant='ghost' className="rounded-full md:mr-2" onClick={onLinkClick}>
                            <LinkIcon />
                        </Button>
                    )}
                </div>
            </header>
            <div className="h-11 border-b-1 border-sidebar shrink-0" />
        </>
    )
}

export default AppHeader