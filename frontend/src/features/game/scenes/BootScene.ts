import Phaser from 'phaser'

interface BootSceneData {
  levelId: number
}

/** Size in real pixels of one "art pixel" - the whole point of pixel art. */
const PX = 3

/**
 * Generates every texture the platformer needs from stepped/blocky shapes
 * (Graphics -> generateTexture) instead of loading image files, so the game
 * has no binary asset dependency yet. Everything is snapped to a PX grid and
 * combined with pixelArt rendering (see PhaserGame.tsx) for a retro look.
 * Swap in real spritesheets later by loading them here under the same keys.
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

    this.drawPlayer(g)
    this.drawGroundTile(g)
    this.drawPlatform(g)
    this.drawKey(g)
    this.drawChest(g)
    this.drawSpike(g)
    this.drawHeart(g, 0xdc2626, 'heart_full')
    this.drawHeart(g, 0x33261f, 'heart_empty')
    this.drawTree(g)

    g.destroy()
  }

  /** Stepped ellipse - a circle/oval built from PX-tall rows of varying width, no anti-aliased curve. */
  private blockyEllipse(g: Phaser.GameObjects.Graphics, cx: number, cy: number, rx: number, ry: number, color: number) {
    g.fillStyle(color, 1)
    const gy = Math.max(1, Math.round(ry / PX))
    for (let dy = -gy; dy <= gy; dy += 1) {
      const t = 1 - (dy * dy) / (gy * gy)
      if (t < 0) continue
      const rowHalf = Math.round((rx / PX) * Math.sqrt(t))
      const y = Math.round(cy / PX) * PX + dy * PX
      g.fillRect(Math.round(cx / PX) * PX - rowHalf * PX, y, rowHalf * 2 * PX + PX, PX)
    }
  }

  /** Rect snapped to the PX grid so its edges line up with everything else. */
  private blockyRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number) {
    g.fillStyle(color, 1)
    g.fillRect(Math.round(x / PX) * PX, Math.round(y / PX) * PX, Math.max(PX, Math.round(w / PX) * PX), Math.max(PX, Math.round(h / PX) * PX))
  }

  /** Stepped triangle (apex up) - a staircase of shrinking rows, the classic pixel-art spike/ear shape. */
  private blockyTriangleUp(g: Phaser.GameObjects.Graphics, cx: number, baseY: number, width: number, height: number, color: number) {
    g.fillStyle(color, 1)
    const rows = Math.max(1, Math.round(height / PX))
    for (let i = 0; i < rows; i += 1) {
      const frac = (i + 1) / rows
      const rowWidth = Math.max(PX, Math.round((width * frac) / PX) * PX)
      const y = Math.round((baseY - height) / PX) * PX + i * PX
      g.fillRect(Math.round(cx / PX) * PX - rowWidth / 2, y, rowWidth, PX)
    }
  }

  private drawPlayer(g: Phaser.GameObjects.Graphics) {
    const W = 36
    const H = 42
    const OUTLINE = 0x3d2410
    const BODY = 0xd9822a
    const BELLY = 0xfdf1dd
    const DARK = 0x1a1008

    g.clear()
    this.blockyTriangleUp(g, 10, 16, 10, 12, OUTLINE)
    this.blockyTriangleUp(g, 26, 16, 10, 12, OUTLINE)
    this.blockyEllipse(g, 18, 24, 15, 17, OUTLINE)
    this.blockyEllipse(g, 18, 24, 13, 15, BODY)
    this.blockyEllipse(g, 18, 31, 8, 9, BELLY)
    this.blockyRect(g, 12, 18, 4, 4, DARK)
    this.blockyRect(g, 21, 18, 4, 4, DARK)
    this.blockyRect(g, 16, 24, 4, 3, OUTLINE)
    this.blockyRect(g, 9, 39, 7, 3, OUTLINE)
    this.blockyRect(g, 20, 39, 7, 3, OUTLINE)
    g.generateTexture('player', W, H)
  }

  private drawGroundTile(g: Phaser.GameObjects.Graphics) {
    const SIZE = 33
    g.clear()
    this.blockyRect(g, 0, 0, SIZE, SIZE, 0x5a3a22)
    this.blockyRect(g, 0, 21, SIZE, 12, 0x3f2717)
    this.blockyRect(g, 0, 0, SIZE, 9, 0x4f9f3a)
    for (let x = 0; x < SIZE; x += PX * 2) {
      this.blockyRect(g, x, 0, PX, PX * 2, 0x8fd66a)
    }
    g.generateTexture('ground', SIZE, SIZE)
  }

  private drawPlatform(g: Phaser.GameObjects.Graphics) {
    const W = 96
    const H = 21
    g.clear()
    this.blockyRect(g, 0, PX * 2, W, H - PX * 2, 0x8b5a2b)
    this.blockyRect(g, 0, 0, W, PX * 2, 0x74bd5a)
    for (let x = 0; x < W; x += PX * 2) {
      this.blockyRect(g, x, 0, PX, PX, 0xa9e88a)
    }
    g.generateTexture('platform', W, H)
  }

  private drawKey(g: Phaser.GameObjects.Graphics) {
    const W = 27
    const H = 18
    g.clear()
    this.blockyEllipse(g, 9, 9, 7, 7, 0xb8860b)
    this.blockyEllipse(g, 9, 9, 6, 6, 0xf5c518)
    this.blockyEllipse(g, 9, 9, 3, 3, 0x8a5a12)
    this.blockyRect(g, 15, 7, 9, 4, 0xf5c518)
    this.blockyRect(g, 21, 11, 3, 4, 0xf5c518)
    this.blockyRect(g, 24, 11, 3, 3, 0xf5c518)
    g.generateTexture('key', W, H)
  }

  private drawChest(g: Phaser.GameObjects.Graphics) {
    const W = 30
    const H = 27
    g.clear()
    this.blockyRect(g, 0, 12, W, 15, 0x8b5a2b)
    this.blockyRect(g, 0, 0, W, 12, 0x6b4423)
    this.blockyRect(g, 0, 0, W, PX, 0x4a2f18)
    this.blockyRect(g, 0, 12, W, PX, 0x4a2f18)
    this.blockyRect(g, 13, 9, PX * 2, PX * 3, 0xf5c518)
    g.generateTexture('chest', W, H)
  }

  private drawSpike(g: Phaser.GameObjects.Graphics) {
    const W = 27
    const H = 18
    g.clear()
    this.blockyTriangleUp(g, 7, H, 11, H, 0x9ca3af)
    this.blockyTriangleUp(g, 19, H, 11, H, 0x9ca3af)
    g.generateTexture('spike', W, H)
  }

  private drawHeart(g: Phaser.GameObjects.Graphics, color: number, key: string) {
    const rows = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...']
    const size = PX
    g.clear()
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x += 1) {
        if (row[x] !== 'X') continue
        g.fillStyle(color, 1)
        g.fillRect(x * size, y * size, size, size)
      }
    })
    g.generateTexture(key, rows[0].length * size, rows.length * size)
  }

  private drawTree(g: Phaser.GameObjects.Graphics) {
    const W = 96
    const H = 216
    g.clear()
    this.blockyRect(g, 41, 108, 15, 108, 0x16281a)
    this.blockyEllipse(g, 48, 90, 40, 40, 0x162e1c)
    this.blockyEllipse(g, 22, 118, 28, 28, 0x1f3a24)
    this.blockyEllipse(g, 74, 118, 28, 28, 0x1f3a24)
    this.blockyEllipse(g, 48, 70, 30, 26, 0x27492e)
    g.generateTexture('tree', W, H)
  }
}
