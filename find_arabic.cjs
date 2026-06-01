const fs = require('fs');
const path = require('path');

const arabicRegex = /[\u0600-\u06FF]/;

function findArabicStrings(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findArabicStrings(fullPath, fileList);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (arabicRegex.test(content)) {
        fileList.push(fullPath.replace(path.join(__dirname, 'src'), '').replace(/\\/g, '/'));
      }
    }
  }
  return fileList;
}

const filesWithArabic = findArabicStrings(path.join(__dirname, 'src'));
console.log(JSON.stringify(filesWithArabic, null, 2));
