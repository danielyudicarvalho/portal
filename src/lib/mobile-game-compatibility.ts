/**
 * Mobile Game Compatibility Layer
 * 
 * Provides comprehensive compatibility checking, automatic game adaptation,
 * and fallback mechanisms for mobile devices.
 */

import { DeviceInfo, detectDevice, getGameAdaptationConfig, createGameConfig, meetsMinimumRequirements } from './mobile-detection';
import { TouchInputAdapter, GameConfig, TouchControlConfig } from './touch-input-adapter';

export interface GameCompatibilityInfo {
  gameId: string;
  isCompatible: boolean;
  compatibilityScore: number; // 0-100
  issues: CompatibilityIssue[];
  adaptations: GameAdaptation[];
  fallbacks: FallbackMechanism[];
}

export interface CompatibilityIssue {
  type: 'performance' | 'controls' | 'display' | 'features' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  solution?: string;
}

export interface GameAdaptation {
  type: 'controls' | 'viewport' | 'performance' | 'ui' | 'audio';
  description: string;
  applied: boolean;
  config?: Record<string, unknown>;
}

export interface FallbackMechanism {
  type: 'alternative_controls' | 'reduced_quality' | 'simplified_mode' | 'offline_mode';
  description: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface GameRequirements {
  minScreenWidth: number;
  minScreenHeight: number;
  requiresKeyboard: boolean;
  requiresMouse: boolean;
  requiresAudio: boolean;
  requiresWebGL: boolean;
  requiresGamepad: boolean;
  minMemory?: number; // MB
  minBandwidth?: number; // Kbps
  supportedOrientations: ('portrait' | 'landscape')[];
}

export interface GameMetadata {
  id: string;
  title: string;
  engine: 'phaser' | 'custom' | 'html5' | 'webgl' | 'canvas';
  version: string;
  requirements: GameRequirements;
  mobileOptimized: boolean;
  touchSupported: boolean;
  offlineCapable: boolean;
  categories: string[];
}

/**
 * Mobile Game Compatibility Checker
 */
export class MobileGameCompatibilityChecker {
  private deviceInfo: DeviceInfo;
  private touchAdapter: TouchInputAdapter;
  private gameMetadataCache: Map<string, GameMetadata> = new Map();

  constructor() {
    this.deviceInfo = detectDevice();
    this.touchAdapter = new TouchInputAdapter();
    this.initializeGameMetadata();
  }

  /**
   * Checks compatibility of a game with the current device
   */
  async checkCompatibility(gameId: string): Promise<GameCompatibilityInfo> {
    const metadata = this.getGameMetadata(gameId);
    const issues: CompatibilityIssue[] = [];
    const adaptations: GameAdaptation[] = [];
    const fallbacks: FallbackMechanism[] = [];

    // Check basic device compatibility
    const basicCompatibility = this.checkBasicCompatibility(metadata);
    issues.push(...basicCompatibility.issues);

    // Check performance compatibility
    const performanceCompatibility = this.checkPerformanceCompatibility(metadata);
    issues.push(...performanceCompatibility.issues);

    // Check control compatibility
    const controlCompatibility = this.checkControlCompatibility(metadata);
    issues.push(...controlCompatibility.issues);
    adaptations.push(...controlCompatibility.adaptations);

    // Check display compatibility
    const displayCompatibility = this.checkDisplayCompatibility(metadata);
    issues.push(...displayCompatibility.issues);
    adaptations.push(...displayCompatibility.adaptations);

    // Generate fallback mechanisms
    fallbacks.push(...this.generateFallbackMechanisms(metadata, issues));

    // Calculate compatibility score
    const compatibilityScore = this.calculateCompatibilityScore(issues, adaptations, fallbacks);
    const isCompatible = compatibilityScore >= 60; // 60% threshold

    return {
      gameId,
      isCompatible,
      compatibilityScore,
      issues,
      adaptations,
      fallbacks
    };
  }

  /**
   * Automatically adapts a game based on device capabilities
   */
  async adaptGame(gameId: string, gameElement: HTMLElement): Promise<GameConfig> {
    const compatibility = await this.checkCompatibility(gameId);
    const metadata = this.getGameMetadata(gameId);
    const adaptationConfig = getGameAdaptationConfig(gameId, this.deviceInfo);

    // Apply adaptations
    for (const adaptation of compatibility.adaptations) {
      if (adaptation.applied) continue;

      try {
        await this.applyAdaptation(adaptation, gameElement, metadata);
        adaptation.applied = true;
      } catch (error) {
        console.warn(`Failed to apply adaptation ${adaptation.type}:`, error);
      }
    }

    // Enable fallback mechanisms if needed
    for (const fallback of compatibility.fallbacks) {
      if (compatibility.compatibilityScore < 70 && !fallback.enabled) {
        try {
          await this.enableFallback(fallback, gameElement, metadata);
          fallback.enabled = true;
        } catch (error) {
          console.warn(`Failed to enable fallback ${fallback.type}:`, error);
        }
      }
    }

    // Create optimized game configuration
    const gameConfig = createGameConfig(
      gameId,
      adaptationConfig,
      metadata.requirements.minScreenWidth,
      metadata.requirements.minScreenHeight
    );

    // Apply touch controls if needed
    if (this.deviceInfo.isTouch && adaptationConfig.needsTouchControls) {
      this.touchAdapter.adaptKeyboardControls(gameElement, gameConfig);
      this.touchAdapter.enableTouchGestures(gameElement);
    }

    return gameConfig;
  }

  /**
   * Gets fallback options for unsupported features
   */
  getFallbackOptions(gameId: string): FallbackMechanism[] {
    const metadata = this.getGameMetadata(gameId);
    const fallbacks: FallbackMechanism[] = [];

    // Alternative controls fallback
    if (metadata.requirements.requiresKeyboard || metadata.requirements.requiresMouse) {
      fallbacks.push({
        type: 'alternative_controls',
        description: 'Use touch controls instead of keyboard/mouse',
        enabled: false,
        config: {
          touchControls: this.generateAlternativeControls(gameId),
          virtualKeyboard: metadata.requirements.requiresKeyboard
        }
      });
    }

    // Reduced quality fallback
    if (this.deviceInfo.screenSize.width < 768 || this.isLowEndDevice()) {
      fallbacks.push({
        type: 'reduced_quality',
        description: 'Reduce graphics quality for better performance',
        enabled: false,
        config: {
          resolution: 0.75,
          effects: false,
          particles: false,
          shadows: false
        }
      });
    }

    // Simplified mode fallback
    if (metadata.engine === 'webgl' && !this.supportsWebGL()) {
      fallbacks.push({
        type: 'simplified_mode',
        description: 'Use canvas rendering instead of WebGL',
        enabled: false,
        config: {
          renderer: 'canvas',
          features: ['basic_graphics', 'simple_animations']
        }
      });
    }

    // Offline mode fallback
    if (metadata.offlineCapable) {
      fallbacks.push({
        type: 'offline_mode',
        description: 'Enable offline gameplay with cached assets',
        enabled: false,
        config: {
          cacheAssets: true,
          offlineFeatures: ['gameplay', 'scores', 'progress']
        }
      });
    }

    return fallbacks;
  }

  /**
   * Checks if a game feature is supported on the current device
   */
  isFeatureSupported(feature: string): boolean {
    switch (feature) {
      case 'webgl':
        return this.supportsWebGL();
      case 'audio':
        return this.supportsAudio();
      case 'gamepad':
        return this.supportsGamepad();
      case 'fullscreen':
        return this.supportsFullscreen();
      case 'orientation_lock':
        return this.supportsOrientationLock();
      case 'vibration':
        return this.supportsVibration();
      case 'touch':
        return this.deviceInfo.isTouch;
      case 'accelerometer':
        return this.supportsAccelerometer();
      default:
        return false;
    }
  }

  /**
   * Gets device-specific optimizations for a game
   */
  getDeviceOptimizations(gameId: string): Record<string, unknown> {
    this.getGameMetadata(gameId);
    const optimizations: Record<string, unknown> = {};

    // iOS-specific optimizations
    if (this.deviceInfo.platform === 'ios') {
      optimizations.ios = {
        disableZoom: true,
        preventBounce: true,
        statusBarStyle: 'black-translucent',
        webkitBackfaceVisibility: 'hidden'
      };
    }

    // Android-specific optimizations
    if (this.deviceInfo.platform === 'android') {
      optimizations.android = {
        hardwareAcceleration: true,
        chromeFlags: ['--disable-web-security', '--allow-running-insecure-content'],
        viewportFit: 'cover'
      };
    }

    // Low-end device optimizations
    if (this.isLowEndDevice()) {
      optimizations.performance = {
        maxFPS: 30,
        reducedParticles: true,
        simplifiedShaders: true,
        preloadCriticalOnly: true
      };
    }

    // High DPI optimizations
    if (this.deviceInfo.pixelRatio > 2) {
      optimizations.display = {
        autoScale: true,
        pixelRatio: Math.min(this.deviceInfo.pixelRatio, 2),
        antialiasing: false
      };
    }

    return optimizations;
  }

  /**
   * Initializes game metadata for all available games
   */
  private initializeGameMetadata(): void {
    // Define metadata for each game
    const gamesMetadata: GameMetadata[] = [
      {
        id: '123',
        title: '1+2=3',
        engine: 'phaser',
        version: '1.0',
        requirements: {
          minScreenWidth: 320,
          minScreenHeight: 480,
          requiresKeyboard: false,
          requiresMouse: false,
          requiresAudio: false,
          requiresWebGL: false,
          requiresGamepad: false,
          supportedOrientations: ['portrait', 'landscape']
        },
        mobileOptimized: true,
        touchSupported: true,
        offlineCapable: true,
        categories: ['puzzle', 'math']
      },
      {
        id: 'box-jump',
        title: 'Box Jump',
        engine: 'phaser',
        version: '1.0',
        requirements: {
          minScreenWidth: 480,
          minScreenHeight: 320,
          requiresKeyboard: true,
          requiresMouse: false,
          requiresAudio: true,
          requiresWebGL: false,
          requiresGamepad: false,
          supportedOrientations: ['landscape']
        },
        mobileOptimized: false,
        touchSupported: false,
        offlineCapable: true,
        categories: ['platformer', 'action']
      },
      {
        id: 'doodle-jump',
        title: 'Doodle Jump',
        engine: 'phaser',
        version: '1.0',
        requirements: {
          minScreenWidth: 320,
          minScreenHeight: 568,
          requiresKeyboard: true,
          requiresMouse: false,
          requiresAudio: false,
          requiresWebGL: false,
          requiresGamepad: false,
          supportedOrientations: ['portrait']
        },
        mobileOptimized: false,
        touchSupported: false,
        offlineCapable: true,
        categories: ['platformer', 'endless']
      },
      {
        id: 'circle-path',
        title: 'Circle Path',
        engine: 'phaser',
        version: '1.0',
        requirements: {
          minScreenWidth: 320,
          minScreenHeight: 480,
          requiresKeyboard: false,
          requiresMouse: true,
          requiresAudio: false,
          requiresWebGL: false,
          requiresGamepad: false,
          supportedOrientations: ['portrait', 'landscape']
        },
        mobileOptimized: false,
        touchSupported: false,
        offlineCapable: true,
        categories: ['arcade', 'skill']
      },
      {
        id: 'clocks',
        title: 'Clocks',
        engine: 'phaser',
        version: '1.0',
        requirements: {
          minScreenWidth: 320,
          minScreenHeight: 480,
          requiresKeyboard: false,
          requiresMouse: true,
          requiresAudio: false,
          requiresWebGL: false,
          requiresGamepad: false,
          supportedOrientations: ['portrait', 'landscape']
        },
        mobileOptimized: false,
        touchSupported: false,
        offlineCapable: true,
        categories: ['puzzle', 'timing']
      },
      {
        id: 'boom-dots',
        title: 'Boom Dots',
        engine: 'phaser',
        version: '1.0',
        requirements: {
          minScreenWidth: 480,
          minScreenHeight: 320,
          requiresKeyboard: true,
          requiresMouse: false,
          requiresAudio: false,
          requiresWebGL: false,
          requiresGamepad: false,
          supportedOrientations: ['landscape']
        },
        mobileOptimized: false,
        touchSupported: false,
        offlineCapable: true,
        categories: ['shooter', 'action']
      },
      {
        id: 'endless-scale',
        title: 'Endless Scale',
        engine: 'phaser',
        version: '1.0',
        requirements: {
          minScreenWidth: 320,
          minScreenHeight: 480,
          requiresKeyboard: true,
          requiresMouse: false,
          requiresAudio: false,
          requiresWebGL: false,
          requiresGamepad: false,
          supportedOrientations: ['portrait', 'landscape']
        },
        mobileOptimized: false,
        touchSupported: false,
        offlineCapable: true,
        categories: ['arcade', 'skill']
      },
      {
        id: 'fill-the-holes',
        title: 'Fill the Holes',
        engine: 'phaser',
        version: '1.0',
        requirements: {
          minScreenWidth: 480,
          minScreenHeight: 320,
          requiresKeyboard: true,
          requiresMouse: false,
          requiresAudio: true,
          requiresWebGL: false,
          requiresGamepad: false,
          supportedOrientations: ['landscape']
        },
        mobileOptimized: false,
        touchSupported: false,
        offlineCapable: true,
        categories: ['puzzle', 'strategy']
      },
      {
        id: 'memdot',
        title: 'Memory Dots',
        engine: 'phaser',
        version: '1.0',
        requirements: {
          minScreenWidth: 320,
          minScreenHeight: 480,
          requiresKeyboard: false,
          requiresMouse: true,
          requiresAudio: false,
          requiresWebGL: false,
          requiresGamepad: false,
          supportedOrientations: ['portrait', 'landscape']
        },
        mobileOptimized: false,
        touchSupported: false,
        offlineCapable: true,
        categories: ['memory', 'puzzle']
      }
    ];

    // Cache metadata
    gamesMetadata.forEach(metadata => {
      this.gameMetadataCache.set(metadata.id, metadata);
    });
  }

  /**
   * Gets game metadata by ID
   */
  private getGameMetadata(gameId: string): GameMetadata {
    const metadata = this.gameMetadataCache.get(gameId);
    if (!metadata) {
      // Return default metadata for unknown games
      return {
        id: gameId,
        title: gameId,
        engine: 'custom',
        version: '1.0',
        requirements: {
          minScreenWidth: 320,
          minScreenHeight: 480,
          requiresKeyboard: false,
          requiresMouse: false,
          requiresAudio: false,
          requiresWebGL: false,
          requiresGamepad: false,
          supportedOrientations: ['portrait', 'landscape']
        },
        mobileOptimized: false,
        touchSupported: false,
        offlineCapable: false,
        categories: ['unknown']
      };
    }
    return metadata;
  }

  /**
   * Checks basic device compatibility
   */
  private checkBasicCompatibility(metadata: GameMetadata): { issues: CompatibilityIssue[] } {
    const issues: CompatibilityIssue[] = [];

    // Check screen size requirements
    if (!meetsMinimumRequirements(
      { 
        width: 0, 
        height: 0, 
        scaleMode: 'fit', 
        touchControls: [], 
        minScreenSize: { 
          width: metadata.requirements.minScreenWidth, 
          height: metadata.requirements.minScreenHeight 
        } 
      }, 
      this.deviceInfo
    )) {
      issues.push({
        type: 'display',
        severity: 'high',
        description: `Screen size too small. Minimum required: ${metadata.requirements.minScreenWidth}x${metadata.requirements.minScreenHeight}`,
        solution: 'Use landscape orientation or zoom out'
      });
    }

    // Check orientation support
    const currentOrientation = this.deviceInfo.orientation;
    if (!metadata.requirements.supportedOrientations.includes(currentOrientation)) {
      issues.push({
        type: 'display',
        severity: 'medium',
        description: `Current orientation (${currentOrientation}) not optimal for this game`,
        solution: `Rotate device to ${metadata.requirements.supportedOrientations.join(' or ')}`
      });
    }

    return { issues };
  }

  /**
   * Checks performance compatibility
   */
  private checkPerformanceCompatibility(metadata: GameMetadata): { issues: CompatibilityIssue[] } {
    const issues: CompatibilityIssue[] = [];

    // Check if device is low-end
    if (this.isLowEndDevice()) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        description: 'Device may have limited performance capabilities',
        solution: 'Enable performance optimizations and reduced quality settings'
      });
    }

    // Check WebGL support if required
    if (metadata.requirements.requiresWebGL && !this.supportsWebGL()) {
      issues.push({
        type: 'features',
        severity: 'high',
        description: 'WebGL not supported on this device',
        solution: 'Use canvas fallback renderer'
      });
    }

    // Check memory constraints
    if (metadata.requirements.minMemory && this.getAvailableMemory() < metadata.requirements.minMemory) {
      issues.push({
        type: 'performance',
        severity: 'high',
        description: 'Insufficient memory available',
        solution: 'Close other applications or use reduced quality mode'
      });
    }

    return { issues };
  }

  /**
   * Checks control compatibility
   */
  private checkControlCompatibility(metadata: GameMetadata): { 
    issues: CompatibilityIssue[]; 
    adaptations: GameAdaptation[] 
  } {
    const issues: CompatibilityIssue[] = [];
    const adaptations: GameAdaptation[] = [];

    // Check keyboard requirements
    if (metadata.requirements.requiresKeyboard && this.deviceInfo.isMobile) {
      issues.push({
        type: 'controls',
        severity: 'high',
        description: 'Game requires keyboard input but device is mobile',
        solution: 'Use touch control adaptation'
      });

      adaptations.push({
        type: 'controls',
        description: 'Convert keyboard controls to touch controls',
        applied: false,
        config: { touchControls: true, virtualKeyboard: false }
      });
    }

    // Check mouse requirements
    if (metadata.requirements.requiresMouse && this.deviceInfo.isMobile) {
      issues.push({
        type: 'controls',
        severity: 'medium',
        description: 'Game requires mouse input but device uses touch',
        solution: 'Use touch-to-mouse adaptation'
      });

      adaptations.push({
        type: 'controls',
        description: 'Convert mouse interactions to touch gestures',
        applied: false,
        config: { touchToMouse: true, gestureMapping: true }
      });
    }

    // Check gamepad requirements
    if (metadata.requirements.requiresGamepad && !this.supportsGamepad()) {
      issues.push({
        type: 'controls',
        severity: 'low',
        description: 'Game supports gamepad but none detected',
        solution: 'Use alternative control methods'
      });
    }

    return { issues, adaptations };
  }

  /**
   * Checks display compatibility
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private checkDisplayCompatibility(_metadata: GameMetadata): { 
    issues: CompatibilityIssue[]; 
    adaptations: GameAdaptation[] 
  } {
    const issues: CompatibilityIssue[] = [];
    const adaptations: GameAdaptation[] = [];

    // Check pixel ratio for high DPI displays
    if (this.deviceInfo.pixelRatio > 2) {
      adaptations.push({
        type: 'viewport',
        description: 'Optimize for high DPI display',
        applied: false,
        config: { pixelRatio: Math.min(this.deviceInfo.pixelRatio, 2) }
      });
    }

    // Check for small screens
    if (this.deviceInfo.screenSize.width < 480) {
      adaptations.push({
        type: 'ui',
        description: 'Scale UI elements for small screen',
        applied: false,
        config: { uiScale: 1.2, fontSize: 'large' }
      });
    }

    return { issues, adaptations };
  }

  /**
   * Generates fallback mechanisms based on issues
   */
  private generateFallbackMechanisms(metadata: GameMetadata, issues: CompatibilityIssue[]): FallbackMechanism[] {
    const fallbacks: FallbackMechanism[] = [];

    // Add fallbacks based on detected issues
    const hasControlIssues = issues.some(issue => issue.type === 'controls');
    const hasPerformanceIssues = issues.some(issue => issue.type === 'performance');
    const hasFeatureIssues = issues.some(issue => issue.type === 'features');

    if (hasControlIssues) {
      fallbacks.push(...this.getFallbackOptions(metadata.id).filter(f => f.type === 'alternative_controls'));
    }

    if (hasPerformanceIssues) {
      fallbacks.push(...this.getFallbackOptions(metadata.id).filter(f => f.type === 'reduced_quality'));
    }

    if (hasFeatureIssues) {
      fallbacks.push(...this.getFallbackOptions(metadata.id).filter(f => f.type === 'simplified_mode'));
    }

    return fallbacks;
  }

  /**
   * Calculates overall compatibility score
   */
  private calculateCompatibilityScore(
    issues: CompatibilityIssue[], 
    adaptations: GameAdaptation[], 
    fallbacks: FallbackMechanism[]
  ): number {
    let score = 100;

    // Deduct points for issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical': score -= 40; break;
        case 'high': score -= 25; break;
        case 'medium': score -= 15; break;
        case 'low': score -= 5; break;
      }
    });

    // Add points for available adaptations
    adaptations.forEach(() => score += 10);

    // Add points for available fallbacks
    fallbacks.forEach(() => score += 5);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Applies a specific adaptation
   */
  private async applyAdaptation(
    adaptation: GameAdaptation, 
    gameElement: HTMLElement, 
    metadata: GameMetadata
  ): Promise<void> {
    switch (adaptation.type) {
      case 'controls':
        await this.applyControlAdaptation(adaptation, gameElement, metadata);
        break;
      case 'viewport':
        await this.applyViewportAdaptation(adaptation, gameElement);
        break;
      case 'performance':
        await this.applyPerformanceAdaptation(adaptation, gameElement);
        break;
      case 'ui':
        await this.applyUIAdaptation(adaptation, gameElement);
        break;
      case 'audio':
        await this.applyAudioAdaptation(adaptation, gameElement);
        break;
    }
  }

  /**
   * Enables a specific fallback mechanism
   */
  private async enableFallback(
    fallback: FallbackMechanism, 
    gameElement: HTMLElement, 
    metadata: GameMetadata
  ): Promise<void> {
    switch (fallback.type) {
      case 'alternative_controls':
        await this.enableAlternativeControls(fallback, gameElement, metadata);
        break;
      case 'reduced_quality':
        await this.enableReducedQuality(fallback, gameElement);
        break;
      case 'simplified_mode':
        await this.enableSimplifiedMode(fallback, gameElement);
        break;
      case 'offline_mode':
        await this.enableOfflineMode(fallback, gameElement);
        break;
    }
  }

  // Adaptation implementation methods
  private async applyControlAdaptation(adaptation: GameAdaptation, gameElement: HTMLElement, metadata: GameMetadata): Promise<void> {
    if (adaptation.config?.touchControls) {
      const adaptationConfig = getGameAdaptationConfig(metadata.id, this.deviceInfo);
      const gameConfig = createGameConfig(metadata.id, adaptationConfig);
      this.touchAdapter.adaptKeyboardControls(gameElement, gameConfig);
    }
  }

  private async applyViewportAdaptation(adaptation: GameAdaptation, gameElement: HTMLElement): Promise<void> {
    if (adaptation.config?.pixelRatio && typeof adaptation.config.pixelRatio === 'number') {
      gameElement.style.imageRendering = 'pixelated';
      gameElement.style.transform = `scale(${1 / adaptation.config.pixelRatio})`;
    }
  }

  private async applyPerformanceAdaptation(adaptation: GameAdaptation, gameElement: HTMLElement): Promise<void> {
    // Apply performance optimizations
    gameElement.style.willChange = 'transform';
    gameElement.style.backfaceVisibility = 'hidden';
  }

  private async applyUIAdaptation(adaptation: GameAdaptation, gameElement: HTMLElement): Promise<void> {
    if (adaptation.config?.uiScale) {
      gameElement.style.fontSize = `${adaptation.config.uiScale}em`;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async applyAudioAdaptation(_adaptation: GameAdaptation, _gameElement: HTMLElement): Promise<void> {
    // Audio adaptations would be handled by the game engine
  }

  // Fallback implementation methods
  private async enableAlternativeControls(_fallback: FallbackMechanism, _gameElement: HTMLElement, metadata: GameMetadata): Promise<void> {
    this.generateAlternativeControls(metadata.id);
    // Implementation would depend on specific game requirements
  }

  private async enableReducedQuality(fallback: FallbackMechanism, gameElement: HTMLElement): Promise<void> {
    // Reduce quality settings
    gameElement.style.imageRendering = 'pixelated';
  }

  private async enableSimplifiedMode(fallback: FallbackMechanism, gameElement: HTMLElement): Promise<void> {
    // Enable simplified rendering mode
    gameElement.classList.add('simplified-mode');
  }

  private async enableOfflineMode(fallback: FallbackMechanism, gameElement: HTMLElement): Promise<void> {
    // Enable offline capabilities
    gameElement.classList.add('offline-mode');
  }

  // Helper methods
  private generateAlternativeControls(gameId: string): TouchControlConfig[] {
    const adaptationConfig = getGameAdaptationConfig(gameId, this.deviceInfo);
    return adaptationConfig.recommendedControls;
  }

  private isLowEndDevice(): boolean {
    return this.deviceInfo.screenSize.width < 768 || 
           this.deviceInfo.pixelRatio < 2 ||
           navigator.hardwareConcurrency < 4;
  }

  private supportsWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }

  private supportsAudio(): boolean {
    return typeof Audio !== 'undefined';
  }

  private supportsGamepad(): boolean {
    return 'getGamepads' in navigator;
  }

  private supportsFullscreen(): boolean {
    return 'requestFullscreen' in document.documentElement;
  }

  private supportsOrientationLock(): boolean {
    return 'orientation' in screen && 'lock' in screen.orientation;
  }

  private supportsVibration(): boolean {
    return 'vibrate' in navigator;
  }

  private supportsAccelerometer(): boolean {
    return 'DeviceMotionEvent' in window;
  }

  private getAvailableMemory(): number {
    // Estimate available memory (in MB)
    if ('memory' in performance) {
      return (performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize / (1024 * 1024);
    }
    return 512; // Default assumption
  }
}

// Export singleton instance
export const mobileGameCompatibilityChecker = new MobileGameCompatibilityChecker();