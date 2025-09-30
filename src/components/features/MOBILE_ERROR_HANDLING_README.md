# Mobile Error Handling System

This system provides comprehensive error handling specifically designed for mobile PWA gaming experiences. It includes three main components that work together to provide robust error recovery and user feedback.

## Components Overview

### 1. MobileErrorBoundary
A React error boundary specifically designed for mobile gaming contexts.

**Features:**
- Catches JavaScript errors in component trees
- Provides mobile-optimized error UI
- Automatic retry functionality with attempt limits
- Game-specific error messages
- Error logging to localStorage for debugging
- Development mode error details

**Usage:**
```tsx
import { MobileErrorBoundary } from '@/components/features';

<MobileErrorBoundary
  gameId="your-game-id"
  onError={(error, errorInfo) => {
    // Custom error handling
  }}
>
  <YourGameComponent />
</MobileErrorBoundary>
```

### 2. OfflineErrorHandler
Handles network connectivity issues and provides offline game alternatives.

**Features:**
- Detects offline/online status
- Shows available offline games
- Network error classification (fetch, timeout, etc.)
- Retry functionality with attempt tracking
- Connection status indicator
- Offline game selection

**Usage:**
```tsx
import { OfflineErrorHandler } from '@/components/features';

<OfflineErrorHandler
  error={networkError}
  gameId="current-game"
  onRetry={() => {
    // Retry logic
  }}
  onOfflineGameSelect={(gameId) => {
    // Navigate to offline game
  }}
/>
```

### 3. TouchInputErrorRecovery
Monitors and recovers from touch input issues on mobile devices.

**Features:**
- Touch input error detection
- Automatic calibration system
- Orientation change handling
- Touch responsiveness monitoring
- Recovery workflow with progress indication
- Fallback control modes

**Usage:**
```tsx
import { TouchInputErrorRecovery } from '@/components/features';

<TouchInputErrorRecovery
  gameElement={gameElementRef.current}
  gameId="your-game"
  onRecoveryComplete={() => {
    // Recovery completed
  }}
  onFallbackMode={() => {
    // Enable simplified controls
  }}
/>
```

### 4. MobileErrorHandler (Comprehensive Wrapper)
Combines all error handling components into a single, easy-to-use wrapper.

**Features:**
- Integrates all error handling types
- Automatic error type detection
- Unified error reporting
- Single component setup

**Usage:**
```tsx
import { MobileErrorHandler } from '@/components/features';

<MobileErrorHandler
  gameId="your-game-id"
  gameElement={gameElementRef.current}
  onError={(error, context) => {
    console.log('Error:', error.message, 'Context:', context);
  }}
  onRecovery={() => {
    console.log('Recovery completed');
  }}
>
  <YourGameComponent />
</MobileErrorHandler>
```

## Error Types Handled

### 1. Component Errors
- JavaScript runtime errors
- React component lifecycle errors
- Rendering errors
- State management errors

### 2. Network Errors
- Offline connectivity issues
- API request failures
- Timeout errors
- Resource loading failures

### 3. Touch Input Errors
- Touch calibration issues
- Unresponsive touch events
- Gesture recognition failures
- Orientation change problems

## Error Recovery Strategies

### Automatic Recovery
1. **Retry with Backoff**: Automatic retry with increasing delays
2. **Touch Calibration**: Multi-point touch calibration system
3. **Viewport Reset**: Automatic viewport and layout recalculation
4. **Control Reinitialization**: Touch control system restart

### Manual Recovery Options
1. **Simplified Controls**: Fallback to basic touch controls
2. **Offline Mode**: Switch to cached/offline games
3. **Page Reload**: Full page refresh as last resort
4. **Navigation**: Return to game selection or home

## Integration with PWA Features

### Offline Support
- Integrates with `useOfflineGames` hook
- Shows available cached games
- Handles cache miss scenarios
- Provides offline indicators

### PWA State Management
- Uses `usePWAOfflineState` for connectivity
- Respects PWA installation status
- Handles PWA-specific errors

### Performance Monitoring
- Tracks error frequency
- Monitors recovery success rates
- Provides debugging information
- Stores error logs locally

## Best Practices

### 1. Error Boundary Placement
```tsx
// ✅ Good: Wrap individual games
<MobileErrorBoundary gameId="specific-game">
  <GameComponent />
</MobileErrorBoundary>

// ❌ Avoid: Wrapping entire app (too broad)
<MobileErrorBoundary>
  <EntireApp />
</MobileErrorBoundary>
```

### 2. Touch Error Monitoring
```tsx
// ✅ Good: Pass game element reference
const gameRef = useRef<HTMLDivElement>(null);

<TouchInputErrorRecovery
  gameElement={gameRef.current}
  gameId="touch-game"
>
  <div ref={gameRef}>
    <TouchGame />
  </div>
</TouchInputErrorRecovery>
```

### 3. Error Reporting
```tsx
// ✅ Good: Implement custom error handling
<MobileErrorHandler
  onError={(error, context) => {
    // Log to analytics
    analytics.track('mobile_error', {
      error: error.message,
      context,
      gameId,
      userAgent: navigator.userAgent
    });
  }}
>
  <GameComponent />
</MobileErrorHandler>
```

### 4. Recovery Callbacks
```tsx
// ✅ Good: Handle recovery events
<MobileErrorHandler
  onRecovery={() => {
    // Reset game state
    resetGameState();
    // Track recovery success
    analytics.track('error_recovery_success');
  }}
>
  <GameComponent />
</MobileErrorHandler>
```

## Testing

### Unit Tests
Each component includes comprehensive unit tests covering:
- Error detection and handling
- Recovery workflows
- User interactions
- Edge cases and error conditions

### Integration Tests
Test the complete error handling flow:
- Error boundary → Offline handler integration
- Touch error → Recovery workflow
- Multiple error types simultaneously

### Manual Testing Checklist
- [ ] Test on various mobile devices
- [ ] Test different screen orientations
- [ ] Test offline/online transitions
- [ ] Test touch input on different games
- [ ] Test error recovery workflows
- [ ] Test fallback control modes

## Debugging

### Error Logs
Errors are stored in localStorage under the key `mobile-errors`:
```javascript
// Access error logs in browser console
const errors = JSON.parse(localStorage.getItem('mobile-errors') || '[]');
console.table(errors);
```

### Development Mode
In development mode, detailed error information is displayed:
- Full error stack traces
- Component stack information
- Error context and metadata

### Error Context
Each error includes contextual information:
- Game ID
- User agent
- Timestamp
- Error type and category
- Recovery attempt count

## Performance Considerations

### Memory Management
- Error logs are limited to last 10 entries
- Automatic cleanup of old error data
- Efficient event listener management

### Touch Event Optimization
- Passive event listeners where possible
- Debounced error detection
- Minimal DOM manipulation during recovery

### Network Efficiency
- Cached offline game detection
- Efficient retry strategies
- Minimal network requests during errors

## Browser Compatibility

### Supported Features
- Modern mobile browsers (iOS Safari, Chrome Mobile, Firefox Mobile)
- PWA capabilities (service workers, offline detection)
- Touch events and gesture recognition
- Local storage for error logging

### Fallbacks
- Graceful degradation for older browsers
- Alternative input methods when touch fails
- Basic error handling when advanced features unavailable

## Customization

### Styling
All components use Tailwind CSS classes and can be customized:
```tsx
<MobileErrorBoundary
  fallback={<CustomErrorComponent />}
>
  <GameComponent />
</MobileErrorBoundary>
```

### Error Messages
Error messages can be customized based on error type and context:
```tsx
const getCustomErrorMessage = (error: Error, gameId?: string) => {
  if (gameId === 'puzzle-game' && error.message.includes('timeout')) {
    return 'The puzzle is taking too long to load. Try again?';
  }
  return 'Something went wrong. Please try again.';
};
```

### Recovery Workflows
Custom recovery workflows can be implemented:
```tsx
<TouchInputErrorRecovery
  onRecoveryComplete={() => {
    // Custom recovery logic
    customRecoveryWorkflow();
  }}
  onFallbackMode={() => {
    // Custom fallback implementation
    enableCustomFallbackControls();
  }}
/>
```