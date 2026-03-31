'use client'

import { useCallback, useEffect, useState } from 'react'
import { PulseOrb } from './pulse-orb'
import { CommandBar } from './command-bar'
import { BriefingPanel } from './briefing-panel'

export type PedrinhoMode = 'orb' | 'command' | 'briefing'

interface PedrinhoAgentProps {
  userId: string
}

export function PedrinhoAgent({ userId }: PedrinhoAgentProps) {
  const [mode, setMode] = useState<PedrinhoMode>('orb')

  // Keyboard shortcut: Cmd+J to toggle command bar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        setMode((prev) => (prev === 'command' ? 'orb' : 'command'))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleCloseToOrb = useCallback(() => setMode('orb'), [])
  const handleOpenCommand = useCallback(() => setMode('command'), [])
  const handleOpenBriefing = useCallback(() => setMode('briefing'), [])

  return (
    <>
      {/* Orb — always rendered, hidden when other modes are active */}
      {mode === 'orb' && (
        <PulseOrb
          onOpenCommandBar={handleOpenCommand}
          onOpenBriefing={handleOpenBriefing}
          hasProactiveNudge={false}
          nudgeMessage={undefined}
        />
      )}

      {/* Command Bar */}
      {mode === 'command' && (
        <CommandBar
          onClose={handleCloseToOrb}
          onExpandToBriefing={handleOpenBriefing}
        />
      )}

      {/* Briefing Panel */}
      {mode === 'briefing' && (
        <BriefingPanel
          onClose={handleCloseToOrb}
          onMinimize={handleCloseToOrb}
          threadId={`user-${userId}`}
        />
      )}
    </>
  )
}
