import * as React from "react"

import { cn } from "@/lib/utils"

type InputVariant = "default" | "glass"

interface InputProps extends React.ComponentProps<"input"> {
  variant?: InputVariant
}

const VARIANT_CLASSES: Record<InputVariant, string> = {
  default:
    "h-9 rounded-md border-input bg-transparent px-3 py-1 text-base shadow-xs md:text-sm dark:bg-input/30",
  glass:
    "h-11 rounded-xl border-outline-variant/60 bg-surface-container-lowest/70 px-4 text-base shadow-sm backdrop-blur-sm hover:border-outline-variant hover:bg-surface-container-lowest focus-visible:border-primary/40 focus-visible:bg-surface-container-lowest focus-visible:ring-2 focus-visible:ring-primary/20 md:text-sm dark:bg-surface-container-low/40 dark:hover:bg-surface-container-low/60 dark:focus-visible:bg-surface-container-low/70",
}

function Input({ className, type, variant = "default", ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      data-variant={variant}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border w-full min-w-0 transition-[color,background-color,border-color,box-shadow] outline-none ring-0 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  )
}

export { Input }
