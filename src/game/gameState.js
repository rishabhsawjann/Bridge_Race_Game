import * as BABYLON from "babylonjs"

export const createGameState = () => ({
  brickCount: 0,
  isBuilding: false,
  moveDir: new BABYLON.Vector3(0, 0, 0),
  playerSpeed: 6,
  bridgeSpacing: 1.1,
  bridgeWidth: 1.2,
  bridgeLength: 1.2,
  bridgeYOffset: 0.9,
  playerRadius: 0.3,
  // Animation state
  animations: {},
  currentAnimation: null,
  isGrounded: true,
  isFalling: false,
  hasWon: false,
})

