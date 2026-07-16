"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid w-full gap-2", className)}
      {...props}
    />
  )
}

const radioVariants = cva(
  "group/radio-group-item peer relative flex aspect-square size-4 shrink-0 rounded-full border border-input outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 data-checked:text-primary-foreground",
  {
    variants: {
      variant: {
        default: "data-checked:border-primary data-checked:bg-primary dark:data-checked:bg-primary",
        blue:    "data-checked:border-blue-500 data-checked:bg-blue-500 dark:data-checked:bg-blue-500",
        amber:   "data-checked:border-amber-500 data-checked:bg-amber-500 dark:data-checked:bg-amber-500",
        yellow:  "data-checked:border-yellow-500 data-checked:bg-yellow-500 dark:data-checked:bg-yellow-500",
        orange:  "data-checked:border-orange-500 data-checked:bg-orange-500 dark:data-checked:bg-orange-500",
        red:     "data-checked:border-red-500 data-checked:bg-red-500 dark:data-checked:bg-red-500",
        green:   "data-checked:border-green-500 data-checked:bg-green-500 dark:data-checked:bg-green-500",
        violet:  "data-checked:border-violet-500 data-checked:bg-violet-500 dark:data-checked:bg-violet-500",
        rose:    "data-checked:border-rose-500 data-checked:bg-rose-500 dark:data-checked:bg-rose-500",
        cyan:    "data-checked:border-cyan-500 data-checked:bg-cyan-500 dark:data-checked:bg-cyan-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function RadioGroupItem({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> &
  VariantProps<typeof radioVariants>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(radioVariants({ variant }), className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-4 items-center justify-center"
      >
        <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }