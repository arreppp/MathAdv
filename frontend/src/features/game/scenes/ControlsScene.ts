import Phaser from 'phaser'

interface ControlsSceneData {
  parentKey: string
}

export class ControlsScene extends Phaser.Scene {
  private sceneData!: ControlsSceneData

  constructor() {
    super('ControlsScene')
  }

  init(data: ControlsSceneData) {
    this.sceneData = data
  }

  create() {
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
    this.add
      .text(width / 2, height * 0.14, "PLAYER'S CONTROLS", {
        fontFamily: '"Baloo 2", sans-serif',
        fontSize: '24px',
        color: '#fde68a',
      })
      .setOrigin(0.5)

    const lines = [
      '◀ / A   -  move left',
      '▶ / D   -  move right',
      'SPACE / ▲ / JUMP  -  jump',
      'II   -  pause the game',
      'i   -  view these controls',
    ]

    lines.forEach((line, index) => {
      this.add
        .text(width / 2, height * 0.32 + index * 28, line, {
          fontFamily: '"Nunito", sans-serif',
          fontSize: '15px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
    })

    const closeBtn = this.add
      .text(width / 2, height * 0.85, 'Return to the Game', {
        fontFamily: '"Baloo 2", sans-serif',
        fontSize: '18px',
        color: '#1f3a24',
        backgroundColor: '#9fd485',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    closeBtn.on('pointerdown', () => {
      this.scene.stop()
      this.scene.resume(this.sceneData.parentKey)
    })
  }
}
