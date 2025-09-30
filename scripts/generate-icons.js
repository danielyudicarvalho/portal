#!/usr/bin/env node

/**
 * Icon Generation Script for PWA
 * 
 * This script generates PNG icons in various sizes from the base SVG icon.
 * Run with: node scripts/generate-icons.js
 * 
 * Requirements:
 * - sharp package for image processing
 * - Install with: npm install sharp --save-dev
 */

const fs = require('fs');
const path = require('path');

// Icon sizes required for PWA
const ICON_SIZES = [
  72, 96, 128, 144, 152, 192, 384, 512
];

// Additional sizes for iOS splash screens
const SPLASH_SIZES = [
  { width: 640, height: 1136, name: 'splash-640x1136' }, // iPhone 5
  { width: 750, height: 1334, name: 'splash-750x1334' }, // iPhone 6/7/8
  { width: 828, height: 1792, name: 'splash-828x1792' }, // iPhone 11
  { width: 1125, height: 2436, name: 'splash-1125x2436' }, // iPhone X
  { width: 1242, height: 2208, name: 'splash-1242x2208' }, // iPhone 6/7/8 Plus
  { width: 1242, height: 2688, name: 'splash-1242x2688' }, // iPhone 11 Pro Max
  { width: 1536, height: 2048, name: 'splash-1536x2048' }, // iPad
  { width: 1668, height: 2224, name: 'splash-1668x2224' }, // iPad Pro 10.5"
  { width: 1668, height: 2388, name: 'splash-1668x2388' }, // iPad Pro 11"
  { width: 2048, height: 2732, name: 'splash-2048x2732' }, // iPad Pro 12.9"
];

async function generateIcons() {
  try {
    // Check if sharp is available
    let sharp;
    try {
      sharp = require('sharp');
    } catch (error) {
      console.error('Sharp package not found. Please install it with: npm install sharp --save-dev');
      process.exit(1);
    }

    const svgPath = path.join(__dirname, '../public/icons/icon-base.svg');
    const iconsDir = path.join(__dirname, '../public/icons');

    // Ensure icons directory exists
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
    }

    console.log('Generating PWA icons...');

    // Generate square icons
    for (const size of ICON_SIZES) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated ${size}x${size} icon`);
    }

    // Generate favicon
    await sharp(svgPath)
      .resize(32, 32)
      .png()
      .toFile(path.join(__dirname, '../public/favicon.png'));
    
    console.log('✓ Generated favicon.png');

    // Generate Apple touch icon
    await sharp(svgPath)
      .resize(180, 180)
      .png()
      .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
    
    console.log('✓ Generated apple-touch-icon.png');

    console.log('\n🎉 All icons generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Replace the generated placeholder icons with your actual app icons');
    console.log('2. Ensure all icons follow PWA guidelines for maskable icons');
    console.log('3. Test the icons on various devices and browsers');

  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

// Create placeholder PNG icons if sharp is not available
function createPlaceholderIcons() {
  console.log('Creating placeholder icon files...');
  console.log('Note: These are placeholder files. Run "npm install sharp --save-dev" and re-run this script to generate actual PNG icons.');

  const iconsDir = path.join(__dirname, '../public/icons');
  
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Create placeholder files
  for (const size of ICON_SIZES) {
    const placeholderPath = path.join(iconsDir, `icon-${size}x${size}.png.placeholder`);
    fs.writeFileSync(placeholderPath, `Placeholder for ${size}x${size} icon. Install sharp to generate actual PNG files.`);
    console.log(`✓ Created placeholder for ${size}x${size} icon`);
  }

  // Create README for manual icon generation
  const readmePath = path.join(iconsDir, 'README.md');
  const readmeContent = `# PWA Icons

This directory contains the icons for the Progressive Web App.

## Required Icon Sizes

The following icon sizes are required for optimal PWA support:

${ICON_SIZES.map(size => `- ${size}x${size}px`).join('\n')}

## Generating Icons

1. Install sharp: \`npm install sharp --save-dev\`
2. Run the generation script: \`node scripts/generate-icons.js\`

## Manual Icon Creation

If you prefer to create icons manually:

1. Create PNG files for each required size
2. Ensure icons are square and follow PWA maskable icon guidelines
3. Use the base SVG (\`icon-base.svg\`) as a reference
4. Test icons on various devices and browsers

## Icon Guidelines

- Icons should work well as maskable icons (safe zone in center 80%)
- Use consistent branding and colors
- Ensure good contrast and visibility at small sizes
- Test on both light and dark backgrounds
`;

  fs.writeFileSync(readmePath, readmeContent);
  console.log('✓ Created icons README.md');
}

// Run the appropriate function based on sharp availability
if (require.main === module) {
  try {
    require('sharp');
    generateIcons();
  } catch (error) {
    createPlaceholderIcons();
  }
}

module.exports = { generateIcons, createPlaceholderIcons };