import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { BootScene } from '@/features/game/scenes/BootScene'
import { ControlsScene } from '@/features/game/scenes/ControlsScene'
import { GameOverScene } from '@/features/game/scenes/GameOverScene'
import { PauseScene } from '@/features/game/scenes/PauseScene'
import { World1Scene } from '@/features/game/scenes/World1Scene'

interface PhaserGameProps {
  levelId: number
}

/** Internal render resolution the scenes are authored against; the ScaleManager fits this to whatever size the player's screen/container gives it. */
const BASE_WIDTH = 768
const BASE_HEIGHT = 432

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
      type: Phaser.CANVAS,
      parent: containerRef.current,
      backgroundColor: '#16302a',
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: BASE_WIDTH,
        height: BASE_HEIGHT,
      },
      // Allow multiple simultaneous touches so mobile players can hold a
      // direction button and tap jump at the same time.
      input: { activePointers: 3 },
      physics: { default: 'arcade', arcade: { debug: false, gravity: { x: 0, y: 900 } } },
      scene: [BootScene, World1Scene, PauseScene, ControlsScene, GameOverScene],
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

  return <div ref={containerRef} className="h-full w-full overflow-hidden bg-[#16302a] [&>canvas]:mx-auto [&>canvas]:block" />
}
