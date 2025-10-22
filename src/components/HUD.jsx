import React, { memo } from 'react'
import { useGame } from '../context/GameContext'

const HUD = memo(() => {
  const { brickCount } = useGame()

  return (
    <div className="hud">
      <div className="hud-item">
        Bricks: <span id="brickCount">{brickCount}</span>
      </div>
      <div className="hud-item small">
        WASD/Arrows to move, Space to auto-build
      </div>
    </div>
  )
})

HUD.displayName = 'HUD'

export default HUD

