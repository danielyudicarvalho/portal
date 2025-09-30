#!/usr/bin/env node

// Simple script to help identify and fix common TypeScript issues
const fs = require('fs');
const path = require('path');

function findFilesWithAnyType(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const anyMatches = content.match(/:\s*any\b/g);
        if (anyMatches) {
          files.push({
            file: fullPath,
            count: anyMatches.length
          });
        }
      }
    }
  }
  
  traverse(dir);
  return files.sort((a, b) => b.count - a.count);
}

const filesWithAny = findFilesWithAnyType('./src');
console.log('Files with most "any" types:');
filesWithAny.slice(0, 10).forEach(({ file, count }) => {
  console.log(`${count} - ${file}`);
});