import Phaser from 'phaser'

interface BootSceneData {
  levelId: number
}

/**
 * Generates every texture the platformer needs from vector shapes
 * (Graphics -> generateTexture) instead of loading image files, so the
 * game has no binary asset dependency yet. Swap in real spritesheets
 * later by loading them here under the same texture keys.
 */
export class BootScene extends Phaser.Scene {
  private sceneData!: BootSceneData

  constructor() {
    super('BootScene')
  }

  init(data: BootSceneData) {
    this.sceneData = data
  }

  create() {
    this.generateTextures()
    this.scene.start('World1Scene', this.sceneData)
  }

  private generateTextures() {
    const g = this.make.graphics({ x: 0, y: 0 }, false)

    // Player - stubby forest critter, ~32x40
    g.clear()
    g.fillStyle(0xe0823c, 1)
    g.fillRoundedRect(4, 8, 24, 28, 8)
    g.fillTriangle(4, 10, 10, 10, 6, 0)
    g.fillTriangle(22, 10, 28, 10, 26, 0)
    g.fillStyle(0xfff3e0, 1)
    g.fillEllipse(16, 27, 13, 12)
    g.fillStyle(0x2a1a0f, 1)
    g.fillCircle(12, 15, 2)
    g.fillCircle(20, 15, 2)
    g.fillStyle(0x1a1008, 1)
    g.fillCircle(16, 20, 1.5)
    g.generateTexture('player', 32, 40)

    // Ground tile (grass top over dirt), 32x32 - used as a repeating tileSprite
    g.clear()
    g.fillStyle(0x5a3a22, 1)
    g.fillRect(0, 0, 32, 32)
    g.fillStyle(0x3f2717, 1)
    g.fillRect(0, 22, 32, 10)
    g.fillStyle(0x4f9f3a, 1)
    g.fillRect(0, 0, 32, 9)
    g.fillStyle(0x74bd5a, 1)
    g.fillRect(0, 0, 32, 3)
    g.generateTexture('ground', 32, 32)

    // Floating platform, 96x20
    g.clear()
    g.fillStyle(0x8b5a2b, 1)
    g.fillRoundedRect(0, 4, 96, 16, 6)
    g.fillStyle(0x74bd5a, 1)
    g.fillRoundedRect(0, 0, 96, 8, 4)
    g.generateTexture('platform', 96, 20)

    // Key pickup, 20x14
    g.clear()
    g.fillStyle(0xf5c518, 1)
    g.fillCircle(6, 7, 6)
    g.fillStyle(0x8b5a00, 1)
    g.fillCircle(6, 7, 2.5)
    g.fillStyle(0xf5c518, 1)
    g.fillRect(11, 5, 8, 3)
    g.fillRect(15, 8, 2, 4)
    g.fillRect(18, 8, 2, 3)
    g.generateTexture('key', 20, 14)

    // Chest, closed, 28x24
    g.clear()
    g.fillStyle(0x6b4423, 1)
    g.fillRoundedRect(0, 0, 28, 11, { tl: 6, tr: 6, bl: 0, br: 0 })
    g.fillStyle(0x8b5a2b, 1)
    g.fillRoundedRect(0, 9, 28, 15, 4)
    g.fillStyle(0xf5c518, 1)
    g.fillRect(12, 8, 4, 8)
    g.generateTexture('chest', 28, 24)

    // Spike hazard, 24x18
    g.clear()
    g.fillStyle(0x9ca3af, 1)
    g.fillTriangle(0, 18, 8, 0, 16, 18)
    g.fillTriangle(8, 18, 16, 0, 24, 18)
    g.generateTexture('spike', 24, 18)

    // Heart, filled (full life) and dark (lost life), 20x18
    const drawHeart = (color: number) => {
      g.clear()
      g.fillStyle(color, 1)
      g.fillCircle(6, 6, 6)
      g.fillCircle(14, 6, 6)
      g.fillTriangle(0, 8, 20, 8, 10, 20)
    }
    drawHeart(0xdc2626)
    g.generateTexture('heart_full', 20, 20)
    drawHeart(0x2a2a2a)
    g.generateTexture('heart_empty', 20, 20)

    // Tree silhouette for parallax background, 96x220
    g.clear()
    g.fillStyle(0x1f3a24, 1)
    g.fillRect(40, 120, 16, 100)
    g.fillCircle(48, 100, 46)
    g.fillCircle(20, 130, 34)
    g.fillCircle(76, 130, 34)
    g.generateTexture('tree', 96, 220)

    g.destroy()
  }
}
