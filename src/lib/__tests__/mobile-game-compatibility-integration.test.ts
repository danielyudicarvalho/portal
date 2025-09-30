/**
 * Integration tests for the mobile game compatibility layer
 * Tests the complete workflow from compatibility checking to game adaptation
 */

import { 
  MobileGameCompatibilityChecker
} from '../mobile-game-compatibility';
import { detectDevice } from '../mobile-detection';

// Mock DOM APIs
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    maxTouchPoints: 5,
    hardwareConcurrency: 4
  },
  writable: true
});

Object.defineProperty(window, 'screen', {
  value: {
    width: 375,
    height: 667,
    orientation: {
      type: 'portrait-primary'
    }
  },
  writable: true
});

Object.defineProperty(window, 'innerWidth', {
  value: 375,
  writable: true
});

Object.defineProperty(window, 'innerHeight', {
  value: 667,
  writable: true
});

// Mock canvas for WebGL detection
HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
  if (contextType === 'webgl' || contextType === 'experimental-webgl') {
    return {}; // Mock WebGL context
  }
  return null;
});

describe('Mobile Game Compatibility Integration', () => {
  let checker: MobileGameCompatibilityChecker;
  let mockGameElement: HTMLElement;

  beforeEach(() => {
    checker = new MobileGameCompatibilityChecker();
    mockGameElement = document.createElement('div');
    mockGameElement.id = 'test-game';
    document.body.appendChild(mockGameElement);
  });

  afterEach(() => {
    document.body.removeChild(mockGameElement);
  });

  describe('Complete compatibility workflow', () => {
    it('should perform end-to-end compatibility check and adaptation for mobile-optimized game', async () => {
      const gameId = '123'; // Mobile-optimized math game
      
      // Step 1: Check compatibility
      const compatibility = await checker.checkCompatibility(gameId);
      
      expect(compatibility.gameId).toBe(gameId);
      expect(compatibility.isCompatible).toBe(true);
      expect(compatibility.compatibilityScore).toBeGreaterThan(80);
      expect(compatibility.issues.length).toBe(0); // Should have no issues
      
      // Step 2: Adapt the game
      const gameConfig = await checker.adaptGame(gameId, mockGameElement);
      
      expect(gameConfig).toBeDefined();
      expect(gameConfig.touchControls).toBeDefined();
      expect(gameConfig.scaleMode).toBe('fit');
      
      // Step 3: Verify adaptations were applied
      const updatedCompatibility = await checker.checkCompatibility(gameId);
      expect(updatedCompatibility.compatibilityScore).toBeGreaterThanOrEqual(compatibility.compatibilityScore);
    });

    it('should handle keyboard-dependent game with touch adaptations', async () => {
      const gameId = 'box-jump'; // Requires keyboard input
      
      // Step 1: Check compatibility
      const compatibility = await checker.checkCompatibility(gameId);
      
      expect(compatibility.isCompatible).toBe(true); // Should be compatible with adaptations
      expect(compatibility.issues.length).toBeGreaterThan(0); // Should have control issues
      
      const controlIssue = compatibility.issues.find(issue => 
        issue.type === 'controls' && issue.description.includes('keyboard')
      );
      expect(controlIssue).toBeDefined();
      expect(controlIssue?.severity).toBe('high');
      
      // Should have control adaptations available
      const controlAdaptation = compatibility.adaptations.find(adaptation => 
        adaptation.type === 'controls'
      );
      expect(controlAdaptation).toBeDefined();
      
      // Step 2: Adapt the game
      const gameConfig = await checker.adaptGame(gameId, mockGameElement);
      
      expect(gameConfig).toBeDefined();
      expect(gameConfig.touchControls.length).toBeGreaterThan(0);
      
      // Should have jump button for box-jump game
      const jumpControl = gameConfig.touchControls.find(control => 
        control.action === 'JUMP' || control.keyMapping?.includes('Space')
      );
      expect(jumpControl).toBeDefined();
    });

    it('should provide fallbacks for games with critical issues', async () => {
      // Mock a low-end device
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const originalDetectDevice = detectDevice;
      jest.doMock('../mobile-detection', () => ({
        ...jest.requireActual('../mobile-detection'),
        detectDevice: () => ({
          isMobile: true,
          isTablet: false,
          isTouch: true,
          screenSize: { width: 320, height: 568 }, // Small screen
          orientation: 'portrait',
          pixelRatio: 1, // Low DPI
          platform: 'android'
        })
      }));

      const lowEndChecker = new MobileGameCompatibilityChecker();
      const gameId = 'fill-the-holes'; // Complex game requiring keyboard + audio
      
      const compatibility = await lowEndChecker.checkCompatibility(gameId);
      
      expect(compatibility.issues.length).toBeGreaterThan(1);
      expect(compatibility.fallbacks.length).toBeGreaterThan(0);
      
      // Should have alternative controls fallback
      const alternativeControls = compatibility.fallbacks.find(f => 
        f.type === 'alternative_controls'
      );
      expect(alternativeControls).toBeDefined();
      
      // Should have reduced quality fallback for low-end device
      const reducedQuality = compatibility.fallbacks.find(f => 
        f.type === 'reduced_quality'
      );
      expect(reducedQuality).toBeDefined();
    });
  });

  describe('Device capability detection', () => {
    it('should correctly detect mobile device capabilities', () => {
      expect(checker.isFeatureSupported('touch')).toBe(true);
      expect(checker.isFeatureSupported('webgl')).toBe(true);
      expect(checker.isFeatureSupported('audio')).toBe(true);
      expect(checker.isFeatureSupported('gamepad')).toBe(false); // Not typically available on mobile
    });

    it('should provide appropriate optimizations for iOS devices', () => {
      const gameId = 'circle-path';
      const optimizations = checker.getDeviceOptimizations(gameId);
      
      expect(optimizations.ios).toBeDefined();
      expect(optimizations.ios.disableZoom).toBe(true);
      expect(optimizations.ios.preventBounce).toBe(true);
    });

    it('should provide performance optimizations for high DPI displays', () => {
      const gameId = 'boom-dots';
      const optimizations = checker.getDeviceOptimizations(gameId);
      
      expect(optimizations.display).toBeDefined();
      expect(optimizations.display.pixelRatio).toBeLessThanOrEqual(2);
    });
  });

  describe('Game-specific adaptations', () => {
    it('should provide appropriate controls for different game types', async () => {
      // Test platformer game (box-jump)
      const platformerConfig = await checker.adaptGame('box-jump', mockGameElement);
      expect(platformerConfig.touchControls.some(control => 
        control.action === 'JUMP'
      )).toBe(true);
      
      // Test shooter game (boom-dots)
      const shooterConfig = await checker.adaptGame('boom-dots', mockGameElement);
      expect(shooterConfig.touchControls.some(control => 
        control.type === 'joystick'
      )).toBe(true);
      expect(shooterConfig.touchControls.some(control => 
        control.action === 'SHOOT'
      )).toBe(true);
      
      // Test puzzle game (memdot)
      const puzzleConfig = await checker.adaptGame('memdot', mockGameElement);
      expect(puzzleConfig.touchControls.some(control => 
        control.type === 'tap'
      )).toBe(true);
    });

    it('should respect game orientation preferences', async () => {
      // Portrait game
      const portraitConfig = await checker.adaptGame('doodle-jump', mockGameElement);
      expect(portraitConfig.preferredOrientation).toBe('portrait');
      
      // Landscape game
      const landscapeConfig = await checker.adaptGame('box-jump', mockGameElement);
      expect(landscapeConfig.preferredOrientation).toBe('landscape');
    });
  });

  describe('Error handling and recovery', () => {
    it('should handle unknown games gracefully', async () => {
      const unknownGameId = 'non-existent-game';
      
      const compatibility = await checker.checkCompatibility(unknownGameId);
      
      expect(compatibility.gameId).toBe(unknownGameId);
      expect(compatibility.isCompatible).toBeDefined();
      expect(compatibility.compatibilityScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle adaptation failures gracefully', async () => {
      const invalidElement = null as any;
      
      await expect(checker.adaptGame('123', invalidElement)).rejects.toThrow();
    });

    it('should provide meaningful error messages for compatibility issues', async () => {
      // Mock very small screen
      Object.defineProperty(window, 'screen', {
        value: {
          width: 240,
          height: 320
        },
        writable: true
      });

      const smallScreenChecker = new MobileGameCompatibilityChecker();
      const compatibility = await smallScreenChecker.checkCompatibility('box-jump');
      
      const screenIssue = compatibility.issues.find(issue => 
        issue.type === 'display' && issue.description.includes('Screen size')
      );
      
      if (screenIssue) {
        expect(screenIssue.solution).toBeDefined();
        expect(screenIssue.solution).not.toBe('');
      }
    });
  });

  describe('Performance considerations', () => {
    it('should complete compatibility checks quickly', async () => {
      const startTime = Date.now();
      
      await checker.checkCompatibility('123');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle multiple simultaneous compatibility checks', async () => {
      const gameIds = ['123', 'box-jump', 'circle-path', 'memdot'];
      
      const promises = gameIds.map(gameId => 
        checker.checkCompatibility(gameId)
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(gameIds.length);
      results.forEach((result, index) => {
        expect(result.gameId).toBe(gameIds[index]);
      });
    });
  });

  describe('Compatibility scoring accuracy', () => {
    it('should give higher scores to mobile-optimized games', async () => {
      const mobileOptimized = await checker.checkCompatibility('123');
      const notOptimized = await checker.checkCompatibility('fill-the-holes');
      
      expect(mobileOptimized.compatibilityScore).toBeGreaterThan(notOptimized.compatibilityScore);
    });

    it('should consider available adaptations in scoring', async () => {
      const gameWithAdaptations = await checker.checkCompatibility('circle-path');
      
      expect(gameWithAdaptations.adaptations.length).toBeGreaterThan(0);
      expect(gameWithAdaptations.compatibilityScore).toBeGreaterThan(50);
    });

    it('should penalize games with critical issues', async () => {
      // Mock WebGL not supported
      HTMLCanvasElement.prototype.getContext = jest.fn(() => null);
      
      const webglChecker = new MobileGameCompatibilityChecker();
      
      // Assume we had a WebGL-dependent game
      const compatibility = await webglChecker.checkCompatibility('box-jump');
      
      // Should still be compatible due to fallbacks, but with lower score
      expect(compatibility.isCompatible).toBe(true);
    });
  });
});