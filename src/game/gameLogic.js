import * as BABYLON from "babylonjs"
import { playAnimation } from "./sceneSetup.js"

export function setupGameLogic(scene, player, camera, startPlatform, nextPlatform, bridgeParent, occupiedCells, startEdgeZ, nextEdgeStartZ, corridorHalfWidth, bridgeMat, gameState) {
  let verticalVelocity = 0
  const gravityAcceleration = 20
  let isGameOver = false

  function showGameOver() {
    if (isGameOver) return
    isGameOver = true
    // This will be handled by React state
    window.dispatchEvent(new CustomEvent('gameOver'))
  }

  // Game loop
  scene.onBeforeRenderObservable.add(() => {
    if (isGameOver) return
    
    const dt = scene.getEngine().getDeltaTime() / 1000
    
    // Move
    const move = gameState.moveDir.scale(gameState.playerSpeed * dt)
    player.moveWithCollisions(move)

    // Face movement direction
    if (gameState.moveDir.lengthSquared() > 0.0001) {
      const yaw = Math.atan2(gameState.moveDir.x, gameState.moveDir.z)
      player.rotation.y = yaw
    }

    // Camera follow: keep same angle/distance, move target with player
    camera.setTarget(new BABYLON.Vector3(player.position.x, 1, player.position.z))

    // Keep player Y stable on platforms/bridge
    const ray = new BABYLON.Ray(player.position.add(new BABYLON.Vector3(0, 2, 0)), new BABYLON.Vector3(0, -1, 0), 5)
    const pick = scene.pickWithRay(ray, (m) => m === startPlatform || m === nextPlatform || m.metadata === 'bridge')
    if (pick && pick.hit) {
      // Snap to support and reset vertical velocity
      player.position.y = pick.pickedPoint.y + gameState.playerRadius
      verticalVelocity = 0
      gameState.isGrounded = true
      gameState.isFalling = false
    } else {
      // Apply gravity when not supported by platform/bridge
      verticalVelocity -= gravityAcceleration * dt
      player.position.y += verticalVelocity * dt
      gameState.isGrounded = false
      
      // Mark as falling if velocity is significant
      if (verticalVelocity < -2) {
        gameState.isFalling = true
      }
    }

    // Handle animations based on state
    // Win animation disabled for now - will be used when game is complete
    if (gameState.isFalling) {
      playAnimation(gameState, 'fall', true)
    } else if (gameState.isGrounded) {
      const isMoving = gameState.moveDir.lengthSquared() > 0.0001
      if (isMoving) {
        // Use 'run' for faster movement, 'walk' for slower (currently just run)
        playAnimation(gameState, 'run', true)
      } else {
        // Player is idle - standing still with no movement
        // Try idle animation first, then T-Pose as fallback
        if (gameState.animations['idle']) {
          playAnimation(gameState, 'idle', true)
        } else if (gameState.animations['t-pose']) {
          playAnimation(gameState, 't-pose', true)
        }
      }
    }

    // Trigger game over if fallen well below platforms
    if (player.position.y < -5) {
      showGameOver()
    }

    // Determine if over the gap and inside bridge walls
    const isOverGap = player.position.z > startEdgeZ - 0.05 && player.position.z < nextEdgeStartZ + 0.001
    // Check if player is within the bridge corridor walls (not just the corridor)
    const wallInnerLimit = corridorHalfWidth - 0.2  // Account for wall thickness and safety margin
    const inCorridor = Math.abs(player.position.x) <= wallInnerLimit
    if (isOverGap && inCorridor && gameState.brickCount > 0) {
      // Snap Z position to spacing grid for tile placement
      const s = gameState.bridgeSpacing
      const gz = Math.round(player.position.z / s) * s
      // Only within the gap region
      if (gz >= startEdgeZ && gz <= nextEdgeStartZ) {
        // All tiles are placed at X=0 (center) and span the full corridor width
        const key = '0.00|' + gz.toFixed(2)
        if (!occupiedCells.has(key)) {
          // Compute full inner width between walls
          const innerWidth = wallInnerLimit * 2  // Full width between the walls
          const step = BABYLON.MeshBuilder.CreateBox('bridgeStep', { width: innerWidth, depth: gameState.bridgeLength, height: 0.2 }, scene)
          step.position = new BABYLON.Vector3(0, gameState.bridgeYOffset, gz)  // Always centered at X=0
          step.material = bridgeMat
          step.metadata = 'bridge'
          step.parent = bridgeParent
          occupiedCells.add(key)
          gameState.brickCount -= 1
          // This will be handled by React state
          window.dispatchEvent(new CustomEvent('brickCountUpdate', { detail: gameState.brickCount }))
        }
      }
    }

    // Win detection disabled for now - will be enabled when game is complete
    // const onGoalPlatform = Math.abs(player.position.x - nextPlatform.position.x) < platformSize / 2 &&
    //                        Math.abs(player.position.z - nextPlatform.position.z) < platformSize / 2
    // if (onGoalPlatform && !gameState.hasWon) {
    //   gameState.hasWon = true
    //   console.log('Player won!')
    // }
  })
}

