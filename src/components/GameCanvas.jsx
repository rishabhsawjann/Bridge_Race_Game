import React, { useRef, useEffect, useCallback, memo } from 'react'
import * as BABYLON from 'babylonjs'
import { GLTFFileLoader } from '@babylonjs/loaders/glTF'
import { useGame } from '../context/GameContext'
import { createScene } from '../game/sceneSetup'
import { setupInput } from '../game/input'
import { setupGameLogic } from '../game/gameLogic'

// Register GLTF loader
BABYLON.SceneLoader.RegisterPlugin(new GLTFFileLoader())

const GameCanvas = memo(() => {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const sceneRef = useRef(null)
  const { setBrickCount, setGameOver } = useGame()

  const updateHUD = useCallback((brickCount) => {
    setBrickCount(brickCount)
  }, [setBrickCount])

  const showGameOver = useCallback(() => {
    setGameOver(true)
  }, [setGameOver])

  useEffect(() => {
    if (!canvasRef.current) return

    // Create engine
    const engine = new BABYLON.Engine(canvasRef.current, true, { 
      preserveDrawingBuffer: true, 
      stencil: true 
    })
    engineRef.current = engine

    // Create scene
    const sceneData = createScene(engine, updateHUD, showGameOver)
    const { 
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
      bridgeMat
    } = sceneData

    sceneRef.current = scene

    // Setup input handling
    setupInput(scene, player, sceneData.gameState)

    // Setup game logic
    setupGameLogic(
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
      bridgeMat,
      sceneData.gameState
    )

    // Handle custom events from game logic
    const handleGameOver = () => showGameOver()
    const handleBrickCountUpdate = (event) => updateHUD(event.detail)

    window.addEventListener('gameOver', handleGameOver)
    window.addEventListener('brickCountUpdate', handleBrickCountUpdate)

    // Start render loop
    const renderLoop = () => {
      scene.render()
    }
    engine.runRenderLoop(renderLoop)

    // Handle resize
    const handleResize = () => {
      engine.resize()
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      engine.stopRenderLoop(renderLoop)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('gameOver', handleGameOver)
      window.removeEventListener('brickCountUpdate', handleBrickCountUpdate)
      scene.dispose()
      engine.dispose()
    }
  }, [updateHUD, showGameOver])

  return (
    <canvas 
      ref={canvasRef}
      id="renderCanvas"
      style={{
        width: '100vw',
        height: '100vh',
        display: 'block',
        outline: 'none'
      }}
    />
  )
})

GameCanvas.displayName = 'GameCanvas'

export default GameCanvas
