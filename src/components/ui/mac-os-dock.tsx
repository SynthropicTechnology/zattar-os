'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface DockItem {
  id: string
  name: string
  icon: React.ReactNode
}

export interface MacOSDockProps {
  items: DockItem[]
  onItemClick: (itemId: string) => void
  activeItems?: string[]
  className?: string
}

function MacOSDock({
  items,
  onItemClick,
  activeItems = [],
  className,
}: MacOSDockProps) {
  const [mouseX, setMouseX] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [currentScales, setCurrentScales] = useState<number[]>(items.map(() => 1))
  const [currentPositions, setCurrentPositions] = useState<number[]>([])
  const dockRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const lastMouseMoveTime = useRef<number>(0)

  // Responsive config based on viewport width
  const getResponsiveConfig = useCallback(() => {
    if (typeof window === 'undefined') {
      return { baseIconSize: 48, maxScale: 1.5, effectWidth: 240 }
    }

    const vw = window.innerWidth

    if (vw < 640) {
      return { baseIconSize: 36, maxScale: 1.3, effectWidth: 150 }
    } else if (vw < 1024) {
      return { baseIconSize: 42, maxScale: 1.4, effectWidth: 190 }
    } else if (vw < 1440) {
      return { baseIconSize: 48, maxScale: 1.5, effectWidth: 240 }
    } else {
      return { baseIconSize: 52, maxScale: 1.6, effectWidth: 280 }
    }
  }, [])

  const [config, setConfig] = useState(getResponsiveConfig)
  const { baseIconSize, maxScale, effectWidth } = config
  const minScale = 1.0
  const baseSpacing = Math.max(3, baseIconSize * 0.07)

  useEffect(() => {
    const handleResize = () => setConfig(getResponsiveConfig())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [getResponsiveConfig])

  // Authentic macOS cosine-based magnification algorithm
  const calculateTargetMagnification = useCallback(
    (mousePosition: number | null) => {
      if (mousePosition === null) return items.map(() => minScale)

      return items.map((_, index) => {
        const normalIconCenter =
          index * (baseIconSize + baseSpacing) + baseIconSize / 2
        const minX = mousePosition - effectWidth / 2
        const maxX = mousePosition + effectWidth / 2

        if (normalIconCenter < minX || normalIconCenter > maxX) return minScale

        const theta =
          ((normalIconCenter - minX) / effectWidth) * 2 * Math.PI
        const cappedTheta = Math.min(Math.max(theta, 0), 2 * Math.PI)
        const scaleFactor = (1 - Math.cos(cappedTheta)) / 2

        return minScale + scaleFactor * (maxScale - minScale)
      })
    },
    [items, baseIconSize, baseSpacing, effectWidth, maxScale, minScale]
  )

  // Calculate positions based on current scales
  const calculatePositions = useCallback(
    (scales: number[]) => {
      let currentX = 0
      return scales.map((scale) => {
        const scaledWidth = baseIconSize * scale
        const centerX = currentX + scaledWidth / 2
        currentX += scaledWidth + baseSpacing
        return centerX
      })
    },
    [baseIconSize, baseSpacing]
  )

  // Initialize positions
  useEffect(() => {
    const initialScales = items.map(() => minScale)
    setCurrentScales(initialScales)
    setCurrentPositions(calculatePositions(initialScales))
  }, [items, calculatePositions, minScale, config])

  // Animation loop with lerp for smooth transitions
  const animateToTarget = useCallback(() => {
    const targetScales = calculateTargetMagnification(mouseX)
    const targetPositions = calculatePositions(targetScales)
    const lerpFactor = mouseX !== null ? 0.2 : 0.12

    setCurrentScales((prev) =>
      prev.map((s, i) => s + (targetScales[i] - s) * lerpFactor)
    )
    setCurrentPositions((prev) =>
      prev.map((p, i) => p + (targetPositions[i] - p) * lerpFactor)
    )

    const needsUpdate =
      currentScales.some(
        (s, i) => Math.abs(s - targetScales[i]) > 0.002
      ) ||
      currentPositions.some(
        (p, i) => Math.abs(p - targetPositions[i]) > 0.1
      )

    if (needsUpdate || mouseX !== null) {
      animationFrameRef.current = requestAnimationFrame(animateToTarget)
    }
  }, [
    mouseX,
    calculateTargetMagnification,
    calculatePositions,
    currentScales,
    currentPositions,
  ])

  useEffect(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    animationFrameRef.current = requestAnimationFrame(animateToTarget)
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [animateToTarget])

  // Throttled mouse movement handler (~60fps)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const now = performance.now()
      if (now - lastMouseMoveTime.current < 16) return
      lastMouseMoveTime.current = now

      if (dockRef.current) {
        const rect = dockRef.current.getBoundingClientRect()
        const padding = Math.max(8, baseIconSize * 0.12)
        setMouseX(e.clientX - rect.left - padding)
      }
    },
    [baseIconSize]
  )

  const handleMouseLeave = useCallback(() => {
    setMouseX(null)
    setHoveredIndex(null)
  }, [])

  const handleItemClick = (
    itemId: string,
    _index: number,
    e: React.MouseEvent
  ) => {
    // macOS-style bounce animation via Web Animations API
    const target = e.currentTarget as HTMLElement
    target.animate(
      [
        { transform: 'translateY(0)' },
        { transform: `translateY(-${baseIconSize * 0.15}px)` },
        { transform: 'translateY(0)' },
      ],
      { duration: 400, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
    )
    onItemClick(itemId)
  }

  // Calculate total content width for dock sizing
  const contentWidth =
    currentPositions.length > 0
      ? Math.max(
          ...currentPositions.map(
            (pos, i) => pos + (baseIconSize * currentScales[i]) / 2
          )
        )
      : items.length * (baseIconSize + baseSpacing) - baseSpacing

  const padding = Math.max(8, baseIconSize * 0.12)

  return (
    <div
      ref={dockRef}
      className={cn('backdrop-blur-2xl', className)}
      style={{
        width: `${contentWidth + padding * 2}px`,
        background: 'rgba(30, 30, 30, 0.78)',
        borderRadius: `${Math.max(16, baseIconSize * 0.35)}px`,
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: [
          '0 8px 32px rgba(0, 0, 0, 0.5)',
          '0 2px 8px rgba(0, 0, 0, 0.3)',
          'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          'inset 0 -1px 0 rgba(0, 0, 0, 0.15)',
        ].join(', '),
        padding: `${padding}px`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative"
        style={{ height: `${baseIconSize}px`, width: '100%' }}
      >
        {/* Tooltip — fixed above max magnification height */}
        {hoveredIndex !== null &&
          currentPositions[hoveredIndex] !== undefined && (
            <div
              className="absolute pointer-events-none whitespace-nowrap z-50
                         px-3 py-1.5 rounded-lg text-xs font-medium text-white
                         bg-[rgba(20,20,20,0.92)] backdrop-blur-sm
                         border border-white/10 shadow-lg
                         transition-[left,opacity] duration-100 ease-out"
              style={{
                left: `${currentPositions[hoveredIndex]}px`,
                transform: 'translateX(-50%)',
                bottom: `${baseIconSize * maxScale + 10}px`,
              }}
            >
              {items[hoveredIndex].name}
            </div>
          )}

        {items.map((item, index) => {
          const scale = currentScales[index]
          const position = currentPositions[index] || 0
          const scaledSize = baseIconSize * scale

          return (
            <div
              key={item.id}
              className="absolute cursor-pointer flex flex-col items-center justify-end"
              style={{
                left: `${position - scaledSize / 2}px`,
                bottom: '0px',
                width: `${scaledSize}px`,
                height: `${scaledSize}px`,
                transformOrigin: 'bottom center',
                zIndex: Math.round(scale * 10),
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onClick={(e) => handleItemClick(item.id, index, e)}
            >
              {/* Icon — Liquid Glass container */}
              <div
                className="w-full h-full rounded-[22%] overflow-hidden relative"
                style={{
                  background: `linear-gradient(
                    135deg,
                    rgba(255, 255, 255, 0.14) 0%,
                    rgba(255, 255, 255, 0.05) 40%,
                    rgba(255, 255, 255, 0.10) 100%
                  )`,
                  backdropFilter: 'blur(24px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                  border: '0.5px solid rgba(255, 255, 255, 0.20)',
                  boxShadow: [
                    'inset 0 1px 1px rgba(255, 255, 255, 0.18)',
                    'inset 0 -1px 1px rgba(0, 0, 0, 0.06)',
                    `0 ${scale > 1.2 ? 6 : 3}px ${scale > 1.2 ? 16 : 8}px rgba(0, 0, 0, ${0.18 + (scale - 1) * 0.15})`,
                  ].join(', '),
                }}
              >
                {/* Specular highlight — top light refraction */}
                <div
                  className="absolute inset-0 pointer-events-none rounded-[22%]"
                  style={{
                    background: `linear-gradient(
                      170deg,
                      rgba(255, 255, 255, 0.22) 0%,
                      rgba(255, 255, 255, 0.06) 35%,
                      transparent 55%
                    )`,
                  }}
                />
                {/* Icon content */}
                <div className="relative w-full h-full">
                  {item.icon}
                </div>
              </div>

              {/* Active route indicator dot */}
              {activeItems.includes(item.id) && (
                <div
                  className="absolute rounded-full bg-white/80"
                  style={{
                    bottom: `${Math.max(-4, -baseIconSize * 0.07)}px`,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: `${Math.max(4, baseIconSize * 0.07)}px`,
                    height: `${Math.max(4, baseIconSize * 0.07)}px`,
                    boxShadow: '0 0 6px rgba(255, 255, 255, 0.4)',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { MacOSDock }
