import Phaser from 'phaser'
import { gameEvents } from '@/features/game/gameEvents'

interface World1SceneData {
  levelId: number
}

type PhysicsCircle = Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body }

export class World1Scene extends Phaser.Scene {
  private player!: PhysicsCircle
  private npc!: Phaser.GameObjects.Arc
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd?: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>
  private levelId = 1
  private canInteract = true
  private touchDirection = { x: 0, y: 0 }

  constructor() {
    super('World1Scene')
  }

  init(data: World1SceneData) {
    this.levelId = data.levelId
    this.canInteract = true
    this.touchDirection = { x: 0, y: 0 }
  }

  create() {
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0xc5e7b3)
    this.add
      .text(width / 2, 32, 'Walk into the glowing orb to answer a challenge!', {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '18px',
        color: '#24441f',
      })
      .setOrigin(0.5)

    this.npc = this.add.circle(width * 0.75, height * 0.55, 28, 0xf59e0b)
    this.add
      .text(this.npc.x, this.npc.y - 45, '?', {
        fontFamily: '"Baloo 2", sans-serif',
        fontSize: '28px',
        color: '#7c3aed',
      })
      .setOrigin(0.5)

    this.player = this.add.circle(width * 0.25, height * 0.55, 20, 0x4f9f3a) as PhysicsCircle
    this.physics.add.existing(this.player)
    this.player.body.setCollideWorldBounds(true)

    this.physics.add.existing(this.npc, true)
    this.physics.add.overlap(this.player, this.npc, () => this.handleNpcContact())

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys()
      const keys = this.input.keyboard.addKeys('W,A,S,D') as unknown as Record<
        'W' | 'A' | 'S' | 'D',
        Phaser.Input.Keyboard.Key
      >
      this.wasd = keys
    }

    this.createTouchControls()

    const unsubscribe = gameEvents.on('answerResult', (payload) => this.handleAnswerResult(payload))
    this.events.once('shutdown', unsubscribe)
  }

  update() {
    const speed = 200
    let vx = this.touchDirection.x * speed
    let vy = this.touchDirection.y * speed

    if (this.cursors?.left.isDown || this.wasd?.A.isDown) vx -= speed
    if (this.cursors?.right.isDown || this.wasd?.D.isDown) vx += speed
    if (this.cursors?.up.isDown || this.wasd?.W.isDown) vy -= speed
    if (this.cursors?.down.isDown || this.wasd?.S.isDown) vy += speed

    this.player.body.setVelocity(vx, vy)
  }

  private handleNpcContact() {
    if (!this.canInteract) return
    this.canInteract = false
    gameEvents.emit('npcInteract', { levelId: this.levelId })
  }

  private handleAnswerResult(payload: { correct: boolean; xpAwarded: number; levelCompleted: boolean }) {
    const color = payload.correct ? '#3c7f2c' : '#dc2626'
    const message = payload.correct ? `+${payload.xpAwarded} XP!` : 'Try the next one!'

    const feedback = this.add
      .text(this.npc.x, this.npc.y - 60, message, {
        fontFamily: '"Baloo 2", sans-serif',
        fontSize: '22px',
        color,
      })
      .setOrigin(0.5)

    this.tweens.add({
      targets: feedback,
      y: feedback.y - 30,
      alpha: 0,
      duration: 1200,
      onComplete: () => feedback.destroy(),
    })

    if (payload.levelCompleted) {
      this.npc.setFillStyle(0x8b5cf6)
    }

    this.time.delayedCall(400, () => {
      this.canInteract = true
    })
  }

  private createTouchControls() {
    const { height } = this.scale
    const padSize = 44
    const margin = 20
    const baseY = height - margin - padSize
    const centerX = margin + padSize * 1.5

    const makeButton = (x: number, y: number, label: string, dir: { x: number; y: number }) => {
      const button = this.add.rectangle(x, y, padSize, padSize, 0x316526, 0.55).setInteractive()
      this.add.text(x, y, label, { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5)

      button.on('pointerdown', () => {
        this.touchDirection = dir
      })
      button.on('pointerup', () => {
        this.touchDirection = { x: 0, y: 0 }
      })
      button.on('pointerout', () => {
        this.touchDirection = { x: 0, y: 0 }
      })
    }

    makeButton(centerX, baseY - padSize, '↑', { x: 0, y: -1 })
    makeButton(centerX, baseY + padSize, '↓', { x: 0, y: 1 })
    makeButton(centerX - padSize, baseY, '←', { x: -1, y: 0 })
    makeButton(centerX + padSize, baseY, '→', { x: 1, y: 0 })
  }
}
