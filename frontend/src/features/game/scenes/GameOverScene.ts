import Phaser from 'phaser'
import { gameEvents } from '@/features/game/gameEvents'

interface GameOverSceneData {
  won: boolean
  score: number
  keysCollected: number
  keyTarget: number
  highScore: number
  levelId: number
}

export class GameOverScene extends Phaser.Scene {
  private sceneData!: GameOverSceneData

  constructor() {
    super('GameOverScene')
  }

  init(data: GameOverSceneData) {
    this.sceneData = data
  }

  create() {
    const { width, height } = this.scale
    const { won, score, keysCollected, keyTarget, highScore } = this.sceneData
    const isNewHighScore = score >= highScore && score > 0

    this.add.rectangle(width / 2, height / 2, width, height, won ? 0x1f3a24 : 0x2a0e0e, 0.92)

    this.add
      .text(width / 2, height * 0.2, won ? 'YOU WIN!' : 'YOU DIED', {
        fontFamily: '"Baloo 2", sans-serif',
        fontSize: '46px',
        color: won ? '#9fd485' : '#f38b8b',
      })
      .setOrigin(0.5)

    this.add
      .text(width / 2, height * 0.4, `Keys: ${keysCollected} / ${keyTarget}`, {
        fontFamily: '"Baloo 2", sans-serif',
        fontSize: '18px',
        color: '#fde68a',
      })
      .setOrigin(0.5)

    this.add
      .text(width / 2, height * 0.48, `${score} Points`, {
        fontFamily: '"Baloo 2", sans-serif',
        fontSize: '18px',
        color: '#fef3c7',
      })
      .setOrigin(0.5)

    this.add
      .text(width / 2, height * 0.55, isNewHighScore ? 'New Highscore!' : `Highscore: ${highScore}`, {
        fontFamily: '"Baloo 2", sans-serif',
        fontSize: '15px',
        color: '#d97706',
      })
      .setOrigin(0.5)

    this.makeButton(width / 2, height * 0.68, 'Restart', () => this.restart())
    this.makeButton(width / 2, height * 0.8, 'Main Menu', () => this.exitToDashboard())
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

  private restart() {
    this.scene.start('World1Scene', { levelId: this.sceneData.levelId })
  }

  private exitToDashboard() {
    gameEvents.emit('exitToDashboard', {})
  }
}
