import Phaser from 'phaser'
import { gameEvents } from '@/features/game/gameEvents'

interface PauseSceneData {
  parentKey: string
  levelId: number
}

export class PauseScene extends Phaser.Scene {
  private sceneData!: PauseSceneData

  constructor() {
    super('PauseScene')
  }

  init(data: PauseSceneData) {
    this.sceneData = data
  }

  create() {
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6)
    this.add
      .text(width / 2, height * 0.3, 'PAUSED', {
        fontFamily: '"Baloo 2", sans-serif',
        fontSize: '36px',
        color: '#fde68a',
      })
      .setOrigin(0.5)

    this.makeButton(width / 2, height * 0.48, 'Resume', () => this.resume())
    this.makeButton(width / 2, height * 0.6, 'Restart', () => this.restart())
    this.makeButton(width / 2, height * 0.72, 'Main Menu', () => this.exitToMenu())

    this.input.keyboard?.once('keydown-ESC', () => this.resume())
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void) {
    const button = this.add
      .text(x, y, label, {
        fontFamily: '"Baloo 2", sans-serif',
        fontSize: '22px',
        color: '#ffffff',
        backgroundColor: '#316526',
        padding: { x: 24, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    button.on('pointerdown', onClick)
    button.on('pointerover', () => button.setStyle({ backgroundColor: '#4f9f3a' }))
    button.on('pointerout', () => button.setStyle({ backgroundColor: '#316526' }))
  }

  private resume() {
    this.scene.stop()
    this.scene.resume(this.sceneData.parentKey)
  }

  private restart() {
    this.scene.stop(this.sceneData.parentKey)
    this.scene.stop()
    this.scene.start(this.sceneData.parentKey, { levelId: this.sceneData.levelId })
  }

  private exitToMenu() {
    this.scene.stop(this.sceneData.parentKey)
    this.scene.stop()
    gameEvents.emit('exitToMenu', {})
  }
}
