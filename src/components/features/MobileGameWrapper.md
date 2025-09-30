# MobileGameWrapper Component

The `MobileGameWrapper` component provides comprehensive mobile game support with touch controls, viewport management, and game scaling for the game portal. It builds upon the `TouchAdaptedGame` component to offer a complete mobile gaming solution.

## Features

- **Game Scaling**: Automatic scaling based on device viewport with multiple scale modes
- **Touch Controls**: Virtual touch controls for games that require keyboard input
- **Fullscreen Support**: Native fullscreen toggle for immersive gaming
- **Viewport Management**: Automatic viewport optimization for different screen sizes
- **Orientation Handling**: Responsive layout for portrait and landscape orientations
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Performance Optimization**: Efficient rendering and memory management for mobile devices

## Basic Usage

```tsx
import { MobileGameWrapper } from '@/components/features';

const gameConfig = {
  width: 800,
  height: 600,
  scaleMode: 'fit' as const,
  requiresKeyboard: true,
  supportsTouch: true,
  touchControls: [
    {
      id: 'jump',
      type: 'button' as const,
      position: { x: 650, y: 450 },
      size: { width: 80, height: 80 },
      keyMapping: ['Space'],
      label: 'Jump',
    },
  ],
};

export function MyGamePage() {
  return (
    <MobileGameWrapper
      gameId="my-game"
      gameConfig={gameConfig}
      onGameLoad={() => console.log('Game loaded')}
      onGameError={(error) => console.error('Game error:', error)}
    >
      <iframe src="/games/my-game/index.html" />
    </MobileGameWrapper>
  );
}
```

## Props

### MobileGameWrapperProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `gameId` | `string` | Yes | Unique identifier for the game |
| `gameConfig` | `GameConfig` | Yes | Game configuration object |
| `children` | `React.ReactNode` | Yes | Game content (iframe, canvas, etc.) |
| `onGameLoad` | `() => void` | No | Callback when game loads successfully |
| `onGameError` | `(error: Error) => void` | No | Callback when game encounters an error |
| `onFullscreenToggle` | `(isFullscreen: boolean) => void` | No | Callback when fullscreen is toggled |
| `className` | `string` | No | Additional CSS classes |

### GameConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `width` | `number` | Yes | Game canvas width in pixels |
| `height` | `number` | Yes | Game canvas height in pixels |
| `scaleMode` | `'fit' \| 'fill' \| 'stretch'` | Yes | How the game should scale to fit the viewport |
| `touchControls` | `TouchControlConfig[]` | Yes | Array of touch control configurations |
| `requiresKeyboard` | `boolean` | No | Whether the game requires keyboard input |
| `supportsTouch` | `boolean` | No | Whether the game supports native touch input |
| `minScreenSize` | `{ width: number; height: number }` | No | Minimum screen size requirements |
| `preferredOrientation` | `'portrait' \| 'landscape' \| 'any'` | No | Preferred device orientation |

### TouchControlConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for the control |
| `type` | `'button' \| 'joystick' \| 'dpad' \| 'swipe'` | Yes | Type of touch control |
| `position` | `{ x: number; y: number }` | Yes | Position relative to game canvas |
| `size` | `{ width: number; height: number }` | Yes | Size of the touch control |
| `keyMapping` | `string[]` | No | Keyboard keys to simulate when touched |
| `label` | `string` | No | Text label to display on the control |
| `icon` | `string` | No | Icon to display on the control |

## Scale Modes

### `fit` (Recommended)
Scales the game uniformly to fit within the viewport while maintaining aspect ratio. This is the most common choice as it ensures the entire game is visible without distortion.

```tsx
const gameConfig = {
  // ...
  scaleMode: 'fit' as const,
};
```

### `fill`
Scales the game uniformly to fill the viewport while maintaining aspect ratio. Parts of the game may be cropped if the aspect ratios don't match.

```tsx
const gameConfig = {
  // ...
  scaleMode: 'fill' as const,
};
```

### `stretch`
Stretches the game to fill the entire viewport. This may cause distortion if aspect ratios don't match, but ensures the game fills the screen completely.

```tsx
const gameConfig = {
  // ...
  scaleMode: 'stretch' as const,
};
```

## Touch Controls

The component supports various types of touch controls for games that require keyboard input:

### Button Controls
Simple tap buttons that simulate keyboard presses:

```tsx
{
  id: 'jump',
  type: 'button',
  position: { x: 650, y: 450 },
  size: { width: 80, height: 80 },
  keyMapping: ['Space', 'ArrowUp'],
  label: 'Jump',
}
```

### Directional Controls
For movement controls:

```tsx
{
  id: 'move-left',
  type: 'button',
  position: { x: 50, y: 450 },
  size: { width: 70, height: 70 },
  keyMapping: ['ArrowLeft', 'a'],
  label: '←',
}
```

## Examples

### Platformer Game
```tsx
const platformerConfig = {
  width: 800,
  height: 600,
  scaleMode: 'fit' as const,
  requiresKeyboard: true,
  touchControls: [
    {
      id: 'jump',
      type: 'button' as const,
      position: { x: 650, y: 450 },
      size: { width: 80, height: 80 },
      keyMapping: ['Space'],
      label: 'Jump',
    },
    {
      id: 'move-left',
      type: 'button' as const,
      position: { x: 50, y: 450 },
      size: { width: 70, height: 70 },
      keyMapping: ['ArrowLeft'],
      label: '←',
    },
    {
      id: 'move-right',
      type: 'button' as const,
      position: { x: 150, y: 450 },
      size: { width: 70, height: 70 },
      keyMapping: ['ArrowRight'],
      label: '→',
    },
  ],
  preferredOrientation: 'landscape' as const,
};
```

### Touch-Native Puzzle Game
```tsx
const puzzleConfig = {
  width: 600,
  height: 800,
  scaleMode: 'fit' as const,
  requiresKeyboard: false,
  supportsTouch: true,
  touchControls: [], // No virtual controls needed
  preferredOrientation: 'portrait' as const,
};
```

## Best Practices

1. **Choose the Right Scale Mode**: Use `fit` for most games to avoid distortion
2. **Position Touch Controls Carefully**: Place controls where thumbs naturally rest
3. **Test on Real Devices**: Always test on actual mobile devices, not just browser dev tools
4. **Consider Orientation**: Design controls that work in both portrait and landscape
5. **Provide Visual Feedback**: Ensure touch controls have clear pressed states
6. **Handle Errors Gracefully**: Always provide error callbacks for better user experience
7. **Optimize for Performance**: Use appropriate minimum screen size requirements

## Accessibility

The component includes several accessibility features:
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader compatibility
- High contrast touch controls
- Appropriate touch target sizes (minimum 44px)

## Browser Support

The component supports all modern mobile browsers:
- iOS Safari 12+
- Chrome Mobile 70+
- Firefox Mobile 68+
- Samsung Internet 10+

## Performance Considerations

- Touch controls are only rendered when needed
- Game scaling is optimized for 60fps performance
- Memory usage is monitored and optimized for mobile devices
- Efficient event handling to prevent performance issues