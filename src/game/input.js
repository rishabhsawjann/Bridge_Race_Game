import * as BABYLON from "babylonjs"

export function setupInput(scene, player, gameState) {
  const keys = { 
    w: false, 
    a: false, 
    s: false, 
    d: false, 
    up: false, 
    left: false, 
    down: false, 
    right: false 
  }

  const updateMoveDir = () => {
    const forward = (keys.w || keys.up) ? 1 : 0
    const backward = (keys.s || keys.down) ? 1 : 0
    const right = (keys.d || keys.right) ? 1 : 0
    const left = (keys.a || keys.left) ? 1 : 0
    const z = forward - backward
    const x = right - left
    const dir = new BABYLON.Vector3(x, 0, z)
    if (dir.lengthSquared() > 0) dir.normalize()
    gameState.moveDir = dir
  }

  const handleKeyboard = (kbInfo) => {
    const key = kbInfo.event.key.toLowerCase()
    
    if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
      switch (key) {
        case 'w': keys.w = true; break
        case 'a': keys.a = true; break
        case 's': keys.s = true; break
        case 'd': keys.d = true; break
        case 'arrowup': keys.up = true; break
        case 'arrowleft': keys.left = true; break
        case 'arrowdown': keys.down = true; break
        case 'arrowright': keys.right = true; break
        case ' ': gameState.isBuilding = true; break
      }
      updateMoveDir()
    }
    
    if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
      switch (key) {
        case 'w': keys.w = false; break
        case 'a': keys.a = false; break
        case 's': keys.s = false; break
        case 'd': keys.d = false; break
        case 'arrowup': keys.up = false; break
        case 'arrowleft': keys.left = false; break
        case 'arrowdown': keys.down = false; break
        case 'arrowright': keys.right = false; break
        case ' ': gameState.isBuilding = false; break
      }
      updateMoveDir()
    }
  }

  scene.onKeyboardObservable.add(handleKeyboard)
}

