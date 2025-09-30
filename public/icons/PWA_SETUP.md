# PWA Icons and Manifest Setup

This directory contains all the necessary icons and assets for Progressive Web App (PWA) support.

## Generated Files

### App Icons
- `icon-72x72.png` - Small icon for various uses
- `icon-96x96.png` - Standard small icon
- `icon-128x128.png` - Medium icon
- `icon-144x144.png` - Windows tile icon
- `icon-152x152.png` - iPad icon
- `icon-192x192.png` - Standard PWA icon (required)
- `icon-384x384.png` - Large icon
- `icon-512x512.png` - Extra large PWA icon (required)
- `apple-touch-icon.png` - iOS home screen icon (180x180)
- `favicon.png` - Browser favicon (32x32)

### Splash Screens (iOS)
- `splash-640x1136.png` - iPhone 5/5S/5C/SE
- `splash-750x1334.png` - iPhone 6/7/8
- `splash-828x1792.png` - iPhone 11/XR
- `splash-1125x2436.png` - iPhone X/XS/11 Pro
- `splash-1242x2208.png` - iPhone 6/7/8 Plus
- `splash-1242x2688.png` - iPhone 11 Pro Max/XS Max
- `splash-1536x2048.png` - iPad 9.7" (portrait)
- `splash-2048x1536.png` - iPad 9.7" (landscape)
- `splash-1668x2224.png` - iPad Pro 10.5" (portrait)
- `splash-2224x1668.png` - iPad Pro 10.5" (landscape)
- `splash-1668x2388.png` - iPad Pro 11" (portrait)
- `splash-2388x1668.png` - iPad Pro 11" (landscape)
- `splash-2048x2732.png` - iPad Pro 12.9" (portrait)
- `splash-2732x2048.png` - iPad Pro 12.9" (landscape)

### Source Files
- `icon-base.svg` - Base SVG icon for generating other sizes
- `splash-template.svg` - Template for splash screen generation

## PWA Manifest Features

The `manifest.json` includes:

- **Basic App Info**: Name, description, start URL
- **Display Mode**: Standalone (full-screen app experience)
- **Theme Colors**: Consistent branding colors
- **Icons**: Complete set of icons for all device sizes
- **Screenshots**: App store preview images
- **Categories**: Games and entertainment classification
- **Orientation**: Flexible orientation support

## Browser Support

### Chrome/Edge (Chromium)
- Full PWA support including installation prompts
- Service worker caching
- Push notifications
- Background sync

### Safari (iOS/macOS)
- Add to Home Screen support
- Splash screens
- Standalone display mode
- Limited service worker support

### Firefox
- Basic PWA support
- Service worker caching
- Installation prompts (desktop)

## Installation Process

### Desktop
1. Visit the site in a supported browser
2. Look for install prompt in address bar
3. Click "Install" to add to desktop/start menu

### Mobile (iOS)
1. Open in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Confirm installation

### Mobile (Android)
1. Open in Chrome
2. Tap menu (three dots)
3. Select "Add to Home screen" or "Install app"
4. Confirm installation

## Testing PWA Features

### Lighthouse PWA Audit
Run Lighthouse audit to check PWA compliance:
```bash
npx lighthouse https://your-domain.com --view
```

### Chrome DevTools
1. Open DevTools (F12)
2. Go to Application tab
3. Check Manifest section
4. Verify Service Workers
5. Test offline functionality

### iOS Testing
1. Test on actual iOS device
2. Verify splash screens display correctly
3. Check standalone mode functionality
4. Test touch interactions

## Customization

### Updating Icons
1. Replace `icon-base.svg` with your design
2. Run `node scripts/generate-icons.js`
3. Test on various devices

### Updating Splash Screens
1. Modify `splash-template.svg` or generation script
2. Run `node scripts/generate-splash-screens.js`
3. Test on iOS devices

### Updating Manifest
1. Edit `public/manifest.json`
2. Update theme colors, descriptions, etc.
3. Test installation flow

## Best Practices

### Icon Design
- Use simple, recognizable designs
- Ensure good contrast
- Follow platform guidelines
- Test at small sizes
- Consider maskable icon requirements

### Performance
- Optimize icon file sizes
- Use appropriate image formats
- Implement proper caching strategies
- Monitor Core Web Vitals

### Accessibility
- Provide meaningful app names
- Use appropriate color contrast
- Support keyboard navigation
- Test with screen readers

## Troubleshooting

### Installation Not Available
- Check manifest.json syntax
- Verify HTTPS connection
- Ensure required icons are present
- Check browser console for errors

### Splash Screens Not Showing
- Verify iOS meta tags in HTML head
- Check image file paths
- Test on actual iOS devices
- Validate media queries

### Icons Not Displaying
- Check file paths in manifest
- Verify image formats and sizes
- Clear browser cache
- Test on different devices

## Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Manifest Generator](https://www.simicart.com/manifest-generator.html/)
- [iOS PWA Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Chrome PWA Guide](https://developers.google.com/web/progressive-web-apps/)