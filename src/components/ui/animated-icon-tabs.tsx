"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { ClientOnlyTabs } from "@/components/ui/client-only-tabs"
import { cn } from "@/lib/utils"

export type AnimatedIconTabItem = {
  value: string
  label: string
  icon: React.ReactNode
  content?: React.ReactNode
  disabled?: boolean
}

export type AnimatedIconTabsProps = Omit<
  React.ComponentProps<typeof ClientOnlyTabs>,
  "children" | "defaultValue" | "value" | "onValueChange"
> & {
  tabs: AnimatedIconTabItem[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  activeColorClassName?: string
  pillLayoutId?: string
  listClassName?: string
  triggerClassName?: string
  activeTriggerClassName?: string
  inactiveTriggerClassName?: string
  contentClassName?: string
}

export function AnimatedIconTabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  className,
  activeColorClassName = "text-white",
  pillLayoutId: pillLayoutIdProp,
  listClassName,
  triggerClassName,
  activeTriggerClassName,
  inactiveTriggerClassName,
  contentClassName,
  ...props
}: AnimatedIconTabsProps) {
  const firstTab = tabs[0]?.value
  const initialValue = defaultValue ?? firstTab

  const reactId = React.useId()
  const pillLayoutId = pillLayoutIdProp ?? `animated-icon-tabs__pill-${reactId}`

  const [internalValue, setInternalValue] = React.useState<string | undefined>(initialValue)
  const currentValue = value ?? internalValue

  React.useEffect(() => {
    if (value !== undefined) return

    const nextInitial = defaultValue ?? tabs[0]?.value
    if (!nextInitial) return

    const hasCurrent = currentValue && tabs.some((t) => t.value === currentValue)
    if (!hasCurrent) setInternalValue(nextInitial)
  }, [value, defaultValue, tabs, currentValue])

  const handleValueChange = React.useCallback(
    (nextValue: string) => {
      if (value === undefined) setInternalValue(nextValue)
      onValueChange?.(nextValue)
    },
    [value, onValueChange]
  )

  return (
    <ClientOnlyTabs
      {...(value !== undefined ? { value } : {})}
      {...(value === undefined ? { defaultValue: initialValue } : {})}
      onValueChange={handleValueChange}
      className={cn("w-fit self-start", className)}
      {...props}
    >
      <TabsPrimitive.List
        className={cn(
          "inline-flex h-auto w-fit items-center justify-start gap-2 rounded-xl border border-border bg-background p-1 shadow-sm",
          listClassName
        )}
      >
        {tabs.map((tab) => {
          const isActive = currentValue === tab.value

          return (
            <TabsPrimitive.Trigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
              asChild
            >
              <motion.button
                type="button"
                layout
                className={cn(
                  "relative inline-flex flex-none items-center justify-start overflow-hidden rounded-lg py-2 text-sm font-medium",
                  "transition-colors duration-300",
                  "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                  "disabled:pointer-events-none disabled:opacity-50",
                  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
                  isActive ? "gap-2 px-4" : "gap-0 px-2",
                  isActive ? activeColorClassName : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  triggerClassName,
                  isActive ? activeTriggerClassName : inactiveTriggerClassName
                )}
              >
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.span
                      aria-hidden
                      layoutId={pillLayoutId}
                      className="absolute inset-0 rounded-lg bg-primary"
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    />
                  )}
                </AnimatePresence>

                <span className="relative z-10 inline-flex items-center">{tab.icon}</span>

                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.span
                      className="relative z-10 inline-block overflow-hidden whitespace-nowrap"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      {tab.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </TabsPrimitive.Trigger>
          )
        })}
      </TabsPrimitive.List>

      {tabs.some((t) => t.content != null) &&
        tabs.map((tab) => (
          <TabsPrimitive.Content
            key={tab.value}
            value={tab.value}
            className={cn("mt-2 outline-none", contentClassName)}
          >
            {tab.content}
          </TabsPrimitive.Content>
        ))}
    </ClientOnlyTabs>
  )
}
