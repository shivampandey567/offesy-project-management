import { cn } from "@/lib/utils"

type Variant = 'default' | 'ghost' | 'blue' | 'purple' | 'teal' | 'coral' | 'amber' | 'green' | 'red' | 'pink' | 'indigo' | 'sky' | 'orange' | 'lime' | 'cyan' | 'rose' | 'violet' | 'slate' | 'yellow' | 'gray'
type Size = "sm" | "md" | "lg"

interface TextBgProps {
  children: React.ReactNode
  variant?: string
  size?: Size
  className?: string
}

const variants: Record<Variant, string> = {
  default: "bg-secondary text-secondary-foreground border border-border",
  ghost: "border border-border text-foreground",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  purple: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  teal: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  coral: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  green: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  red: "bg-red-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  pink: "bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
  indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  sky: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  orange: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  lime: "bg-lime-50 text-lime-700 dark:bg-lime-950 dark:text-lime-300",
  cyan: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  violet: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  slate: "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  yellow: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  gray: "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
}

const sizes: Record<Size, string> = {
  sm: "px-2 py-0.5 text-[11px] rounded-md",
  md: "px-2.5 py-0.5 text-xs rounded-lg",
  lg: "px-3 py-1 text-sm rounded-lg",
}

const TextBg = ({ children, variant = "default", size = "md", className }: TextBgProps) => (
  <span className={cn(
    "inline-flex items-center font-medium shrink-0",
    variants[variant as Variant] ?? variants.default,
    sizes[size],
    className
  )}>
    {children}
  </span>
)

export default TextBg