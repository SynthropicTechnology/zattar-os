import * as React from "react"

import { cn } from "@/lib/utils"

type TextareaVariant = "default" | "glass"

interface TextareaProps extends React.ComponentProps<"textarea"> {
  variant?: TextareaVariant
}

const VARIANT_CLASSES: Record<TextareaVariant, string> = {
  default:
    "border-input bg-transparent px-3 py-2 shadow-xs dark:bg-input/30 rounded-md",
  glass:
    "border-outline-variant/60 bg-surface-container-lowest/70 px-4 py-3 shadow-sm rounded-xl backdrop-blur-sm hover:border-outline-variant hover:bg-surface-container-lowest focus-visible:border-primary/40 focus-visible:bg-surface-container-lowest focus-visible:ring-2 focus-visible:ring-primary/20 dark:bg-surface-container-low/40 dark:hover:bg-surface-container-low/60 dark:focus-visible:bg-surface-container-low/70",
}

function Textarea({ className, variant = "default", ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      data-variant={variant}
      className={cn(
        "flex field-sizing-content min-h-16 w-full border text-base transition-[color,background-color,border-color,box-shadow] outline-none md:text-sm",
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
