import Phaser from 'phaser'

interface BootSceneData {
  levelId: number
}

/**
 * No external assets to preload yet (all World 1 visuals are drawn
 * primitives) - this exists as the entry point future asset loading
 * will hang off of.
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
    this.scene.start('World1Scene', this.sceneData)
  }
}
