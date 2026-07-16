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
const BASE_ASPECT = BASE_WIDTH / BASE_HEIGHT
/** How much wider than 16:9 the viewport is allowed to grow on ultra-wide screens before we cap it and let FIT letterbox the rest, so wide monitors don't trivialize jumps/hazards by revealing far more of the level than the levels were designed around. */
const MAX_ASPECT = 2.2

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

    const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect()
    const containerAspect = containerHeight > 0 ? containerWidth / containerHeight : BASE_ASPECT
    const gameWidth = Math.round(BASE_HEIGHT * Math.min(Math.max(containerAspect, BASE_ASPECT), MAX_ASPECT))

    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      parent: containerRef.current,
      backgroundColor: '#16302a',
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: gameWidth,
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
