const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = walk('src');

const replaceTokens = (str) => {
  return str
    // Backgrounds
    .replace(/\bbg-darkbg\b(?!\/|-)/g, 'bg-gray-50 dark:bg-darkbg')
    .replace(/\bbg-darkbg\/50\b/g, 'bg-gray-50 dark:bg-darkbg/50')
    .replace(/\bbg-darkbg\/80\b/g, 'bg-white/80 dark:bg-darkbg/80')
    .replace(/\bbg-darkbg\/90\b/g, 'bg-white/90 dark:bg-darkbg/90')
    .replace(/\bbg-darkbg\/95\b/g, 'bg-white/95 dark:bg-darkbg/95')
    .replace(/\bbg-darkbg-card\b/g, 'bg-white dark:bg-darkbg-card')
    .replace(/\bbg-darkbg-lighter\b/g, 'bg-gray-100 dark:bg-darkbg-lighter')
    
    // Borders
    .replace(/\bborder-darkbg-lighter\b/g, 'border-gray-200 dark:border-darkbg-lighter')
    .replace(/\bborder-darkbg\b/g, 'border-gray-300 dark:border-darkbg')
    
    // Text
    .replace(/\btext-gray-300\b/g, 'text-gray-600 dark:text-gray-300')
    .replace(/\btext-gray-400\b/g, 'text-gray-500 dark:text-gray-400')
    .replace(/\btext-white\b/g, 'text-gray-900 dark:text-white')
};

let modifiedCount = 0;
files.forEach(file => {
  const original = fs.readFileSync(file, 'utf8');
  
  let newContent = original;
  
  // Clean up any existing dark: variants to avoid dark:dark:
  newContent = newContent
    .replace(/bg-white dark:bg-darkbg-card/g, 'bg-darkbg-card')
    .replace(/bg-gray-50 dark:bg-darkbg/g, 'bg-darkbg')
    .replace(/bg-white\/95 dark:bg-darkbg\/95/g, 'bg-darkbg/95')
    .replace(/text-gray-900 dark:text-white/g, 'text-white')
    .replace(/text-gray-600 dark:text-gray-300/g, 'text-gray-300')
    .replace(/text-gray-500 dark:text-gray-400/g, 'text-gray-400')
    .replace(/border-gray-200 dark:border-darkbg-lighter/g, 'border-darkbg-lighter')
    .replace(/border-gray-300 dark:border-darkbg/g, 'border-darkbg');

  newContent = replaceTokens(newContent);
  
  // Fix buttons that have bg-primary with text-gray-900 dark:text-white -> should just be text-white
  newContent = newContent.replace(/bg-primary-500([^>]*?)text-gray-900 dark:text-white/g, 'bg-primary-500$1text-white');
  newContent = newContent.replace(/bg-primary-600([^>]*?)text-gray-900 dark:text-white/g, 'bg-primary-600$1text-white');
  newContent = newContent.replace(/bg-rose-500([^>]*?)text-gray-900 dark:text-white/g, 'bg-rose-500$1text-white');
  newContent = newContent.replace(/bg-rose-600([^>]*?)text-gray-900 dark:text-white/g, 'bg-rose-600$1text-white');

  // Fix header text-white inside the Sparkles layout (it shouldn't be text-gray-900 dark:text-white on the discount banner)
  newContent = newContent.replace(/bg-primary-500 text-gray-900 dark:text-white/g, 'bg-primary-500 text-white');

  if (newContent !== original) {
    fs.writeFileSync(file, newContent);
    modifiedCount++;
  }
});

console.log(`Successfully modified ${modifiedCount} files for Light Mode support.`);
