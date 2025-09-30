import { GameConfig, TouchControlConfig } from './touch-input-adapter';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isTouch: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  screenSize: { width: number; height: number };
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
  platform: string;
}

export interface GameAdaptationConfig {
  needsTouchControls: boolean;
  recommendedControls: TouchControlConfig[];
  viewportOptimization: 'fit' | 'fill' | 'stretch';
  preferredOrientation: 'portrait' | 'landscape' | 'any';
}

/**
 * Detects device capabilities and characteristics
 */
export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    // Return default values for SSR
    return {
      isMobile: false,
      isTablet: false,
      isTouch: false,
      deviceType: 'desktop',
      browser: 'unknown',
      platform: 'unknown',
      screenSize: { width: 1920, height: 1080 },
      orientation: 'landscape',
      pixelRatio: 1,
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
                   (screenWidth <= 768 && 'ontouchstart' in window);
  
  const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent) ||
                   (screenWidth >= 768 && screenWidth <= 1024 && 'ontouchstart' in window);
  
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';
  
  let platform = 'unknown';
  if (/android/i.test(userAgent)) platform = 'android';
  else if (/iphone|ipad|ipod/i.test(userAgent)) platform = 'ios';
  else if (/windows/i.test(userAgent)) platform = 'windows';
  else if (/mac/i.test(userAgent)) platform = 'mac';

  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (isMobile) deviceType = 'mobile';
  else if (isTablet) deviceType = 'tablet';

  let browser = 'unknown';
  if (/chrome/i.test(userAgent)) browser = 'chrome';
  else if (/firefox/i.test(userAgent)) browser = 'firefox';
  else if (/safari/i.test(userAgent)) browser = 'safari';
  else if (/edge/i.test(userAgent)) browser = 'edge';

  return {
    isMobile,
    isTablet,
    isTouch,
    deviceType,
    browser,
    screenSize: { width: screenWidth, height: screenHeight },
    orientation,
    pixelRatio: (typeof window !== 'undefined' ? window.devicePixelRatio : null) || 1,
    platform
  };
}

/**
 * Determines if a game needs touch adaptation based on device and game characteristics
 */
export function needsTouchAdaptation(gameId: string, deviceInfo: DeviceInfo): boolean {
  // Always adapt for mobile devices
  if (deviceInfo.isMobile || deviceInfo.isTablet) {
    return true;
  }
  
  // Adapt for touch-capable devices
  if (deviceInfo.isTouch) {
    return true;
  }
  
  return false;
}

/**
 * Gets recommended game configuration for mobile adaptation
 */
export function getGameAdaptationConfig(gameId: string, deviceInfo: DeviceInfo): GameAdaptationConfig {
  const baseConfig: GameAdaptationConfig = {
    needsTouchControls: needsTouchAdaptation(gameId, deviceInfo),
    recommendedControls: [],
    viewportOptimization: 'fit',
    preferredOrientation: 'any'
  };

  // Game-specific configurations
  switch (gameId) {
    case 'box-jump':
      return {
        ...baseConfig,
        recommendedControls: [
          {
            type: 'button',
            position: { x: deviceInfo.screenSize.width - 100, y: deviceInfo.screenSize.height - 100 },
            size: { width: 80, height: 80 },
            keyMapping: ['Space'],
            action: 'JUMP'
          }
        ],
        preferredOrientation: 'landscape'
      };

    case 'doodle-jump':
      return {
        ...baseConfig,
        recommendedControls: [
          {
            type: 'joystick',
            position: { x: 50, y: deviceInfo.screenSize.height - 150 },
            size: { width: 100, height: 100 },
            keyMapping: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
          }
        ],
        preferredOrientation: 'portrait'
      };

    case 'fill-the-holes':
      return {
        ...baseConfig,
        recommendedControls: [
          {
            type: 'swipe',
            position: { x: 0, y: 0 },
            size: { width: deviceInfo.screenSize.width, height: deviceInfo.screenSize.height },
            keyMapping: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
            sensitivity: 0.8
          }
        ],
        viewportOptimization: 'fill'
      };

    case 'circle-path':
      return {
        ...baseConfig,
        recommendedControls: [
          {
            type: 'tap',
            position: { x: 0, y: 0 },
            size: { width: deviceInfo.screenSize.width, height: deviceInfo.screenSize.height },
            keyMapping: ['Space'],
            action: 'TAP'
          }
        ],
        preferredOrientation: 'portrait'
      };

    case 'clocks':
      return {
        ...baseConfig,
        recommendedControls: [
          {
            type: 'tap',
            position: { x: 0, y: 0 },
            size: { width: deviceInfo.screenSize.width, height: deviceInfo.screenSize.height },
            keyMapping: ['Space'],
            action: 'STOP'
          }
        ]
      };

    case 'memdot':
      return {
        ...baseConfig,
        recommendedControls: [
          {
            type: 'tap',
            position: { x: 0, y: 0 },
            size: { width: deviceInfo.screenSize.width, height: deviceInfo.screenSize.height },
            keyMapping: ['Space'],
            action: 'SELECT'
          }
        ]
      };

    case 'boom-dots':
      return {
        ...baseConfig,
        recommendedControls: [
          {
            type: 'joystick',
            position: { x: 50, y: deviceInfo.screenSize.height - 150 },
            size: { width: 100, height: 100 },
            keyMapping: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
          },
          {
            type: 'button',
            position: { x: deviceInfo.screenSize.width - 100, y: deviceInfo.screenSize.height - 100 },
            size: { width: 80, height: 80 },
            keyMapping: ['Space'],
            action: 'SHOOT'
          }
        ],
        preferredOrientation: 'landscape'
      };

    case 'endless-scale':
      return {
        ...baseConfig,
        recommendedControls: [
          {
            type: 'button',
            position: { x: deviceInfo.screenSize.width / 2 - 40, y: deviceInfo.screenSize.height - 100 },
            size: { width: 80, height: 80 },
            keyMapping: ['Space'],
            action: 'HOLD'
          }
        ]
      };

    case '123':
      return {
        ...baseConfig,
        recommendedControls: [
          {
            type: 'tap',
            position: { x: 0, y: 0 },
            size: { width: deviceInfo.screenSize.width, height: deviceInfo.screenSize.height },
            keyMapping: ['Space'],
            action: 'SELECT'
          }
        ]
      };

    default:
      // Generic configuration for unknown games
      return {
        ...baseConfig,
        recommendedControls: [
          {
            type: 'joystick',
            position: { x: 50, y: deviceInfo.screenSize.height - 150 },
            size: { width: 100, height: 100 },
            keyMapping: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
          },
          {
            type: 'button',
            position: { x: deviceInfo.screenSize.width - 100, y: deviceInfo.screenSize.height - 100 },
            size: { width: 80, height: 80 },
            keyMapping: ['Space'],
            action: 'ACTION'
          }
        ]
      };
  }
}

/**
 * Creates a complete GameConfig from adaptation configuration
 */
export function createGameConfig(
  gameId: string,
  adaptationConfig: GameAdaptationConfig,
  gameWidth: number = 800,
  gameHeight: number = 600
): GameConfig {
  return {
    width: gameWidth,
    height: gameHeight,
    scaleMode: adaptationConfig.viewportOptimization,
    touchControls: adaptationConfig.recommendedControls,
    preferredOrientation: adaptationConfig.preferredOrientation,
    minScreenSize: { width: 320, height: 480 }
  };
}

/**
 * Checks if the current device meets minimum requirements for a game
 */
export function meetsMinimumRequirements(gameConfig: GameConfig, deviceInfo: DeviceInfo): boolean {
  if (!gameConfig.minScreenSize) return true;
  
  return deviceInfo.screenSize.width >= gameConfig.minScreenSize.width &&
         deviceInfo.screenSize.height >= gameConfig.minScreenSize.height;
}

/**
 * Gets CSS styles for touch control elements based on device
 */
export function getTouchControlStyles(deviceInfo: DeviceInfo): string {
  const baseSize = deviceInfo.isMobile ? 60 : 80;
  const opacity = deviceInfo.platform === 'ios' ? 0.3 : 0.2;
  
  return `
    .touch-control {
      min-width: ${baseSize}px;
      min-height: ${baseSize}px;
      background: rgba(255, 255, 255, ${opacity});
      border: 2px solid rgba(255, 255, 255, ${opacity + 0.2});
      border-radius: ${baseSize / 8}px;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      transition: all 0.1s ease;
    }
    
    .touch-control:active {
      background: rgba(255, 255, 255, ${opacity + 0.2});
      transform: scale(0.95);
    }
    
    .joystick-knob {
      background: rgba(255, 255, 255, 0.8);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: transform 0.1s ease;
    }
  `;
}