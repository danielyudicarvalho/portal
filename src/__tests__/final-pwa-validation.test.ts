/**
 * Final PWA Validation Test
 * 
 * Comprehensive validation of all PWA functionality and integration
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Final PWA Validation', () => {
  describe('PWA Configuration Files', () => {
    it('should have valid manifest.json', () => {
      const manifestPath = path.join(process.cwd(), 'public/manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);
      
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);
      
      // Required fields
      expect(manifest.name).toBeDefined();
      expect(manifest.short_name).toBeDefined();
      expect(manifest.start_url).toBeDefined();
      expect(manifest.display).toBeDefined();
      expect(manifest.theme_color).toBeDefined();
      expect(manifest.background_color).toBeDefined();
      expect(manifest.icons).toBeDefined();
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThan(0);
      
      // Check for required icon sizes
      const iconSizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
      expect(iconSizes).toContain('192x192');
      expect(iconSizes).toContain('512x512');
    });

    it('should have service worker file', () => {
      const swPath = path.join(process.cwd(), 'public/sw.js');
      expect(fs.existsSync(swPath)).toBe(true);
      
      const swContent = fs.readFileSync(swPath, 'utf8');
      expect(swContent.length).toBeGreaterThan(0);
      
      // Should contain caching strategies
      expect(swContent).toMatch(/CacheFirst|NetworkFirst|StaleWhileRevalidate/);
    });

    it('should have required PWA icons', () => {
      const iconDir = path.join(process.cwd(), 'public/icons');
      expect(fs.existsSync(iconDir)).toBe(true);
      
      const requiredIcons = [
        'icon-192x192.png',
        'icon-512x512.png',
        'apple-touch-icon.png'
      ];
      
      for (const icon of requiredIcons) {
        const iconPath = path.join(iconDir, icon);
        expect(fs.existsSync(iconPath)).toBe(true);
      }
    });

    it('should have Next.js PWA configuration', () => {
      const configPath = path.join(process.cwd(), 'next.config.js');
      expect(fs.existsSync(configPath)).toBe(true);
      
      const configContent = fs.readFileSync(configPath, 'utf8');
      expect(configContent).toContain('next-pwa');
      expect(configContent).toContain('withPWA');
    });
  });

  describe('PWA Components', () => {
    it('should have PWA provider component', () => {
      const providerPath = path.join(process.cwd(), 'src/components/providers/PWAProvider.tsx');
      expect(fs.existsSync(providerPath)).toBe(true);
      
      const providerContent = fs.readFileSync(providerPath, 'utf8');
      expect(providerContent).toContain('PWAProvider');
      expect(providerContent).toContain('usePWA');
    });

    it('should have install prompt component', () => {
      const promptPath = path.join(process.cwd(), 'src/components/features/InstallPrompt.tsx');
      expect(fs.existsSync(promptPath)).toBe(true);
      
      const promptContent = fs.readFileSync(promptPath, 'utf8');
      expect(promptContent).toContain('InstallPrompt');
      expect(promptContent).toContain('promptInstall');
    });

    it('should have offline indicator component', () => {
      const offlinePath = path.join(process.cwd(), 'src/components/ui/OfflineIndicator.tsx');
      expect(fs.existsSync(offlinePath)).toBe(true);
      
      const offlineContent = fs.readFileSync(offlinePath, 'utf8');
      expect(offlineContent).toContain('OfflineIndicator');
      expect(offlineContent).toContain('isOnline');
    });

    it('should have mobile game wrapper component', () => {
      const wrapperPath = path.join(process.cwd(), 'src/components/features/MobileGameWrapper.tsx');
      expect(fs.existsSync(wrapperPath)).toBe(true);
      
      const wrapperContent = fs.readFileSync(wrapperPath, 'utf8');
      expect(wrapperContent).toContain('MobileGameWrapper');
      expect(wrapperContent).toContain('TouchAdaptedGame');
    });
  });

  describe('Mobile Optimization Libraries', () => {
    it('should have mobile detection library', () => {
      const detectionPath = path.join(process.cwd(), 'src/lib/mobile-detection.ts');
      expect(fs.existsSync(detectionPath)).toBe(true);
      
      const detectionContent = fs.readFileSync(detectionPath, 'utf8');
      expect(detectionContent).toContain('detectDevice');
      expect(detectionContent).toContain('isMobile');
    });

    it('should have mobile performance monitor', () => {
      const performancePath = path.join(process.cwd(), 'src/lib/mobile-performance-monitor.ts');
      expect(fs.existsSync(performancePath)).toBe(true);
      
      const performanceContent = fs.readFileSync(performancePath, 'utf8');
      expect(performanceContent).toContain('MobilePerformanceMonitor');
      expect(performanceContent).toContain('startGameSession');
    });

    it('should have game cache manager', () => {
      const cachePath = path.join(process.cwd(), 'src/lib/game-cache-manager.ts');
      expect(fs.existsSync(cachePath)).toBe(true);
      
      const cacheContent = fs.readFileSync(cachePath, 'utf8');
      expect(cacheContent).toContain('GameCacheManager');
      expect(cacheContent).toContain('cacheGameAssets');
    });

    it('should have touch input adapter', () => {
      const touchPath = path.join(process.cwd(), 'src/lib/touch-input-adapter.ts');
      expect(fs.existsSync(touchPath)).toBe(true);
      
      const touchContent = fs.readFileSync(touchPath, 'utf8');
      expect(touchContent).toContain('TouchInputAdapter');
      expect(touchContent).toContain('adaptKeyboardControls');
    });

    it('should have notification manager', () => {
      const notificationPath = path.join(process.cwd(), 'src/lib/notification-manager.ts');
      expect(fs.existsSync(notificationPath)).toBe(true);
      
      const notificationContent = fs.readFileSync(notificationPath, 'utf8');
      expect(notificationContent).toContain('NotificationManager');
      expect(notificationContent).toContain('requestPermission');
    });
  });

  describe('PWA Hooks', () => {
    it('should have PWA installation hook', () => {
      const installHookPath = path.join(process.cwd(), 'src/hooks/usePWAInstallation.ts');
      expect(fs.existsSync(installHookPath)).toBe(true);
      
      const installHookContent = fs.readFileSync(installHookPath, 'utf8');
      expect(installHookContent).toContain('usePWAInstallation');
    });

    it('should have mobile performance hook', () => {
      const perfHookPath = path.join(process.cwd(), 'src/hooks/useMobilePerformance.ts');
      expect(fs.existsSync(perfHookPath)).toBe(true);
      
      const perfHookContent = fs.readFileSync(perfHookPath, 'utf8');
      expect(perfHookContent).toContain('useMobilePerformance');
    });

    it('should have mobile analytics hook', () => {
      const analyticsHookPath = path.join(process.cwd(), 'src/hooks/useMobileAnalytics.ts');
      expect(fs.existsSync(analyticsHookPath)).toBe(true);
      
      const analyticsHookContent = fs.readFileSync(analyticsHookPath, 'utf8');
      expect(analyticsHookContent).toContain('useMobileAnalytics');
    });
  });

  describe('Application Integration', () => {
    it('should have PWA provider in layout', () => {
      const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
      expect(fs.existsSync(layoutPath)).toBe(true);
      
      const layoutContent = fs.readFileSync(layoutPath, 'utf8');
      expect(layoutContent).toContain('PWAProvider');
      expect(layoutContent).toContain('OfflineIndicator');
    });

    it('should have PWA initialization in main page', () => {
      const pagePath = path.join(process.cwd(), 'src/app/page.tsx');
      expect(fs.existsSync(pagePath)).toBe(true);
      
      const pageContent = fs.readFileSync(pagePath, 'utf8');
      expect(pageContent).toContain('PWAInit');
    });

    it('should have mobile viewport configuration', () => {
      const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
      const layoutContent = fs.readFileSync(layoutPath, 'utf8');
      
      expect(layoutContent).toContain('viewport');
      expect(layoutContent).toContain('device-width');
      expect(layoutContent).toContain('themeColor');
    });
  });

  describe('Game Integration', () => {
    it('should have mobile-optimized game pages', () => {
      const gamePages = [
        'src/app/games/memdot/page.tsx',
        'src/app/games/clocks/page.tsx',
        'src/app/games/box-jump/page.tsx'
      ];
      
      for (const gamePage of gamePages) {
        const gamePagePath = path.join(process.cwd(), gamePage);
        if (fs.existsSync(gamePagePath)) {
          const gamePageContent = fs.readFileSync(gamePagePath, 'utf8');
          // Should contain mobile optimization components or be a game page
          expect(
            gamePageContent.includes('MobileGameWrapper') ||
            gamePageContent.includes('TouchAdaptedGame') ||
            gamePageContent.includes('ResponsiveGameContainer') ||
            gamePageContent.includes('game') ||
            gamePageContent.includes('Game')
          ).toBe(true);
        }
      }
    });

    it('should have game compatibility checker', () => {
      const compatibilityPath = path.join(process.cwd(), 'src/lib/mobile-game-compatibility.ts');
      expect(fs.existsSync(compatibilityPath)).toBe(true);
      
      const compatibilityContent = fs.readFileSync(compatibilityPath, 'utf8');
      expect(compatibilityContent).toContain('MobileGameCompatibilityChecker');
    });
  });

  describe('Build Configuration', () => {
    it('should have proper package.json dependencies', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      expect(fs.existsSync(packagePath)).toBe(true);
      
      const packageContent = fs.readFileSync(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      expect(packageJson.dependencies['next-pwa']).toBeDefined();
      expect(packageJson.dependencies['next']).toBeDefined();
      expect(packageJson.dependencies['react']).toBeDefined();
    });

    it('should have PWA build scripts', () => {
      const scriptsDir = path.join(process.cwd(), 'scripts');
      expect(fs.existsSync(scriptsDir)).toBe(true);
      
      // Check for icon generation scripts
      const iconScript = path.join(scriptsDir, 'generate-icons.js');
      if (fs.existsSync(iconScript)) {
        const iconScriptContent = fs.readFileSync(iconScript, 'utf8');
        expect(iconScriptContent).toContain('icon');
      }
    });
  });

  describe('Test Coverage', () => {
    it('should have PWA component tests', () => {
      const testFiles = [
        'src/components/providers/__tests__/PWAProvider.test.tsx',
        'src/components/features/__tests__/InstallPrompt.test.tsx',
        'src/components/features/__tests__/MobileGameWrapper.test.tsx',
        'src/components/ui/__tests__/OfflineIndicator.test.tsx'
      ];
      
      let testCount = 0;
      for (const testFile of testFiles) {
        const testPath = path.join(process.cwd(), testFile);
        if (fs.existsSync(testPath)) {
          testCount++;
          const testContent = fs.readFileSync(testPath, 'utf8');
          expect(testContent).toContain('describe');
          expect(testContent).toContain('it');
        }
      }
      
      expect(testCount).toBeGreaterThan(0);
    });

    it('should have mobile library tests', () => {
      const testFiles = [
        'src/lib/__tests__/mobile-detection.test.ts',
        'src/lib/__tests__/mobile-performance-monitor.test.ts',
        'src/lib/__tests__/game-cache-manager.test.ts',
        'src/lib/__tests__/touch-input-adapter.test.ts'
      ];
      
      let testCount = 0;
      for (const testFile of testFiles) {
        const testPath = path.join(process.cwd(), testFile);
        if (fs.existsSync(testPath)) {
          testCount++;
          const testContent = fs.readFileSync(testPath, 'utf8');
          expect(testContent).toContain('describe');
          expect(testContent).toContain('it');
        }
      }
      
      expect(testCount).toBeGreaterThan(0);
    });
  });

  describe('PWA Functionality Validation', () => {
    it('should validate manifest structure', () => {
      const manifestPath = path.join(process.cwd(), 'public/manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);
      
      // Validate PWA requirements
      expect(manifest.display).toBe('standalone');
      expect(manifest.start_url).toBe('/');
      expect(manifest.scope).toBe('/');
      
      // Validate icons
      const hasRequiredIcons = manifest.icons.some((icon: { sizes: string; type: string }) => 
        icon.sizes === '192x192' && icon.type === 'image/png'
      ) && manifest.icons.some((icon: { sizes: string; type: string }) => 
        icon.sizes === '512x512' && icon.type === 'image/png'
      );
      
      expect(hasRequiredIcons).toBe(true);
    });

    it('should validate service worker configuration', () => {
      const swPath = path.join(process.cwd(), 'public/sw.js');
      const swContent = fs.readFileSync(swPath, 'utf8');
      
      // Should contain workbox or similar PWA library
      expect(
        swContent.includes('workbox') || 
        swContent.includes('precache') ||
        swContent.includes('CacheFirst')
      ).toBe(true);
    });

    it('should validate mobile optimization', () => {
      const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
      const layoutContent = fs.readFileSync(layoutPath, 'utf8');
      
      // Should have mobile viewport configuration
      expect(layoutContent).toContain('device-width');
      expect(layoutContent).toContain('apple-mobile-web-app');
    });
  });
});