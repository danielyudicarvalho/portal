/**
 * TouchInputAdapter - Handles game control conversion and touch gesture recognition
 * for mobile PWA gaming experience
 */

export interface TouchControlConfig {
  type: 'button' | 'joystick' | 'swipe' | 'tap';
  position: { x: number; y: number };
  size: { width: number; height: number };
  keyMapping?: string[];
  action?: string;
  sensitivity?: number;
}

export interface GameConfig {
  width: number;
  height: number;
  scaleMode: 'fit' | 'fill' | 'stretch';
  touchControls: TouchControlConfig[];
  preferredOrientation?: 'portrait' | 'landscape' | 'any';
  minScreenSize?: { width: number; height: number };
}

export interface ViewportConfig {
  width: number;
  height: number;
  scale: number;
  orientation: 'portrait' | 'landscape';
}

export class TouchInputAdapter {
  private gameElement: HTMLElement | null = null;
  private touchControls: Map<string, TouchControlConfig> = new Map();
  private activeGestures: Map<number, TouchEvent> = new Map();
  private viewportConfig: ViewportConfig | null = null;
  private orientationChangeHandler: (() => void) | null = null;

  constructor() {
    this.handleOrientationChange = this.handleOrientationChange.bind(this);
  }

  /**
   * Adapts keyboard controls to touch-friendly alternatives
   */
  adaptKeyboardControls(gameElement: HTMLElement, gameConfig: GameConfig): void {
    this.gameElement = gameElement;
    this.clearExistingControls();

    // Create touch control overlays based on game configuration
    gameConfig.touchControls.forEach((control, index) => {
      this.createTouchControl(control, `control-${index}`);
    });

    // Set up viewport optimization
    this.optimizeViewport(gameConfig);
  }

  /**
   * Enables touch gesture recognition for game interactions
   */
  enableTouchGestures(gameElement: HTMLElement): void {
    if (!gameElement) return;

    // Remove existing touch listeners
    this.removeTouchListeners(gameElement);

    // Add touch event listeners
    gameElement.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    gameElement.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    gameElement.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    gameElement.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });

    // Prevent default touch behaviors that interfere with games
    gameElement.style.touchAction = 'none';
    gameElement.style.userSelect = 'none';
  }

  /**
   * Handles device orientation changes
   */
  handleOrientationChange(): void {
    if (!this.gameElement || !this.viewportConfig) return;

    // Wait for orientation change to complete
    setTimeout(() => {
      this.updateViewportForOrientation();
      this.repositionTouchControls();
    }, 100);
  }

  /**
   * Optimizes viewport for different screen sizes and orientations
   */
  optimizeViewport(gameConfig: GameConfig): void {
    const viewport = this.calculateOptimalViewport(gameConfig);
    this.viewportConfig = viewport;
    this.applyViewportSettings(viewport);

    // Set up orientation change listener
    if (this.orientationChangeHandler) {
      window.removeEventListener('orientationchange', this.orientationChangeHandler);
    }
    this.orientationChangeHandler = this.handleOrientationChange;
    window.addEventListener('orientationchange', this.orientationChangeHandler);
    window.addEventListener('resize', this.orientationChangeHandler);
  }

  /**
   * Creates a touch control overlay element
   */
  private createTouchControl(control: TouchControlConfig, id: string): void {
    if (!this.gameElement) return;

    const controlElement = document.createElement('div');
    controlElement.id = id;
    controlElement.className = 'touch-control';
    controlElement.style.cssText = `
      position: absolute;
      left: ${control.position.x}px;
      top: ${control.position.y}px;
      width: ${control.size.width}px;
      height: ${control.size.height}px;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-radius: 8px;
      touch-action: none;
      user-select: none;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: white;
      pointer-events: auto;
    `;

    // Add control type specific styling and behavior
    this.setupControlBehavior(controlElement, control);

    // Store control configuration
    this.touchControls.set(id, control);

    // Add to game element
    this.gameElement.appendChild(controlElement);
  }

  /**
   * Sets up behavior for different control types
   */
  private setupControlBehavior(element: HTMLElement, control: TouchControlConfig): void {
    switch (control.type) {
      case 'button':
        element.textContent = control.action || 'TAP';
        element.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.simulateKeyPress(control.keyMapping?.[0] || 'Space');
          element.style.background = 'rgba(255, 255, 255, 0.4)';
        });
        element.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.simulateKeyRelease(control.keyMapping?.[0] || 'Space');
          element.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        break;

      case 'joystick':
        this.setupJoystickControl(element, control);
        break;

      case 'swipe':
        this.setupSwipeControl(element, control);
        break;

      case 'tap':
        element.textContent = control.action || 'TAP';
        element.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.handleTapGesture(control);
        });
        break;
    }
  }

  /**
   * Sets up joystick control behavior
   */
  private setupJoystickControl(element: HTMLElement, control: TouchControlConfig): void {
    element.innerHTML = '<div class="joystick-knob" style="width: 30px; height: 30px; background: rgba(255,255,255,0.6); border-radius: 50%; position: relative;"></div>';
    
    let isDragging = false;
    let startPos = { x: 0, y: 0 };
    const knob = element.querySelector('.joystick-knob') as HTMLElement;

    element.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isDragging = true;
      const touch = e.touches[0];
      const rect = element.getBoundingClientRect();
      startPos = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    });

    element.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      
      const touch = e.touches[0];
      const rect = element.getBoundingClientRect();
      const currentPos = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };

      const deltaX = currentPos.x - startPos.x;
      const deltaY = currentPos.y - startPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = Math.min(control.size.width, control.size.height) / 2 - 15;

      if (distance <= maxDistance) {
        knob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      }

      // Simulate directional key presses based on joystick position
      this.handleJoystickInput(deltaX, deltaY, control);
    });

    element.addEventListener('touchend', (e) => {
      e.preventDefault();
      isDragging = false;
      knob.style.transform = 'translate(0px, 0px)';
      this.releaseAllDirectionalKeys(control);
    });
  }

  /**
   * Sets up swipe control behavior
   */
  private setupSwipeControl(element: HTMLElement, control: TouchControlConfig): void {
    element.textContent = 'SWIPE';
    
    let startPos = { x: 0, y: 0 };
    let startTime = 0;

    element.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      startPos = { x: touch.clientX, y: touch.clientY };
      startTime = Date.now();
    });

    element.addEventListener('touchend', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const endPos = { x: touch.clientX, y: touch.clientY };
      const endTime = Date.now();

      const deltaX = endPos.x - startPos.x;
      const deltaY = endPos.y - startPos.y;
      const deltaTime = endTime - startTime;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Detect swipe gesture
      if (distance > 50 && deltaTime < 300) {
        const direction = this.getSwipeDirection(deltaX, deltaY);
        this.handleSwipeGesture(direction, control);
      }
    });
  }

  /**
   * Handles touch start events
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    
    Array.from(event.changedTouches).forEach(touch => {
      this.activeGestures.set(touch.identifier, event);
    });
  }

  /**
   * Handles touch move events
   */
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    
    Array.from(event.changedTouches).forEach(touch => {
      if (this.activeGestures.has(touch.identifier)) {
        // Update gesture tracking
        this.activeGestures.set(touch.identifier, event);
      }
    });
  }

  /**
   * Handles touch end events
   */
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    
    Array.from(event.changedTouches).forEach(touch => {
      this.activeGestures.delete(touch.identifier);
    });
  }

  /**
   * Handles touch cancel events
   */
  private handleTouchCancel(event: TouchEvent): void {
    event.preventDefault();
    
    Array.from(event.changedTouches).forEach(touch => {
      this.activeGestures.delete(touch.identifier);
    });
  }

  /**
   * Calculates optimal viewport configuration
   */
  private calculateOptimalViewport(gameConfig: GameConfig): ViewportConfig {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const isLandscape = screenWidth > screenHeight;

    let scale = 1;
    let width = gameConfig.width;
    let height = gameConfig.height;

    switch (gameConfig.scaleMode) {
      case 'fit':
        scale = Math.min(screenWidth / width, screenHeight / height);
        break;
      case 'fill':
        scale = Math.max(screenWidth / width, screenHeight / height);
        break;
      case 'stretch':
        width = screenWidth;
        height = screenHeight;
        scale = 1;
        break;
    }

    return {
      width: width * scale,
      height: height * scale,
      scale,
      orientation: isLandscape ? 'landscape' : 'portrait'
    };
  }

  /**
   * Applies viewport settings to the game element
   */
  private applyViewportSettings(viewport: ViewportConfig): void {
    if (!this.gameElement) return;

    this.gameElement.style.cssText += `
      width: ${viewport.width}px;
      height: ${viewport.height}px;
      transform: scale(${viewport.scale});
      transform-origin: center center;
      position: relative;
      margin: 0 auto;
    `;

    // Update viewport meta tag
    this.updateViewportMetaTag();
  }

  /**
   * Updates viewport meta tag for optimal mobile display
   */
  private updateViewportMetaTag(): void {
    let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }

    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
  }

  /**
   * Updates viewport when orientation changes
   */
  private updateViewportForOrientation(): void {
    if (!this.gameElement || !this.viewportConfig) return;

    const newViewport = this.calculateOptimalViewport({
      width: this.viewportConfig.width / this.viewportConfig.scale,
      height: this.viewportConfig.height / this.viewportConfig.scale,
      scaleMode: 'fit',
      touchControls: []
    });

    this.viewportConfig = newViewport;
    this.applyViewportSettings(newViewport);
  }

  /**
   * Repositions touch controls after orientation change
   */
  private repositionTouchControls(): void {
    this.touchControls.forEach((control, id) => {
      const element = document.getElementById(id);
      if (element) {
        // Recalculate positions based on new viewport
        const newX = (control.position.x / this.viewportConfig!.width) * window.innerWidth;
        const newY = (control.position.y / this.viewportConfig!.height) * window.innerHeight;
        
        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;
      }
    });
  }

  /**
   * Simulates keyboard key press
   */
  private simulateKeyPress(key: string): void {
    const event = new KeyboardEvent('keydown', {
      key,
      code: key,
      bubbles: true,
      cancelable: true
    });
    
    if (this.gameElement) {
      this.gameElement.dispatchEvent(event);
    } else {
      document.dispatchEvent(event);
    }
  }

  /**
   * Simulates keyboard key release
   */
  private simulateKeyRelease(key: string): void {
    const event = new KeyboardEvent('keyup', {
      key,
      code: key,
      bubbles: true,
      cancelable: true
    });
    
    if (this.gameElement) {
      this.gameElement.dispatchEvent(event);
    } else {
      document.dispatchEvent(event);
    }
  }

  /**
   * Handles joystick input and converts to directional keys
   */
  private handleJoystickInput(deltaX: number, deltaY: number, control: TouchControlConfig): void {
    const threshold = 20;
    const keys = control.keyMapping || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

    // Release all directional keys first
    this.releaseAllDirectionalKeys(control);

    // Press keys based on joystick position
    if (Math.abs(deltaY) > threshold) {
      if (deltaY < 0) this.simulateKeyPress(keys[0]); // Up
      if (deltaY > 0) this.simulateKeyPress(keys[1]); // Down
    }
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0) this.simulateKeyPress(keys[2]); // Left
      if (deltaX > 0) this.simulateKeyPress(keys[3]); // Right
    }
  }

  /**
   * Releases all directional keys for joystick
   */
  private releaseAllDirectionalKeys(control: TouchControlConfig): void {
    const keys = control.keyMapping || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    keys.forEach(key => this.simulateKeyRelease(key));
  }

  /**
   * Gets swipe direction from delta values
   */
  private getSwipeDirection(deltaX: number, deltaY: number): string {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  /**
   * Handles swipe gestures
   */
  private handleSwipeGesture(direction: string, control: TouchControlConfig): void {
    const keyMap: { [key: string]: string } = {
      up: control.keyMapping?.[0] || 'ArrowUp',
      down: control.keyMapping?.[1] || 'ArrowDown',
      left: control.keyMapping?.[2] || 'ArrowLeft',
      right: control.keyMapping?.[3] || 'ArrowRight'
    };

    const key = keyMap[direction];
    if (key) {
      this.simulateKeyPress(key);
      setTimeout(() => this.simulateKeyRelease(key), 100);
    }
  }

  /**
   * Handles tap gestures
   */
  private handleTapGesture(control: TouchControlConfig): void {
    const key = control.keyMapping?.[0] || 'Space';
    this.simulateKeyPress(key);
    setTimeout(() => this.simulateKeyRelease(key), 100);
  }

  /**
   * Removes existing touch listeners
   */
  private removeTouchListeners(element: HTMLElement): void {
    element.removeEventListener('touchstart', this.handleTouchStart);
    element.removeEventListener('touchmove', this.handleTouchMove);
    element.removeEventListener('touchend', this.handleTouchEnd);
    element.removeEventListener('touchcancel', this.handleTouchCancel);
  }

  /**
   * Clears existing touch controls
   */
  private clearExistingControls(): void {
    this.touchControls.forEach((_, id) => {
      const element = document.getElementById(id);
      if (element) {
        element.remove();
      }
    });
    this.touchControls.clear();
  }

  /**
   * Cleanup method to remove all listeners and controls
   */
  cleanup(): void {
    if (this.gameElement) {
      this.removeTouchListeners(this.gameElement);
    }
    
    if (this.orientationChangeHandler) {
      window.removeEventListener('orientationchange', this.orientationChangeHandler);
      window.removeEventListener('resize', this.orientationChangeHandler);
    }

    this.clearExistingControls();
    this.activeGestures.clear();
    this.gameElement = null;
    this.viewportConfig = null;
  }
}

// Singleton instance (client-side only)
let touchInputAdapterInstance: TouchInputAdapter | null = null;

export const getTouchInputAdapter = (): TouchInputAdapter => {
  if (typeof window === 'undefined') {
    // Return a mock instance for SSR
    return {
      adaptKeyboardControls: () => {},
      adaptMouseControls: () => {},
      enableTouchControls: () => {},
      disableTouchControls: () => {},
      getTouchControlsStatus: () => ({ enabled: false, adaptedControls: [] }),
      clearTouchControls: () => {},
    } as any;
  }
  
  if (!touchInputAdapterInstance) {
    touchInputAdapterInstance = new TouchInputAdapter();
  }
  return touchInputAdapterInstance;
};

// Export the getter function instead of a direct instance
export { getTouchInputAdapter as touchInputAdapter };