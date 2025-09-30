/**
 * PWA Manifest and Icons Test Suite
 * 
 * Tests to verify PWA manifest configuration and icon availability
 */

import fs from 'fs';
import path from 'path';

describe('PWA Manifest and Icons', () => {
  const publicDir = path.join(process.cwd(), 'public');
  const iconsDir = path.join(publicDir, 'icons');
  const manifestPath = path.join(publicDir, 'manifest.json');

  describe('Manifest Configuration', () => {
    let manifest: any;

    beforeAll(() => {
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);
    });

    test('should have valid manifest.json', () => {
      expect(manifest).toBeDefined();
      expect(manifest.name).toBe('Game Portal - Play Games Online');
      expect(manifest.short_name).toBe('Game Portal');
    });

    test('should have required PWA fields', () => {
      expect(manifest.start_url).toBe('/');
      expect(manifest.display).toBe('standalone');
      expect(manifest.theme_color).toBe('#3b82f6');
      expect(manifest.background_color).toBe('#111827');
    });

    test('should have proper icon configuration', () => {
      expect(manifest.icons).toHaveLength(9);
      
      // Check for required PWA icon sizes
      const iconSizes = manifest.icons.map((icon: any) => icon.sizes);
      expect(iconSizes).toContain('192x192');
      expect(iconSizes).toContain('512x512');
    });

    test('should have proper categories and metadata', () => {
      expect(manifest.categories).toContain('games');
      expect(manifest.categories).toContain('entertainment');
      expect(manifest.lang).toBe('en');
    });
  });

  describe('Icon Files', () => {
    const requiredIcons = [
      'icon-72x72.png',
      'icon-96x96.png',
      'icon-128x128.png',
      'icon-144x144.png',
      'icon-152x152.png',
      'icon-192x192.png',
      'icon-384x384.png',
      'icon-512x512.png',
      'apple-touch-icon.png'
    ];

    test.each(requiredIcons)('should have %s icon file', (iconFile) => {
      const iconPath = path.join(iconsDir, iconFile);
      expect(fs.existsSync(iconPath)).toBe(true);
    });

    test('should have favicon.png', () => {
      const faviconPath = path.join(publicDir, 'favicon.png');
      expect(fs.existsSync(faviconPath)).toBe(true);
    });

    test('should have base SVG icon', () => {
      const svgPath = path.join(iconsDir, 'icon-base.svg');
      expect(fs.existsSync(svgPath)).toBe(true);
    });
  });

  describe('Splash Screen Files', () => {
    const requiredSplashScreens = [
      'splash-640x1136.png',
      'splash-750x1334.png',
      'splash-828x1792.png',
      'splash-1125x2436.png',
      'splash-1242x2208.png',
      'splash-1242x2688.png',
      'splash-1536x2048.png',
      'splash-1668x2224.png',
      'splash-1668x2388.png',
      'splash-2048x2732.png'
    ];

    test.each(requiredSplashScreens)('should have %s splash screen', (splashFile) => {
      const splashPath = path.join(iconsDir, splashFile);
      expect(fs.existsSync(splashPath)).toBe(true);
    });
  });

  describe('Additional PWA Files', () => {
    test('should have browserconfig.xml for Windows tiles', () => {
      const browserconfigPath = path.join(publicDir, 'browserconfig.xml');
      expect(fs.existsSync(browserconfigPath)).toBe(true);
    });

    test('should have screenshot images', () => {
      const wideScreenshotPath = path.join(publicDir, 'images', 'screenshot-wide.png');
      const narrowScreenshotPath = path.join(publicDir, 'images', 'screenshot-narrow.png');
      
      expect(fs.existsSync(wideScreenshotPath)).toBe(true);
      expect(fs.existsSync(narrowScreenshotPath)).toBe(true);
    });
  });

  describe('Icon Manifest Consistency', () => {
    let manifest: any;

    beforeAll(() => {
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);
    });

    test('all manifest icons should have corresponding files', () => {
      manifest.icons.forEach((icon: any) => {
        const iconPath = path.join(publicDir, icon.src);
        expect(fs.existsSync(iconPath)).toBe(true);
      });
    });

    test('all manifest icons should have proper purpose and type', () => {
      manifest.icons.forEach((icon: any) => {
        expect(icon.type).toBe('image/png');
        expect(icon.purpose).toBeDefined();
        expect(icon.sizes).toMatch(/^\d+x\d+$/);
      });
    });
  });
});