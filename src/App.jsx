import React, { useState, useCallback, useMemo } from 'react'
import { GameProvider } from './context/GameContext'
import GameCanvas from './components/GameCanvas'
import HUD from './components/HUD'
import GameOverModal from './components/GameOverModal'
import './App.css'

function App() {
  const [gameOver, setGameOver] = useState(false)
  const [brickCount, setBrickCount] = useState(0)

  const handleGameOver = useCallback(() => {
    setGameOver(true)
  }, [])

  const handleRestart = useCallback(() => {
    setGameOver(false)
    setBrickCount(0)
    // The game will restart when the canvas re-mounts
  }, [])

  const gameContextValue = useMemo(() => ({
    brickCount,
    setBrickCount,
    gameOver,
    setGameOver: handleGameOver,
    restart: handleRestart
  }), [brickCount, handleGameOver, handleRestart])

  return (
    <GameProvider value={gameContextValue}>
      <div className="app">
        <HUD />
        <GameCanvas />
        {gameOver && <GameOverModal />}
      </div>
    </GameProvider>
  )
}

export default App
