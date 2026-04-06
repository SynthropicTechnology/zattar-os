"use client"

/**
 * ResponsiveDialog - Wrapper que usa Dialog em desktop e Sheet em mobile
 * 
 * Automaticamente detecta o viewport e renderiza:
 * - Dialog (modal centralizado) em desktop (≥640px)
 * - Sheet (bottom sheet/full-screen) em mobile (<640px)
 * 
 * Garante que:
 * - Formulários sejam responsivos sem scroll horizontal
 * - Botões fiquem posicionados adequadamente (bottom sticky em mobile)
 * - Scroll vertical funcione quando conteúdo excede viewport
 * - Background scroll seja prevenido quando aberto
 */

import * as React from "react"
import { useBreakpointBelow } from "@/hooks/use-breakpoint"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
    SheetFooter,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface ResponsiveDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children: React.ReactNode
    mobileVariant?: "fullscreen" | "bottom-sheet"
}

function ResponsiveDialog({
    open,
    onOpenChange,
    children,
}: ResponsiveDialogProps) {
    const isMobile = useBreakpointBelow("sm") // <640px

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                {children}
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {children}
        </Dialog>
    )
}

interface ResponsiveDialogTriggerProps {
    children: React.ReactNode
    asChild?: boolean
}

function ResponsiveDialogTrigger({
    children,
    asChild,
}: ResponsiveDialogTriggerProps) {
    const isMobile = useBreakpointBelow("sm")

    if (isMobile) {
        return <SheetTrigger asChild={asChild}>{children}</SheetTrigger>
    }

    return <DialogTrigger asChild={asChild}>{children}</DialogTrigger>
}

interface ResponsiveDialogContentProps {
    children: React.ReactNode
    className?: string
    showCloseButton?: boolean
}

function ResponsiveDialogContent({
    children,
    className,
    showCloseButton = true,
}: ResponsiveDialogContentProps) {
    const isMobile = useBreakpointBelow("sm")

    if (isMobile) {
        return (
            <SheetContent
                side="bottom"
                showCloseButton={showCloseButton}
                className={cn(
                    // Full-screen em mobile
                    "h-[95vh] flex flex-col",
                    // Garantir que não tenha scroll horizontal
                    "overflow-x-hidden",
                    // Scroll vertical quando necessário
                    "overflow-y-auto",
                    className
                )}
            >
                {children}
            </SheetContent>
        )
    }

    return (
        <DialogContent
            showCloseButton={showCloseButton}
            className={cn(
                // Garantir responsividade em desktop
                "max-h-[90vh] flex flex-col",
                // Prevenir scroll horizontal
                "overflow-x-hidden",
                className
            )}
        >
            {children}
        </DialogContent>
    )
}

interface ResponsiveDialogHeaderProps {
    children: React.ReactNode
    className?: string
}

function ResponsiveDialogHeader({
    children,
    className,
}: ResponsiveDialogHeaderProps) {
    const isMobile = useBreakpointBelow("sm")

    if (isMobile) {
        return <SheetHeader className={className}>{children}</SheetHeader>
    }

    return <DialogHeader className={className}>{children}</DialogHeader>
}

interface ResponsiveDialogTitleProps {
    children: React.ReactNode
    className?: string
}

function ResponsiveDialogTitle({
    children,
    className,
}: ResponsiveDialogTitleProps) {
    const isMobile = useBreakpointBelow("sm")

    if (isMobile) {
        return <SheetTitle className={className}>{children}</SheetTitle>
    }

    return <DialogTitle className={className}>{children}</DialogTitle>
}

interface ResponsiveDialogDescriptionProps {
    children: React.ReactNode
    className?: string
}

function ResponsiveDialogDescription({
    children,
    className,
}: ResponsiveDialogDescriptionProps) {
    const isMobile = useBreakpointBelow("sm")

    if (isMobile) {
        return <SheetDescription className={className}>{children}</SheetDescription>
    }

    return <DialogDescription className={className}>{children}</DialogDescription>
}

interface ResponsiveDialogFooterProps {
    children: React.ReactNode
    className?: string
}

function ResponsiveDialogFooter({
    children,
    className,
}: ResponsiveDialogFooterProps) {
    const isMobile = useBreakpointBelow("sm")

    if (isMobile) {
        return (
            <SheetFooter
                className={cn(
                    // Sticky no bottom em mobile
                    "sticky bottom-0 bg-background border-t pt-4 mt-auto",
                    // Garantir espaçamento adequado
                    "pb-safe",
                    className
                )}
            >
                {children}
            </SheetFooter>
        )
    }

    return <DialogFooter className={className}>{children}</DialogFooter>
}

interface ResponsiveDialogCloseProps {
    children: React.ReactNode
    asChild?: boolean
}

function ResponsiveDialogClose({
    children,
    asChild,
}: ResponsiveDialogCloseProps) {
    const isMobile = useBreakpointBelow("sm")

    if (isMobile) {
        return <SheetClose asChild={asChild}>{children}</SheetClose>
    }

    return <DialogClose asChild={asChild}>{children}</DialogClose>
}

interface ResponsiveDialogBodyProps {
    children: React.ReactNode
    className?: string
}

/**
 * Body component para conteúdo scrollável
 * Garante que o conteúdo possa fazer scroll vertical sem afetar header/footer
 */
function ResponsiveDialogBody({
    children,
    className,
}: ResponsiveDialogBodyProps) {
    return (
        <div
            className={cn(
                // Permitir scroll vertical
                "flex-1 overflow-y-auto overflow-x-hidden",
                // Espaçamento adequado
                "px-4 py-4 sm:px-6",
                className
            )}
        >
            {children}
        </div>
    )
}

export {
    ResponsiveDialog,
    ResponsiveDialogTrigger,
    ResponsiveDialogContent,
    ResponsiveDialogHeader,
    ResponsiveDialogTitle,
    ResponsiveDialogDescription,
    ResponsiveDialogFooter,
    ResponsiveDialogClose,
    ResponsiveDialogBody,
}
