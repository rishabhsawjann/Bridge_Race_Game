# Bridge Race Game - React + Babylon.js

A 3D bridge building game built with React and Babylon.js, featuring optimized performance and modern React patterns.

## 🚀 Features

- **React Integration**: Modern React components with hooks and context
- **3D Graphics**: Powered by Babylon.js for smooth 3D rendering
- **Performance Optimized**: Lazy loading, memoization, and performance monitoring
- **Responsive UI**: Clean HUD and game over modal
- **State Management**: React Context for game state management

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Babylon.js 8.30.2** - 3D graphics engine
- **Vite** - Build tool and dev server
- **ES6 Modules** - Modern JavaScript

## 📦 Installation

```bash
npm install
```

## 🎮 Running the Game

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## 🏗️ Architecture

### React Components
- `App.jsx` - Main application component with state management
- `GameCanvas.jsx` - Babylon.js integration with React
- `HUD.jsx` - Game UI display
- `GameOverModal.jsx` - Game over screen
- `PerformanceMonitor.jsx` - FPS and performance metrics

### Game Logic
- `src/game/gameState.js` - Game state management
- `src/game/sceneSetup.js` - 3D scene initialization
- `src/game/gameLogic.js` - Game mechanics and physics
- `src/game/input.js` - Keyboard input handling

### Context & State
- `src/context/GameContext.jsx` - React Context for state management

## ⚡ Performance Optimizations

1. **Lazy Loading**: Game canvas loads asynchronously
2. **Memoization**: React.memo for component optimization
3. **Event-driven Architecture**: Custom events for game state updates
4. **Performance Monitoring**: Real-time FPS and frame time tracking
5. **Code Splitting**: Dynamic imports for better bundle management

## 🎯 Game Controls

- **WASD** or **Arrow Keys** - Move character
- **Space** - Manual bridge building (optional)

## 🔧 Development

The game uses modern React patterns:
- Functional components with hooks
- Context API for state management
- Custom events for game-Babylon.js communication
- Memoized components for performance
- Lazy loading for better initial load times

## 📊 Performance Features

- Real-time FPS monitoring (development mode)
- Optimized render loop
- Efficient state updates
- Memory management for 3D objects
- Responsive UI that doesn't block game rendering

## 🚀 Build Output

The build process creates optimized bundles:
- Main application bundle
- Babylon.js game logic (lazy loaded)
- CSS and assets
- Source maps for debugging

## 🎮 How to Play

1. Collect red spheres to get bricks
2. Move over the gap to automatically build bridge pieces
3. Reach the other platform to complete the level
4. Don't fall off the platforms or bridge!

## 🔄 Migration from Vanilla JS

This project was converted from vanilla JavaScript to React:
- ✅ React components for UI
- ✅ Context API for state management
- ✅ Optimized performance
- ✅ Modern build system
- ✅ Better code organization
- ✅ Lazy loading and code splitting