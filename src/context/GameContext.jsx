import React, { createContext, useContext } from 'react'

const GameContext = createContext()

export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

export const GameProvider = ({ value, children }) => {
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}

