#!/usr/bin/env node

/**
 * Splash Screen Generation Script for iOS PWA
 * 
 * This script generates splash screen images for various iOS device sizes.
 * Run with: node scripts/generate-splash-screens.js
 * 
 * Requirements:
 * - sharp package for image processing
 * - Install with: npm install sharp --save-dev
 */

const fs = require('fs');
const path = require('path');

// iOS splash screen sizes
const SPLASH_SIZES = [
  // iPhone
  { width: 640, height: 1136, name: 'splash-640x1136', device: 'iPhone 5/5S/5C/SE' },
  { width: 750, height: 1334, name: 'splash-750x1334', device: 'iPhone 6/7/8' },
  { width: 828, height: 1792, name: 'splash-828x1792', device: 'iPhone 11/XR' },
  { width: 1125, height: 2436, name: 'splash-1125x2436', device: 'iPhone X/XS/11 Pro' },
  { width: 1242, height: 2208, name: 'splash-1242x2208', device: 'iPhone 6/7/8 Plus' },
  { width: 1242, height: 2688, name: 'splash-1242x2688', device: 'iPhone 11 Pro Max/XS Max' },
  
  // iPad
  { width: 1536, height: 2048, name: 'splash-1536x2048', device: 'iPad 9.7"' },
  { width: 1668, height: 2224, name: 'splash-1668x2224', device: 'iPad Pro 10.5"' },
  { width: 1668, height: 2388, name: 'splash-1668x2388', device: 'iPad Pro 11"' },
  { width: 2048, height: 2732, name: 'splash-2048x2732', device: 'iPad Pro 12.9"' },
  
  // Landscape versions for iPad
  { width: 2048, height: 1536, name: 'splash-2048x1536', device: 'iPad 9.7" (landscape)' },
  { width: 2224, height: 1668, name: 'splash-2224x1668', device: 'iPad Pro 10.5" (landscape)' },
  { width: 2388, height: 1668, name: 'splash-2388x1668', device: 'iPad Pro 11" (landscape)' },
  { width: 2732, height: 2048, name: 'splash-2732x2048', device: 'iPad Pro 12.9" (landscape)' },
];

function createSplashSVG(width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  const iconSize = Math.min(width, height) * 0.15; // 15% of smaller dimension
  const iconRadius = iconSize / 2;
  
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="splashGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#111827;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#1f2937;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#111827;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#splashGradient)"/>
  
  <!-- App icon in center -->
  <g transform="translate(${centerX},${centerY})">
    <!-- Icon background circle -->
    <circle cx="0" cy="0" r="${iconRadius}" fill="url(#iconGradient)" stroke="#374151" stroke-width="${iconRadius * 0.05}"/>
    
    <!-- Game controller icon -->
    <g>
      <!-- Controller body -->
      <rect x="${-iconRadius * 0.5}" y="${-iconRadius * 0.1875}" width="${iconRadius}" height="${iconRadius * 0.375}" rx="${iconRadius * 0.1875}" fill="#ffffff" opacity="0.9"/>
      
      <!-- D-pad -->
      <g transform="translate(${-iconRadius * 0.3125},0)">
        <rect x="${-iconRadius * 0.05}" y="${-iconRadius * 0.125}" width="${iconRadius * 0.1}" height="${iconRadius * 0.25}" rx="${iconRadius * 0.0125}" fill="#1f2937"/>
        <rect x="${-iconRadius * 0.125}" y="${-iconRadius * 0.05}" width="${iconRadius * 0.25}" height="${iconRadius * 0.1}" rx="${iconRadius * 0.0125}" fill="#1f2937"/>
      </g>
      
      <!-- Action buttons -->
      <g transform="translate(${iconRadius * 0.3125},0)">
        <circle cx="${-iconRadius * 0.0875}" cy="${-iconRadius * 0.0875}" r="${iconRadius * 0.05}" fill="#1f2937"/>
        <circle cx="${iconRadius * 0.0875}" cy="${-iconRadius * 0.0875}" r="${iconRadius * 0.05}" fill="#1f2937"/>
        <circle cx="${-iconRadius * 0.0875}" cy="${iconRadius * 0.0875}" r="${iconRadius * 0.05}" fill="#1f2937"/>
        <circle cx="${iconRadius * 0.0875}" cy="${iconRadius * 0.0875}" r="${iconRadius * 0.05}" fill="#1f2937"/>
      </g>
    </g>
  </g>
  
  <!-- App name -->
  <text x="${centerX}" y="${centerY + iconRadius + 40}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.max(24, width * 0.04)}" font-weight="bold" fill="#ffffff">
    Game Portal
  </text>
  
  <!-- Tagline -->
  <text x="${centerX}" y="${centerY + iconRadius + 70}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.max(14, width * 0.025)}" fill="#9ca3af">
    Play Games Online
  </text>
  
  <!-- Loading indicator -->
  <g transform="translate(${centerX},${centerY + iconRadius + 120})">
    <circle cx="-20" cy="0" r="4" fill="#3b82f6" opacity="0.8">
      <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" begin="0s"/>
    </circle>
    <circle cx="0" cy="0" r="4" fill="#3b82f6" opacity="0.6">
      <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.5s" repeatCount="indefinite" begin="0.5s"/>
    </circle>
    <circle cx="20" cy="0" r="4" fill="#3b82f6" opacity="0.4">
      <animate attributeName="opacity" values="0.4;0.2;0.4" dur="1.5s" repeatCount="indefinite" begin="1s"/>
    </circle>
  </g>
</svg>`;
}

async function generateSplashScreens() {
  try {
    // Check if sharp is available
    let sharp;
    try {
      sharp = require('sharp');
    } catch (error) {
      console.error('Sharp package not found. Please install it with: npm install sharp --save-dev');
      createPlaceholderSplashScreens();
      return;
    }

    const iconsDir = path.join(__dirname, '../public/icons');

    // Ensure icons directory exists
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
    }

    console.log('Generating iOS splash screens...');

    for (const splash of SPLASH_SIZES) {
      const svgContent = createSplashSVG(splash.width, splash.height);
      const outputPath = path.join(iconsDir, `${splash.name}.png`);
      
      await sharp(Buffer.from(svgContent))
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated ${splash.name}.png (${splash.device})`);
    }

    console.log('\n🎉 All splash screens generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Add splash screen meta tags to your HTML head');
    console.log('2. Test splash screens on various iOS devices');
    console.log('3. Customize splash screen design as needed');

  } catch (error) {
    console.error('Error generating splash screens:', error);
    process.exit(1);
  }
}

function createPlaceholderSplashScreens() {
  console.log('Creating placeholder splash screen files...');
  console.log('Note: These are placeholder files. Install sharp to generate actual PNG splash screens.');

  const iconsDir = path.join(__dirname, '../public/icons');
  
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Create placeholder files
  for (const splash of SPLASH_SIZES) {
    const placeholderPath = path.join(iconsDir, `${splash.name}.png.placeholder`);
    fs.writeFileSync(placeholderPath, `Placeholder for ${splash.name} splash screen (${splash.device}). Install sharp to generate actual PNG files.`);
    console.log(`✓ Created placeholder for ${splash.name} (${splash.device})`);
  }

  // Create README for splash screens
  const readmePath = path.join(iconsDir, 'SPLASH_README.md');
  const readmeContent = `# iOS Splash Screens

This directory contains splash screen images for iOS PWA support.

## Required Splash Screen Sizes

${SPLASH_SIZES.map(splash => `- ${splash.width}x${splash.height}px - ${splash.device}`).join('\n')}

## Generating Splash Screens

1. Install sharp: \`npm install sharp --save-dev\`
2. Run the generation script: \`node scripts/generate-splash-screens.js\`

## Adding to HTML

Add these meta tags to your HTML head:

\`\`\`html
<!-- iOS Splash Screens -->
${SPLASH_SIZES.map(splash => 
  `<link rel="apple-touch-startup-image" href="/icons/${splash.name}.png" media="(device-width: ${splash.width/2}px) and (device-height: ${splash.height/2}px) and (-webkit-device-pixel-ratio: 2)">`
).join('\n')}
\`\`\`

## Testing

Test splash screens on various iOS devices and orientations to ensure proper display.
`;

  fs.writeFileSync(readmePath, readmeContent);
  console.log('✓ Created splash screens README.md');
}

// Run the appropriate function
if (require.main === module) {
  generateSplashScreens();
}

module.exports = { generateSplashScreens, createPlaceholderSplashScreens };