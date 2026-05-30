import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.html')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = [...walk('./src'), ...walk('./supabase'), './index.html'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  if (content.includes('ر.س')) {
    content = content.replace(/ر\.س/g, 'ج.م');
    changed = true;
  }
  
  if (content.includes('SAR')) {
    content = content.replace(/SAR/g, 'EGP');
    changed = true;
  }
  
  if (content.includes('ar_SA')) {
    content = content.replace(/ar_SA/g, 'ar_EG');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
}
