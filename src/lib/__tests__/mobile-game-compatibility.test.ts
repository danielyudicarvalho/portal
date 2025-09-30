import { 
  MobileGameCompatibilityChecker
} from '../mobile-game-compatibility';

// Mock the mobile detection module
jest.mock('../mobile-detection', () => ({
  detectDevice: jest.fn(() => ({
    isMobile: true,
    isTablet: false,
    isTouch: true,
    screenSize: { width: 375, height: 667 },
    orientation: 'portrait',
    pixelRatio: 2,
    platform: 'ios'
  })),
  getGameAdaptationConfig: jest.fn(() => ({
    needsTouchControls: true,
    recommendedControls: [
      {
        type: 'button',
        position: { x: 300, y: 500 },
        size: { width: 80, height: 80 },
        keyMapping: ['Space'],
        action: 'JUMP'
      }
    ],
    viewportOptimization: 'fit',
    preferredOrientation: 'portrait'
  })),
  createGameConfig: jest.fn(() => ({
    width: 800,
    height: 600,
    scaleMode: 'fit',
    touchControls: [],
    preferredOrientation: 'portrait',
    minScreenSize: { width: 320, height: 480 }
  })),
  meetsMinimumRequirements: jest.fn(() => true)
}));

// Mock the touch input adapter
jest.mock('../touch-input-adapter', () => ({
  TouchInputAdapter: jest.fn().mockImplementation(() => ({
    adaptKeyboardControls: jest.fn(),
    enableTouchGestures: jest.fn(),
    cleanup: jest.fn()
  }))
}));

describe('MobileGameCompatibilityChecker', () => {
  let checker: MobileGameCompatibilityChecker;

  beforeEach(() => {
    checker = new MobileGameCompatibilityChecker();
  });

  describe('checkCompatibility', () => {
    it('should return compatibility info for a known game', async () => {
      const result = await checker.checkCompatibility('123');
      
      expect(result).toBeDefined();
      expect(result.gameId).toBe('123');
      expect(result.isCompatible).toBeDefined();
      expect(result.compatibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.compatibilityScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.issues)).toBe(true);
      expect(Array.isArray(result.adaptations)).toBe(true);
      expect(Array.isArray(result.fallbacks)).toBe(true);
    });

    it('should return compatibility info for an unknown game', async () => {
      const result = await checker.checkCompatibility('unknown-game');
      
      expect(result).toBeDefined();
      expect(result.gameId).toBe('unknown-game');
      expect(result.isCompatible).toBeDefined();
    });

    it('should identify games that require keyboard input on mobile', async () => {
      const result = await checker.checkCompatibility('box-jump');
      
      const keyboardIssue = result.issues.find(issue => 
        issue.type === 'controls' && issue.description.includes('keyboard')
      );
      expect(keyboardIssue).toBeDefined();
      
      const controlAdaptation = result.adaptations.find(adaptation => 
        adaptation.type === 'controls'
      );
      expect(controlAdaptation).toBeDefined();
    });

    it('should calculate compatibility score correctly', async () => {
      const result = await checker.checkCompatibility('123');
      
      // Game 123 is mobile optimized, so should have high compatibility
      expect(result.compatibilityScore).toBeGreaterThan(80);
      expect(result.isCompatible).toBe(true);
    });

    it('should provide fallback mechanisms for incompatible features', async () => {
      const result = await checker.checkCompatibility('box-jump');
      
      expect(result.fallbacks.length).toBeGreaterThan(0);
      
      const alternativeControlsFallback = result.fallbacks.find(fallback => 
        fallback.type === 'alternative_controls'
      );
      expect(alternativeControlsFallback).toBeDefined();
    });
  });

  describe('adaptGame', () => {
    it('should adapt a game element for mobile', async () => {
      const mockElement = document.createElement('div');
      
      const result = await checker.adaptGame('123', mockElement);
      
      expect(result).toBeDefined();
      expect(result.width).toBeDefined();
      expect(result.height).toBeDefined();
      expect(result.scaleMode).toBeDefined();
    });

    it('should handle adaptation errors gracefully', async () => {
      const mockElement = null as any;
      
      await expect(checker.adaptGame('123', mockElement)).rejects.toThrow();
    });
  });

  describe('isFeatureSupported', () => {
    it('should correctly identify supported features', () => {
      expect(checker.isFeatureSupported('touch')).toBe(true);
      expect(checker.isFeatureSupported('webgl')).toBeDefined();
      expect(checker.isFeatureSupported('audio')).toBeDefined();
      expect(checker.isFeatureSupported('gamepad')).toBeDefined();
    });

    it('should return false for unsupported features', () => {
      expect(checker.isFeatureSupported('unknown-feature')).toBe(false);
    });
  });

  describe('getFallbackOptions', () => {
    it('should return fallback options for games requiring keyboard', () => {
      const fallbacks = checker.getFallbackOptions('box-jump');
      
      expect(Array.isArray(fallbacks)).toBe(true);
      
      const alternativeControls = fallbacks.find(f => f.type === 'alternative_controls');
      expect(alternativeControls).toBeDefined();
      expect(alternativeControls?.description).toContain('touch controls');
    });

    it('should return performance fallbacks for complex games', () => {
      const fallbacks = checker.getFallbackOptions('boom-dots');
      
      const reducedQuality = fallbacks.find(f => f.type === 'reduced_quality');
      expect(reducedQuality).toBeDefined();
    });

    it('should return offline fallbacks for supported games', () => {
      const fallbacks = checker.getFallbackOptions('123');
      
      const offlineMode = fallbacks.find(f => f.type === 'offline_mode');
      expect(offlineMode).toBeDefined();
    });
  });

  describe('getDeviceOptimizations', () => {
    it('should return device-specific optimizations', () => {
      const optimizations = checker.getDeviceOptimizations('123');
      
      expect(optimizations).toBeDefined();
      expect(typeof optimizations).toBe('object');
    });

    it('should include iOS-specific optimizations on iOS devices', () => {
      const optimizations = checker.getDeviceOptimizations('123');
      
      expect(optimizations.ios).toBeDefined();
      expect(optimizations.ios.disableZoom).toBe(true);
    });

    it('should include performance optimizations for low-end devices', () => {
      // Mock low-end device
      const originalDetectDevice = require('../mobile-detection').detectDevice;
      require('../mobile-detection').detectDevice.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isTouch: true,
        screenSize: { width: 320, height: 568 },
        orientation: 'portrait',
        pixelRatio: 1,
        platform: 'android'
      });

      const newChecker = new MobileGameCompatibilityChecker();
      const optimizations = newChecker.getDeviceOptimizations('box-jump');
      
      expect(optimizations.performance).toBeDefined();
      expect(optimizations.performance.maxFPS).toBe(30);
      
      // Restore original mock
      require('../mobile-detection').detectDevice = originalDetectDevice;
    });
  });

  describe('compatibility scoring', () => {
    it('should give high scores to mobile-optimized games', async () => {
      const result = await checker.checkCompatibility('123');
      expect(result.compatibilityScore).toBeGreaterThan(80);
    });

    it('should give lower scores to games with many issues', async () => {
      const result = await checker.checkCompatibility('fill-the-holes');
      
      // This game requires keyboard and audio, so should have lower score on mobile
      expect(result.compatibilityScore).toBeLessThan(80);
    });

    it('should consider adaptations in scoring', async () => {
      const result = await checker.checkCompatibility('circle-path');
      
      // Should have adaptations available that improve the score
      expect(result.adaptations.length).toBeGreaterThan(0);
      expect(result.compatibilityScore).toBeGreaterThan(40);
    });
  });

  describe('issue detection', () => {
    it('should detect control issues for keyboard-dependent games', async () => {
      const result = await checker.checkCompatibility('box-jump');
      
      const controlIssues = result.issues.filter(issue => issue.type === 'controls');
      expect(controlIssues.length).toBeGreaterThan(0);
      
      const keyboardIssue = controlIssues.find(issue => 
        issue.description.includes('keyboard')
      );
      expect(keyboardIssue).toBeDefined();
      expect(keyboardIssue?.severity).toBe('high');
    });

    it('should detect display issues for games with orientation requirements', async () => {
      // Mock portrait device trying to play landscape game
      const result = await checker.checkCompatibility('boom-dots');
      
      const displayIssues = result.issues.filter(issue => issue.type === 'display');
      const orientationIssue = displayIssues.find(issue => 
        issue.description.includes('orientation')
      );
      
      if (orientationIssue) {
        expect(orientationIssue.severity).toBe('medium');
      }
    });

    it('should provide solutions for detected issues', async () => {
      const result = await checker.checkCompatibility('box-jump');
      
      result.issues.forEach(issue => {
        if (issue.severity === 'high' || issue.severity === 'critical') {
          expect(issue.solution).toBeDefined();
          expect(issue.solution).not.toBe('');
        }
      });
    });
  });
});

describe('Compatibility Integration', () => {
  let checker: MobileGameCompatibilityChecker;

  beforeEach(() => {
    checker = new MobileGameCompatibilityChecker();
  });

  it('should provide end-to-end compatibility checking and adaptation', async () => {
    const gameId = '123';
    const mockElement = document.createElement('div');
    
    // Check compatibility first
    const compatibility = await checker.checkCompatibility(gameId);
    expect(compatibility.isCompatible).toBe(true);
    
    // Adapt the game
    const gameConfig = await checker.adaptGame(gameId, mockElement);
    expect(gameConfig).toBeDefined();
    
    // Verify adaptations were applied
    const updatedCompatibility = await checker.checkCompatibility(gameId);
    expect(updatedCompatibility.compatibilityScore).toBeGreaterThanOrEqual(compatibility.compatibilityScore);
  });

  it('should handle games with multiple compatibility issues', async () => {
    const gameId = 'fill-the-holes'; // Requires keyboard + audio + landscape
    
    const compatibility = await checker.checkCompatibility(gameId);
    
    expect(compatibility.issues.length).toBeGreaterThan(1);
    expect(compatibility.adaptations.length).toBeGreaterThan(0);
    expect(compatibility.fallbacks.length).toBeGreaterThan(0);
    
    // Should still be somewhat compatible due to adaptations
    expect(compatibility.compatibilityScore).toBeGreaterThan(30);
  });
});