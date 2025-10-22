import React, { memo } from 'react'
import { useGame } from '../context/GameContext'

const GameOverModal = memo(() => {
  const { restart } = useGame()

  return (
    <div className="overlay">
      <div className="panel">
        <div className="title">Game Over</div>
        <button className="btn" onClick={restart}>
          Restart
        </button>
      </div>
    </div>
  )
})

GameOverModal.displayName = 'GameOverModal'

export default GameOverModal

