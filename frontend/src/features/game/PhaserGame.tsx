import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { BootScene } from '@/features/game/scenes/BootScene'
import { World1Scene } from '@/features/game/scenes/World1Scene'

interface PhaserGameProps {
  levelId: number
}

/**
 * Mount once per levelId - the parent should key this component by
 * levelId so switching levels does a clean remount instead of trying
 * to reconfigure a live Phaser.Game instance.
 */
export function PhaserGame({ levelId }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 768,
      height: 432,
      parent: containerRef.current,
      backgroundColor: '#fdf6e3',
      physics: { default: 'arcade', arcade: { debug: false } },
      scene: [BootScene, World1Scene],
    })

    game.scene.start('BootScene', { levelId })
    gameRef.current = game

    return () => {
      game.destroy(true)
      gameRef.current = null
    }
    // Intentionally empty: this effect runs once per mount. The parent
    // remounts this component (via `key`) when levelId changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} className="w-full overflow-hidden rounded-3xl [&>canvas]:mx-auto [&>canvas]:block" />
}
