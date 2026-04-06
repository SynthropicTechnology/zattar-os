"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Avatar sizes from the design system (AVATAR_SIZES in tokens.ts).
 * Use the `size` prop instead of className overrides.
 */
const AVATAR_SIZES = {
  xs: 'size-5',    // 20px — inline em texto
  sm: 'size-6',    // 24px — listas compactas
  md: 'size-8',    // 32px — listas normais (default)
  lg: 'size-10',   // 40px — cards, headers
  xl: 'size-12',   // 48px — detail panels
  '2xl': 'size-16', // 64px — perfil, hero
  '3xl': 'size-24', // 96px — perfil grande
} as const;

type AvatarSize = keyof typeof AVATAR_SIZES;

function Avatar({
  className,
  size = 'md',
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & { size?: AvatarSize }) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        AVATAR_SIZES[size],
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

const avatarIndicatorVariants = cva(
  "absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-background",
  {
    variants: {
      variant: {
        online: "bg-success",
        away: "bg-warning",
        offline: "bg-muted-foreground",
        success: "bg-success",
      },
    },
    defaultVariants: {
      variant: "offline",
    },
  }
)

interface AvatarIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarIndicatorVariants> {}

function AvatarIndicator({ className, variant, ...props }: AvatarIndicatorProps) {
  return (
    <div
      className={cn(avatarIndicatorVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback, AvatarIndicator, AVATAR_SIZES }
export type { AvatarSize }