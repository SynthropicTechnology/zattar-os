"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group glass-toaster"
      style={
        {
          // Glass Briefing tokens — backdrop aparece via CSS em globals.css (.glass-toaster)
          "--normal-bg": "color-mix(in oklch, var(--surface-container-lowest) 92%, transparent)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "color-mix(in oklch, var(--outline-variant) 40%, transparent)",
          "--success-bg": "color-mix(in oklch, var(--success) 10%, var(--surface-container-lowest))",
          "--success-text": "var(--success)",
          "--success-border": "color-mix(in oklch, var(--success) 25%, transparent)",
          "--error-bg": "color-mix(in oklch, var(--destructive) 10%, var(--surface-container-lowest))",
          "--error-text": "var(--destructive)",
          "--error-border": "color-mix(in oklch, var(--destructive) 25%, transparent)",
          "--info-bg": "color-mix(in oklch, var(--info) 10%, var(--surface-container-lowest))",
          "--info-text": "var(--info)",
          "--info-border": "color-mix(in oklch, var(--info) 25%, transparent)",
          "--warning-bg": "color-mix(in oklch, var(--warning) 10%, var(--surface-container-lowest))",
          "--warning-text": "var(--warning)",
          "--warning-border": "color-mix(in oklch, var(--warning) 25%, transparent)",
          "--border-radius": "0.75rem",
        } as React.CSSProperties
      }
      toastOptions={{
        className:
          "backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)]",
      }}
      {...props}
    />
  )
}

export { Toaster }
