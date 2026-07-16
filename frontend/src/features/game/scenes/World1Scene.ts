import Phaser from 'phaser'
import { gameEvents } from '@/features/game/gameEvents'

interface World1SceneData {
  levelId: number
}

type PhysicsImage = Phaser.Physics.Arcade.Image
type Keys = Record<'W' | 'A' | 'D', Phaser.Input.Keyboard.Key>
type Waypoint = { x: number; y: number }
type PitRange = { start: number; end: number }
type MovingHazard = { image: PhysicsImage; minX: number; maxX: number }

const WORLD_WIDTH = 3200
const GROUND_HEIGHT = 40
const TILE = 33
const GROUND_FILL_DEPTH = 6
const MAX_HEARTS = 3
const KEY_TARGET = 10
const MATCH_SECONDS = 90
const MOVE_SPEED = 220
const JUMP_VELOCITY = -480
const HAZARD_SPEED = 70

/**
 * The world profile is authored as a list of (x, y) waypoints describing the
 * top of the terrain. Between two waypoints of different height the ground
 * rises/falls in TILE-sized staircase steps (easy to jump, matches the
 * blocky pixel-art look). A PitRange marks a gap with no ground at all -
 * falling in costs a life and respawns the player at the start.
 */
export class World1Scene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd?: Keys
  private spaceKey?: Phaser.Input.Keyboard.Key
  private escKey?: Phaser.Input.Keyboard.Key

  private levelId = 1
  private groundY = 0
  private hill1Y = 0
  private hill2Y = 0
  private podiumY = 0
  private waypoints: Waypoint[] = []
  private pits: PitRange[] = []
  private spawnX = 200
  private spawnY = 0
  private fallDeathY = 0
  private highScoreKey = 'mathadv_highscore_world1'

  private hearts = MAX_HEARTS
  private keysCollected = 0
  private score = 0
  private highScore = 0
  private remainingSeconds = MATCH_SECONDS
  private ended = false
  private invulnerable = false
  private canInteractChest = true
  private activeChest: PhysicsImage | null = null

  private touchLeft = false
  private touchRight = false
  private jumpQueued = false
  private movingHazards: MovingHazard[] = []

  private heartIcons: Phaser.GameObjects.Image[] = []
  private keysText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private highScoreText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private timerEvent!: Phaser.Time.TimerEvent

  constructor() {
    super('World1Scene')
  }

  init(data: World1SceneData) {
    this.levelId = data.levelId
    this.highScoreKey = `mathadv_highscore_world1_${this.levelId}`
    this.hearts = MAX_HEARTS
    this.keysCollected = 0
    this.score = 0
    this.remainingSeconds = MATCH_SECONDS
    this.ended = false
    this.invulnerable = false
    this.canInteractChest = true
    this.activeChest = null
    this.touchLeft = false
    this.touchRight = false
    this.jumpQueued = false
    this.movingHazards = []
    this.heartIcons = []
    this.highScore = Number(localStorage.getItem(this.highScoreKey) ?? 0)
  }

  create() {
    const { width, height } = this.scale
    this.groundY = height - GROUND_HEIGHT
    this.hill1Y = this.groundY - 99
    this.hill2Y = this.groundY - 132
    this.podiumY = this.groundY - 66
    this.spawnX = 200
    this.spawnY = this.groundY - 40
    this.fallDeathY = height + 60

    this.waypoints = [
      { x: 0, y: this.groundY },
      { x: 380, y: this.groundY },
      { x: 590, y: this.hill1Y }, // hill 1 - uphill
      { x: 850, y: this.hill1Y }, // hill 1 - plateau
      { x: 1060, y: this.groundY }, // hill 1 - downhill
      { x: 1290, y: this.groundY },
      { x: 1660, y: this.groundY },
      { x: 1800, y: this.groundY },
      { x: 2100, y: this.groundY },
      { x: 2380, y: this.hill2Y }, // hill 2 - uphill
      { x: 2480, y: this.hill2Y }, // hill 2 - plateau
      { x: 2760, y: this.groundY }, // hill 2 - downhill
      { x: 2930, y: this.groundY },
      { x: 3050, y: this.groundY },
      { x: 3120, y: this.podiumY }, // final climb to the goal podium
      { x: WORLD_WIDTH, y: this.podiumY },
    ]
    this.pits = [
      { start: 1140, end: 1290 },
      { start: 1660, end: 1800 },
      { start: 2760, end: 2930 },
    ]

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, height + 260)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, height)

    this.buildBackground(width, height)
    const ground = this.buildGround()
    const platforms = this.buildPlatforms()

    this.player = this.physics.add.sprite(this.spawnX, this.spawnY, 'player')
    this.player.setSize(24, 30).setOffset(4, 8)
    this.player.setCollideWorldBounds(true)
    this.player.setDragX(900)
    this.player.setMaxVelocity(MOVE_SPEED, 900)
    this.player.setDepth(5)

    this.physics.add.collider(this.player, ground)
    this.physics.add.collider(
      this.player,
      platforms,
      undefined,
      (playerObj, platformObj) => {
        const body = (playerObj as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.Body
        const platformBody = (platformObj as PhysicsImage).body as Phaser.Physics.Arcade.StaticBody
        return body.velocity.y >= 0 && body.bottom <= platformBody.top + 8
      },
    )

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)

    this.buildKeys()
    this.buildChest()
    this.buildSpikes()
    this.buildHud(width)
    this.buildTouchControls(width, height)

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys()
      this.wasd = this.input.keyboard.addKeys('W,A,D') as unknown as Keys
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
      this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    }

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.ended) return
        this.remainingSeconds -= 1
        this.updateTimerText()
        if (this.remainingSeconds <= 0) this.endGame(false)
      },
    })
    this.events.once('shutdown', () => this.timerEvent.destroy())

    const unsubscribe = gameEvents.on('answerResult', (payload) => this.handleAnswerResult(payload))
    this.events.once('shutdown', unsubscribe)

    this.updateHud()
  }

  update() {
    if (this.ended) return

    if (this.player.y > this.fallDeathY) {
      this.handleFallDeath()
      return
    }

    this.updateMovingHazards()

    const body = this.player.body as Phaser.Physics.Arcade.Body
    const onGround = body.blocked.down || body.touching.down

    const left = (this.cursors?.left.isDown ?? false) || (this.wasd?.A.isDown ?? false) || this.touchLeft
    const right = (this.cursors?.right.isDown ?? false) || (this.wasd?.D.isDown ?? false) || this.touchRight
    const jumpPressed =
      (this.cursors && Phaser.Input.Keyboard.JustDown(this.cursors.up)) ||
      (this.wasd && Phaser.Input.Keyboard.JustDown(this.wasd.W)) ||
      (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) ||
      this.jumpQueued
    this.jumpQueued = false

    if (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) this.pauseGame()

    // Movement and jumping are independent checks below, so holding a
    // direction and pressing jump in the same frame does both at once.
    if (left) {
      this.player.setVelocityX(-MOVE_SPEED)
      this.player.setFlipX(true)
    } else if (right) {
      this.player.setVelocityX(MOVE_SPEED)
      this.player.setFlipX(false)
    }

    if (jumpPressed && onGround) this.player.setVelocityY(JUMP_VELOCITY)

    if (onGround && (left || right)) {
      this.player.setScale(1, 0.94 + Math.sin(this.time.now / 60) * 0.04)
    } else {
      this.player.setScale(1, 1)
    }
  }

  private buildBackground(width: number, height: number) {
    this.add
      .tileSprite(WORLD_WIDTH / 2, height * 0.55, WORLD_WIDTH, 220, 'tree')
      .setScrollFactor(0.3)
      .setAlpha(0.85)
      .setDepth(0)
    this.add
      .text(width / 2, 20, `Collect ${KEY_TARGET} keys, then find the chest at world's end!`, {
        fontFamily: '"Baloo 2", sans-serif',
        fontSize: '13px',
        color: '#fde68a',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10)
  }

  /** Height of the walkable surface at x, stepping in TILE increments between waypoints. */
  private terrainHeightAt(x: number): number {
    const wp = this.waypoints
    for (let i = 0; i < wp.length - 1; i += 1) {
      const a = wp[i]
      const b = wp[i + 1]
      if (x < a.x || x > b.x) continue
      if (a.y === b.y) return a.y
      const steps = Math.max(1, Math.round(Math.abs(b.y - a.y) / TILE))
      const stepWidth = (b.x - a.x) / steps
      const stepIndex = Math.min(steps - 1, Math.floor((x - a.x) / stepWidth))
      return a.y + ((b.y - a.y) / steps) * (stepIndex + 1)
    }
    return wp[wp.length - 1].y
  }

  private isPit(x: number): boolean {
    return this.pits.some((p) => x >= p.start && x < p.end)
  }

  private buildGround(): Phaser.Physics.Arcade.StaticGroup {
    const group = this.physics.add.staticGroup()
    for (let x = TILE / 2; x < WORLD_WIDTH; x += TILE) {
      if (this.isPit(x)) continue
      const surfaceY = this.terrainHeightAt(x)
      for (let row = 0; row < GROUND_FILL_DEPTH; row += 1) {
        const cy = surfaceY + TILE / 2 + row * TILE
        if (row === 0) {
          const tile = group.create(x, cy, 'ground') as PhysicsImage
          tile.setDepth(1)
          tile.refreshBody()
        } else {
          this.add.image(x, cy, 'ground').setDepth(1)
        }
      }
    }
    return group
  }

  /** Floating platforms are one-way: solid from above, but the player can jump up through them from below. */
  private buildPlatforms(): Phaser.Physics.Arcade.StaticGroup {
    const platforms = this.physics.add.staticGroup()
    // clearance is measured above the *local* terrain height, not a flat
    // baseline, so platforms stay clear of the hills instead of sinking
    // into their slopes.
    const positions = [
      { x: 500, clearance: 90 },
      { x: 1470, clearance: 110 },
      { x: 1900, clearance: 70 },
      { x: 2000, clearance: 140 },
      { x: 2845, clearance: 60 },
    ]
    positions.forEach(({ x, clearance }) => {
      const y = this.terrainHeightAt(x) - clearance
      const platform = platforms.create(x, y, 'platform') as PhysicsImage
      platform.refreshBody()
      const body = platform.body as Phaser.Physics.Arcade.StaticBody
      body.checkCollision.up = true
      body.checkCollision.down = false
      body.checkCollision.left = false
      body.checkCollision.right = false
    })
    return platforms
  }

  private buildKeys() {
    const positions: Waypoint[] = [
      { x: 240, y: this.groundY - 40 },
      { x: 340, y: this.groundY - 40 },
      { x: 680, y: this.hill1Y - 40 }, // hilltop - climb the first hill to reach it
      { x: 760, y: this.hill1Y - 40 },
      { x: 1370, y: this.groundY - 40 },
      { x: 1520, y: this.groundY - 40 },
      { x: 1620, y: this.groundY - 40 }, // right at the edge of a pit
      { x: 1900, y: this.groundY - 70 - 34 }, // above the lower bonus platform
      { x: 2000, y: this.groundY - 140 - 34 }, // above the higher bonus platform
      { x: 2430, y: this.hill2Y - 40 }, // second hilltop, guarded by a spike
      { x: 2980, y: this.groundY - 40 },
      { x: 3150, y: this.podiumY - 40 }, // final key, right by the chest
    ]

    positions.forEach(({ x, y }) => {
      const key = this.physics.add.staticImage(x, y, 'key')
      this.tweens.add({ targets: key, y: y - 6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      this.physics.add.overlap(this.player, key, () => this.collectKey(key))
    })
  }

  private collectKey(key: PhysicsImage) {
    if (!key.active || this.ended) return
    key.disableBody(true, true)
    this.keysCollected += 1
    this.score += 10
    this.popText(key.x, key.y, '+10', '#f5c518')
    this.updateHud()
  }

  private buildChest() {
    const x = WORLD_WIDTH - 60
    const y = this.podiumY - 12
    const chest = this.physics.add.staticImage(x, y, 'chest')
    chest.setData('opened', false)
    this.physics.add.overlap(this.player, chest, () => this.handleChestContact(chest))
  }

  private handleChestContact(chest: PhysicsImage) {
    if (!this.canInteractChest || chest.getData('opened') || this.ended) return

    if (this.keysCollected < KEY_TARGET) {
      this.canInteractChest = false
      this.popText(chest.x, chest.y - 20, `Need ${KEY_TARGET} keys! (${this.keysCollected}/${KEY_TARGET})`, '#f5c518', 14)
      this.time.delayedCall(800, () => {
        this.canInteractChest = true
      })
      return
    }

    this.canInteractChest = false
    this.activeChest = chest
    gameEvents.emit('npcInteract', { levelId: this.levelId })
  }

  private handleAnswerResult(payload: { correct: boolean; xpAwarded: number; levelCompleted: boolean }) {
    const chest = this.activeChest
    const originX = chest ? chest.x : this.player.x
    const originY = (chest ? chest.y : this.player.y) - 30

    if (payload.correct && chest) {
      chest.setData('opened', true)
      chest.setTint(0xffe08a)
      this.score += 50
      this.popText(originX, originY, '+50', '#f5c518', 24)
      this.updateHud()
      this.activeChest = null
      this.endGame(true)
      return
    }

    this.popText(originX, originY, 'Try the next one!', '#dc2626', 16)
    this.updateHud()
    this.activeChest = null

    this.time.delayedCall(400, () => {
      this.canInteractChest = true
    })
  }

  private buildSpikes() {
    const positions: Waypoint[] = [
      { x: 800, y: this.hill1Y - 9 },
      { x: 1340, y: this.groundY - 9 },
      { x: 1580, y: this.groundY - 9 },
      { x: 2390, y: this.hill2Y - 9 },
      { x: 2950, y: this.groundY - 9 },
    ]
    positions.forEach(({ x, y }) => {
      const spike = this.physics.add.staticImage(x, y, 'spike')
      this.physics.add.overlap(this.player, spike, () => this.handleSpikeHit())
    })

    this.buildMovingHazard(1450, this.groundY - 30, 90)
    this.buildMovingHazard(2990, this.groundY - 30, 40)
  }

  /** A patrolling hazard that paces back and forth between x-range to add extra obstacle variety. */
  private buildMovingHazard(x: number, y: number, range: number) {
    const hazard = this.physics.add.image(x, y, 'spike') as PhysicsImage
    hazard.setImmovable(true)
    hazard.setTint(0xff8a8a)
    const body = hazard.body as Phaser.Physics.Arcade.Body
    body.allowGravity = false
    hazard.setVelocityX(HAZARD_SPEED)
    this.physics.add.overlap(this.player, hazard, () => this.handleSpikeHit())
    this.movingHazards.push({ image: hazard, minX: x - range, maxX: x + range })
  }

  private updateMovingHazards() {
    this.movingHazards.forEach((hazard) => {
      const body = hazard.image.body as Phaser.Physics.Arcade.Body
      if (hazard.image.x <= hazard.minX) body.setVelocityX(HAZARD_SPEED)
      else if (hazard.image.x >= hazard.maxX) body.setVelocityX(-HAZARD_SPEED)
    })
  }

  private handleSpikeHit() {
    if (this.invulnerable || this.ended) return
    this.invulnerable = true
    this.hearts -= 1
    this.updateHud()
    this.cameras.main.shake(150, 0.01)

    const knockDir = this.player.flipX ? 1 : -1
    this.player.setVelocity(knockDir * 220, -300)
    this.player.setTintFill(0xff4444)
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.player.clearTint()
        this.player.setAlpha(1)
      },
    })

    if (this.hearts <= 0) {
      this.endGame(false)
      return
    }

    this.time.delayedCall(1200, () => {
      this.invulnerable = false
    })
  }

  /** Falling into a pit (or off the world) costs a life and sends the player back to the start. */
  private handleFallDeath() {
    if (this.invulnerable) return
    this.invulnerable = true
    this.hearts -= 1
    this.updateHud()
    this.cameras.main.flash(200, 220, 38, 38)

    if (this.hearts <= 0) {
      this.endGame(false)
      return
    }

    this.player.setVelocity(0, 0)
    this.player.setPosition(this.spawnX, this.spawnY)
    this.cameras.main.centerOn(this.spawnX, this.spawnY)
    this.popText(this.spawnX, this.spawnY - 30, 'Fell in a hole! -1 life', '#dc2626', 16)

    this.time.delayedCall(1000, () => {
      this.invulnerable = false
    })
  }

  private buildHud(width: number) {
    for (let i = 0; i < MAX_HEARTS; i += 1) {
      const icon = this.add.image(20 + i * 24, 20, 'heart_full').setScrollFactor(0).setDepth(10)
      this.heartIcons.push(icon)
    }

    this.keysText = this.add
      .text(width / 2, 44, '', {
        fontFamily: '"Baloo 2", sans-serif',
        fontSize: '18px',
        color: '#fde68a',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10)

    this.scoreText = this.add
      .text(width / 2, 66, '', {
        fontFamily: '"Baloo 2", sans-serif',
        fontSize: '15px',
        color: '#fef3c7',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10)

    this.highScoreText = this.add
      .text(width / 2, 84, '', {
        fontFamily: '"Baloo 2", sans-serif',
        fontSize: '13px',
        color: '#d97706',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10)

    this.timerText = this.add
      .text(width / 2, 104, '', {
        fontFamily: '"Baloo 2", sans-serif',
        fontSize: '15px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10)

    const pauseBtn = this.add
      .text(width - 28, 24, 'II', {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#00000080',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10)
      .setInteractive({ useHandCursor: true })
    pauseBtn.on('pointerdown', () => this.pauseGame())

    const infoBtn = this.add
      .text(width - 76, 24, 'i', {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#00000080',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10)
      .setInteractive({ useHandCursor: true })
    infoBtn.on('pointerdown', () => this.openControls())
  }

  private buildTouchControls(width: number, height: number) {
    const makeButton = (x: number, y: number, label: string, onDown: () => void, onUp?: () => void) => {
      const button = this.add
        .rectangle(x, y, 56, 56, 0x316526, 0.6)
        .setScrollFactor(0)
        .setDepth(10)
        .setInteractive({ useHandCursor: true })
      this.add.text(x, y, label, { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5).setScrollFactor(0).setDepth(11)
      button.on('pointerdown', onDown)
      if (onUp) {
        button.on('pointerup', onUp)
        button.on('pointerout', onUp)
      }
    }

    const margin = 40
    makeButton(
      margin,
      height - margin,
      '◀',
      () => (this.touchLeft = true),
      () => (this.touchLeft = false),
    )
    makeButton(
      margin + 64,
      height - margin,
      '▶',
      () => (this.touchRight = true),
      () => (this.touchRight = false),
    )
    makeButton(width - margin, height - margin, 'JUMP', () => (this.jumpQueued = true))
  }

  private popText(x: number, y: number, message: string, color: string, fontSize = 20) {
    const text = this.add
      .text(x, y, message, { fontFamily: '"Baloo 2", sans-serif', fontSize: `${fontSize}px`, color })
      .setOrigin(0.5)
      .setDepth(20)

    this.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 900,
      onComplete: () => text.destroy(),
    })
  }

  private updateHud() {
    this.heartIcons.forEach((icon, index) => {
      icon.setTexture(index < this.hearts ? 'heart_full' : 'heart_empty')
    })
    this.keysText.setText(`Keys: ${Math.min(this.keysCollected, KEY_TARGET)} / ${KEY_TARGET}`)
    this.scoreText.setText(`${this.score} Points`)
    this.highScoreText.setText(`Highscore: ${Math.max(this.score, this.highScore)}`)
  }

  private updateTimerText() {
    const minutes = Math.max(0, Math.floor(this.remainingSeconds / 60))
    const seconds = Math.max(0, this.remainingSeconds % 60)
    this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`)
  }

  private pauseGame() {
    if (this.ended) return
    this.scene.pause()
    this.scene.launch('PauseScene', { parentKey: 'World1Scene', levelId: this.levelId })
  }

  private openControls() {
    if (this.ended) return
    this.scene.pause()
    this.scene.launch('ControlsScene', { parentKey: 'World1Scene' })
  }

  private endGame(won: boolean) {
    if (this.ended) return
    this.ended = true
    this.player.setVelocity(0, 0)

    const finalScore = this.score
    const highScore = Math.max(finalScore, this.highScore)
    localStorage.setItem(this.highScoreKey, String(highScore))

    this.time.delayedCall(300, () => {
      this.scene.start('GameOverScene', {
        won,
        score: finalScore,
        keysCollected: this.keysCollected,
        keyTarget: KEY_TARGET,
        highScore,
        levelId: this.levelId,
      })
    })
  }
}
