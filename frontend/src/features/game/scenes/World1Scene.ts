import Phaser from 'phaser'
import { gameEvents } from '@/features/game/gameEvents'

interface World1SceneData {
  levelId: number
}

type StaticZone = Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.StaticBody }
type PhysicsImage = Phaser.Physics.Arcade.Image
type Keys = Record<'W' | 'A' | 'D', Phaser.Input.Keyboard.Key>

const WORLD_WIDTH = 3200
const GROUND_HEIGHT = 40
const MAX_HEARTS = 4
const KEY_TARGET = 10
const MATCH_SECONDS = 90
const MOVE_SPEED = 220
const JUMP_VELOCITY = -480

export class World1Scene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd?: Keys
  private spaceKey?: Phaser.Input.Keyboard.Key
  private escKey?: Phaser.Input.Keyboard.Key

  private levelId = 1
  private groundY = 0
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
    this.heartIcons = []
    this.highScore = Number(localStorage.getItem(this.highScoreKey) ?? 0)
  }

  create() {
    const { width, height } = this.scale
    this.groundY = height - GROUND_HEIGHT

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, height)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, height)

    this.buildBackground(width, height)
    const groundZone = this.buildGround(height)
    const platforms = this.buildPlatforms()

    this.player = this.physics.add.sprite(120, this.groundY - 40, 'player')
    this.player.setSize(24, 30).setOffset(4, 8)
    this.player.setCollideWorldBounds(true)
    this.player.setDragX(900)
    this.player.setMaxVelocity(MOVE_SPEED, 900)
    this.player.setDepth(5)

    this.physics.add.collider(this.player, groundZone)
    this.physics.add.collider(this.player, platforms)

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)

    this.buildKeys()
    this.buildChests()
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
      .text(width / 2, 20, `Collect at least ${KEY_TARGET} keys to win`, {
        fontFamily: '"Baloo 2", sans-serif',
        fontSize: '14px',
        color: '#fde68a',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10)
  }

  private buildGround(height: number): StaticZone {
    this.add
      .tileSprite(WORLD_WIDTH / 2, this.groundY + GROUND_HEIGHT / 2, WORLD_WIDTH, GROUND_HEIGHT, 'ground')
      .setDepth(1)
    const zone = this.add.rectangle(
      WORLD_WIDTH / 2,
      this.groundY + GROUND_HEIGHT / 2,
      WORLD_WIDTH,
      GROUND_HEIGHT,
      0x000000,
      0,
    ) as StaticZone
    this.physics.add.existing(zone, true)
    void height
    return zone
  }

  private buildPlatforms(): Phaser.Physics.Arcade.StaticGroup {
    const platforms = this.physics.add.staticGroup()
    const positions = [
      { x: 620, y: this.groundY - 90 },
      { x: 1150, y: this.groundY - 120 },
      { x: 1750, y: this.groundY - 90 },
      { x: 2300, y: this.groundY - 130 },
      { x: 2750, y: this.groundY - 90 },
    ]
    positions.forEach(({ x, y }) => {
      const platform = platforms.create(x, y, 'platform') as PhysicsImage
      platform.refreshBody()
    })
    return platforms
  }

  private buildKeys() {
    const positions: Array<{ x: number; y: number }> = []
    for (let i = 0; i < 12; i += 1) {
      const x = 320 + i * 250 + (i % 2 === 0 ? 0 : 40)
      const onPlatform = i % 3 === 1
      const y = onPlatform ? this.groundY - 150 : this.groundY - 40
      positions.push({ x, y })
    }

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
    if (this.keysCollected >= KEY_TARGET) this.endGame(true)
  }

  private buildChests() {
    const positions = [
      { x: WORLD_WIDTH * 0.35, y: this.groundY - 12 },
      { x: WORLD_WIDTH * 0.7, y: this.groundY - 12 },
    ]
    positions.forEach(({ x, y }) => {
      const chest = this.physics.add.staticImage(x, y, 'chest')
      chest.setData('opened', false)
      this.physics.add.overlap(this.player, chest, () => this.handleChestContact(chest))
    })
  }

  private handleChestContact(chest: PhysicsImage) {
    if (!this.canInteractChest || chest.getData('opened') || this.ended) return
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
      this.keysCollected += 2
      this.score += 50
      this.popText(originX, originY, '+50', '#f5c518', 24)
    } else if (!payload.correct) {
      this.popText(originX, originY, 'Try the next one!', '#dc2626', 16)
    }

    this.updateHud()
    this.activeChest = null

    if (this.keysCollected >= KEY_TARGET) {
      this.endGame(true)
      return
    }

    this.time.delayedCall(400, () => {
      this.canInteractChest = true
    })
  }

  private buildSpikes() {
    const xs = [780, 1420, 1980, 2560]
    xs.forEach((x) => {
      const spike = this.physics.add.staticImage(x, this.groundY - 9, 'spike')
      this.physics.add.overlap(this.player, spike, () => this.handleSpikeHit())
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
    this.keysText.setText(`Keys: ${this.keysCollected} / ${KEY_TARGET}`)
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
