import * as BABYLON from "babylonjs"
import { GLTFFileLoader } from "@babylonjs/loaders/glTF"
import { createGameState } from "./gameState.js"

// Register GLTF loader
BABYLON.SceneLoader.RegisterPlugin(new GLTFFileLoader())

// Helper function to play animations smoothly
export function playAnimation(gameState, animName, loop = true) {
  const name = animName.toLowerCase()
  const anim = gameState.animations[name]
  
  if (!anim) {
    console.warn('Animation not found:', animName)
    return
  }
  
  // Don't restart the same animation
  if (gameState.currentAnimation === name && anim.isPlaying) {
    return
  }
  
  // Stop current animation
  if (gameState.currentAnimation) {
    const currentAnim = gameState.animations[gameState.currentAnimation]
    if (currentAnim) {
      currentAnim.stop()
    }
  }
  
  // Play new animation
  gameState.currentAnimation = name
  anim.start(loop, 1.0, anim.from, anim.to, false)
}

export function createScene(engine, updateHUD, showGameOver) {
  const scene = new BABYLON.Scene(engine)
  const gameState = createGameState()
  
  // Sky background
  scene.clearColor = new BABYLON.Color4(0.6, 0.8, 1.0, 1)

  // Camera (locked) - look from south to north (blue bottom, green top)
  const camera = new BABYLON.ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 3, 18, new BABYLON.Vector3(0, 1, 0), scene)
  camera.inertia = 0
  camera.panningInertia = 0
  camera.inputs.clear()
  camera.lowerAlphaLimit = camera.alpha
  camera.upperAlphaLimit = camera.alpha
  camera.lowerBetaLimit = camera.beta
  camera.upperBetaLimit = camera.beta
  camera.lowerRadiusLimit = camera.radius
  camera.upperRadiusLimit = camera.radius

  // Lights
  const light1 = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene)
  light1.intensity = 1.0
  const dir = new BABYLON.DirectionalLight('dir', new BABYLON.Vector3(-0.5, -1, -0.5), scene)
  dir.position = new BABYLON.Vector3(10, 15, 10)
  dir.intensity = 0.8

  // Materials
  const materials = createMaterials(scene)

  // Ground start platform (slightly bigger)
  const platformSize = 12
  const startPlatform = BABYLON.MeshBuilder.CreateBox('start', { width: platformSize, depth: platformSize, height: 1 }, scene)
  startPlatform.position = new BABYLON.Vector3(0, 0.5, 0)
  startPlatform.material = materials.ground

  // Gap and next platform
  const gapLength = 12
  const nextPlatform = BABYLON.MeshBuilder.CreateBox('next', { width: platformSize, depth: platformSize, height: 1 }, scene)
  nextPlatform.position = new BABYLON.Vector3(0, 0.5, gapLength + platformSize)
  nextPlatform.material = materials.platform

  // Remove fog for clarity in first run
  scene.fogEnabled = false

  // Hide ground grid to keep only sky
  const grid = BABYLON.MeshBuilder.CreateGround('grid', { width: 40, height: 40, subdivisions: 40 }, scene)
  grid.isVisible = false
  grid.isPickable = false

  // Player: capsule collider that drives movement
  const colliderHeight = gameState.playerRadius * 3.2
  const colliderRadius = gameState.playerRadius * 0.9
  const player = BABYLON.MeshBuilder.CreateCapsule('player', { radius: colliderRadius, height: colliderHeight }, scene)
  player.position = new BABYLON.Vector3(0, 1 + colliderHeight / 2, -2)
  player.material = materials.player
  player.checkCollisions = true
  player.ellipsoid = new BABYLON.Vector3(colliderRadius, colliderHeight / 2, colliderRadius)

  // Load character GLB and attach to capsule collider
  BABYLON.SceneLoader.ImportMesh('', './Assets/', 'BlockRunner_character_red_all_animation.glb', scene, (meshes, _ps, skeletons, animationGroups) => {
    console.log('GLB file loaded! Meshes:', meshes.length, 'Skeletons:', skeletons.length, 'Animations:', animationGroups.length)
    
    const root = new BABYLON.TransformNode('charRoot', scene)
    meshes.forEach(m => { 
      m.parent = root
      // Make sure meshes are visible
      m.isVisible = true
      console.log('Mesh loaded:', m.name)
    })
    root.parent = player
    // Scale to reasonable size - start bigger and we'll adjust
    root.scaling = new BABYLON.Vector3(0.07, 0.07, 0.07)
    // Position so feet are at bottom of capsule
    root.position = new BABYLON.Vector3(0, -colliderHeight/2, 0)
    // Rotate: 90 degrees on X to stand up, 180 degrees on Y to face forward
    root.rotation = new BABYLON.Vector3(Math.PI / 2, Math.PI, 0)
    
    // Hide the capsule completely - character is now the visual representation
    player.isVisible = false
    
    // Store animations in gameState
    if (animationGroups && animationGroups.length > 0) {
      // Stop all animations first
      animationGroups.forEach(anim => anim.stop())
      
      // Map animations by name for easy access
      animationGroups.forEach(anim => {
        const name = anim.name.toLowerCase()
        gameState.animations[name] = anim
        console.log('Loaded animation:', anim.name)
      })
      
      // Start with T-Pose or first available idle animation
      // T-Pose is commonly used as the default rest pose
      if (gameState.animations['t-pose']) {
        playAnimation(gameState, 't-pose', true)
      } else if (gameState.animations['idle']) {
        playAnimation(gameState, 'idle', true)
      }
    }
    
    console.log('Character loaded with', animationGroups.length, 'animations')
  }, undefined, (sceneLoaderError) => {
    console.error('Failed to load ./Assets/BlockRunner_character_red_all_animation.glb', sceneLoaderError)
  })

  // Bricks/collectibles pool
  const bricksParent = new BABYLON.TransformNode('bricksParent', scene)
  spawnBricks(scene, bricksParent, materials.collectibles, startPlatform, platformSize, gameState, updateHUD)

  // Bridge state
  const bridgeParent = new BABYLON.TransformNode('bridgeParent', scene)
  const occupiedCells = new Set()

  // Helper bounds (depend on platformSize)
  const startEdgeZ = startPlatform.position.z + platformSize / 2
  const nextEdgeStartZ = nextPlatform.position.z - platformSize / 2

  // Visual bridge corridor centered between platforms (no tiles initially)
  const corridorHalfWidth = 1.1
  const corridorY = 1.0
  const corridorLength = nextEdgeStartZ - startEdgeZ
  const railMat = new BABYLON.StandardMaterial('railMat', scene)
  railMat.diffuseColor = new BABYLON.Color3(0.15, 0.18, 0.25)
  railMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.25)
  railMat.emissiveColor = new BABYLON.Color3(0.04, 0.06, 0.1)
  const railHalfWidth = 0.06
  const leftRail = BABYLON.MeshBuilder.CreateBox('leftRail', { width: railHalfWidth * 2, height: 0.25, depth: corridorLength }, scene)
  leftRail.position = new BABYLON.Vector3(-corridorHalfWidth, corridorY + 0.125, startEdgeZ + corridorLength / 2)
  leftRail.material = railMat
  leftRail.isPickable = false
  const rightRail = leftRail.clone('rightRail')
  rightRail.position.x = corridorHalfWidth

  // Add collision walls along the bridge corridor (same height as platform walls)
  const wallHeight = 0.5
  const wallThickness = 0.2
  const boundaryMat = new BABYLON.StandardMaterial('bridgeBoundaryMat', scene)
  boundaryMat.diffuseColor = new BABYLON.Color3(0.1, 0.14, 0.2)
  boundaryMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1)
  boundaryMat.emissiveColor = new BABYLON.Color3(0.02, 0.05, 0.12)

  // Left bridge wall
  const leftBridgeWall = BABYLON.MeshBuilder.CreateBox('leftBridgeWall', { 
    width: wallThickness, 
    height: wallHeight, 
    depth: corridorLength 
  }, scene)
  leftBridgeWall.position = new BABYLON.Vector3(-corridorHalfWidth - railHalfWidth, corridorY + wallHeight / 2, startEdgeZ + corridorLength / 2)
  leftBridgeWall.material = boundaryMat
  leftBridgeWall.checkCollisions = true

  // Right bridge wall
  const rightBridgeWall = BABYLON.MeshBuilder.CreateBox('rightBridgeWall', { 
    width: wallThickness, 
    height: wallHeight, 
    depth: corridorLength 
  }, scene)
  rightBridgeWall.position = new BABYLON.Vector3(corridorHalfWidth + railHalfWidth, corridorY + wallHeight / 2, startEdgeZ + corridorLength / 2)
  rightBridgeWall.material = boundaryMat
  rightBridgeWall.checkCollisions = true

  // Add platform boundaries with openings aligned to corridor width
  addPlatformBoundaries(startPlatform, platformSize, corridorHalfWidth, railHalfWidth, scene)
  addPlatformBoundaries(nextPlatform, platformSize, corridorHalfWidth, railHalfWidth, scene)

  // Collisions
  scene.collisionsEnabled = true
  startPlatform.checkCollisions = true
  nextPlatform.checkCollisions = true

  console.log('Scene initialized')
  window.scene = scene

  return { 
    scene, 
    player, 
    camera, 
    startPlatform, 
    nextPlatform, 
    bridgeParent, 
    occupiedCells,
    startEdgeZ,
    nextEdgeStartZ,
    corridorHalfWidth,
    bridgeMat: materials.bridge,
    gameState
  }
}

function createMaterials(scene) {
  const groundMat = new BABYLON.StandardMaterial('groundMat', scene)
  groundMat.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.45)
  
  const platformMat = new BABYLON.StandardMaterial('platformMat', scene)
  platformMat.diffuseColor = new BABYLON.Color3(0.15, 0.35, 0.2)
  
  const playerMat = new BABYLON.StandardMaterial('playerMat', scene)
  playerMat.diffuseColor = new BABYLON.Color3(0.9, 0.25, 0.25)
  
  const bridgeMat = new BABYLON.StandardMaterial('bridgeMat', scene)
  bridgeMat.diffuseColor = new BABYLON.Color3(0.9, 0.25, 0.25)  // Red color matching collectible balls
  
  const brickMat = new BABYLON.StandardMaterial('brickMat', scene)
  brickMat.diffuseColor = new BABYLON.Color3(0.25, 0.7, 1.0)
  
  const collectRedMat = new BABYLON.StandardMaterial('collectRedMat', scene)
  collectRedMat.diffuseColor = new BABYLON.Color3(0.9, 0.25, 0.25)
  
  const collectGreenMat = new BABYLON.StandardMaterial('collectGreenMat', scene)
  collectGreenMat.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.35)
  
  const collectYellowMat = new BABYLON.StandardMaterial('collectYellowMat', scene)
  collectYellowMat.diffuseColor = new BABYLON.Color3(0.95, 0.85, 0.3)

  return {
    ground: groundMat,
    platform: platformMat,
    player: playerMat,
    bridge: bridgeMat,
    brick: brickMat,
    collectibles: {
      red: collectRedMat,
      green: collectGreenMat,
      yellow: collectYellowMat
    }
  }
}

function addPlatformBoundaries(platform, platformSize, corridorHalfWidth, railHalfWidth, scene) {
  const half = platformSize / 2
  const wallThickness = 0.2
  const wallHeight = 0.5
  const topY = 1.0
  const boundaryMat = new BABYLON.StandardMaterial('boundaryMat', scene)
  boundaryMat.diffuseColor = new BABYLON.Color3(0.1, 0.14, 0.2)
  boundaryMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1)
  boundaryMat.emissiveColor = new BABYLON.Color3(0.02, 0.05, 0.12)

  const openingHalf = corridorHalfWidth + railHalfWidth + 0.05
  const segmentWidth = Math.max(0.01, half - openingHalf)
  
  // North edge - left and right segments
  const northL = BABYLON.MeshBuilder.CreateBox('wall_n_l', { width: segmentWidth, height: wallHeight, depth: wallThickness }, scene)
  northL.position = platform.position.add(new BABYLON.Vector3(-half + segmentWidth / 2, topY + wallHeight / 2, half - wallThickness / 2))
  northL.material = boundaryMat
  northL.checkCollisions = true
  
  const northR = BABYLON.MeshBuilder.CreateBox('wall_n_r', { width: segmentWidth, height: wallHeight, depth: wallThickness }, scene)
  northR.position = platform.position.add(new BABYLON.Vector3(half - segmentWidth / 2, topY + wallHeight / 2, half - wallThickness / 2))
  northR.material = boundaryMat
  northR.checkCollisions = true

  // South edge - left and right segments
  const southL = BABYLON.MeshBuilder.CreateBox('wall_s_l', { width: segmentWidth, height: wallHeight, depth: wallThickness }, scene)
  southL.position = platform.position.add(new BABYLON.Vector3(-half + segmentWidth / 2, topY + wallHeight / 2, -half + wallThickness / 2))
  southL.material = boundaryMat
  southL.checkCollisions = true
  
  const southR = BABYLON.MeshBuilder.CreateBox('wall_s_r', { width: segmentWidth, height: wallHeight, depth: wallThickness }, scene)
  southR.position = platform.position.add(new BABYLON.Vector3(half - segmentWidth / 2, topY + wallHeight / 2, -half + wallThickness / 2))
  southR.material = boundaryMat
  southR.checkCollisions = true

  const east = BABYLON.MeshBuilder.CreateBox('wall_e', { width: wallThickness, height: wallHeight, depth: platformSize - wallThickness * 2 }, scene)
  east.position = platform.position.add(new BABYLON.Vector3(half - wallThickness / 2, topY + wallHeight / 2, 0))
  east.material = boundaryMat
  east.checkCollisions = true

  const west = east.clone('wall_w')
  west.position = platform.position.add(new BABYLON.Vector3(-half + wallThickness / 2, topY + wallHeight / 2, 0))
  west.checkCollisions = true
}

function spawnBricks(scene, parent, materials, startPlatform, platformSize, gameState, updateHUD) {
  const positions = []
  const half = platformSize / 2 - 1
  // 45 total bricks = 15 of each color (red, green, yellow)
  for (let i = 0; i < 45; i++) {
    const x = -half + Math.random() * (half * 2)
    const z = -half + Math.random() * (half * 2)
    positions.push(new BABYLON.Vector3(x, 0.7, z))
  }

  positions.forEach((pos, idx) => {
    const sphere = BABYLON.MeshBuilder.CreateSphere('collect_' + idx, { diameter: 0.4 }, scene)
    sphere.position = pos.add(startPlatform.position)
    const colorIdx = idx % 3
    if (colorIdx === 0) sphere.material = materials.red
    if (colorIdx === 1) sphere.material = materials.green
    if (colorIdx === 2) sphere.material = materials.yellow
    sphere.checkCollisions = false
    sphere.metadata = { type: 'collectible_sphere', color: colorIdx === 0 ? 'red' : colorIdx === 1 ? 'green' : 'yellow' }
    sphere.parent = parent
  })

  // Pickup via proximity check each frame (only red is collectible)
  scene.onBeforeRenderObservable.add(() => {
    const children = parent.getChildren()
    const playerMesh = scene.getMeshByName('player')
    if (!playerMesh) return
    for (let i = children.length - 1; i >= 0; i--) {
      const b = children[i]
      if (!b || !b.isEnabled()) continue
      const dist = BABYLON.Vector3.DistanceSquared(b.position, playerMesh.position)
      if (dist < 1.0) {
        if (b.metadata && b.metadata.color === 'red') {
          b.setEnabled(false)
          gameState.brickCount += 1
          updateHUD(gameState.brickCount)
        }
      }
    }
  })
}
