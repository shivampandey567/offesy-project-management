// components/ui/plain-card.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

function PlainCard({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2", className)} {...props} />
}

function PlainCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-start justify-between gap-1", className)} {...props} />
}

function PlainCardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("font-medium text-base leading-snug", className)} {...props} />
}

function PlainCardAction({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("self-start shrink-0", className)} {...props} />
}

function PlainCardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export { PlainCard, PlainCardHeader, PlainCardTitle, PlainCardAction, PlainCardContent }