const fs = require('fs');
const path = require('path');

// Function to recursively find all JS/JSX files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix localhost URLs in a file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace hardcoded localhost URLs with API configuration
    if (content.includes('http://localhost:8000')) {
      // Add import if not present
      if (!content.includes("import { API_BASE_URL } from '../config/api'") && 
          !content.includes("import { API_BASE_URL } from '../../config/api'") &&
          !content.includes("import { API_BASE_URL } from '../../../config/api'")) {
        
        // Determine relative path to config/api
        const relativePath = path.relative(path.dirname(filePath), 'src/config').replace(/\\/g, '/');
        const importStatement = `import { API_BASE_URL } from '${relativePath}/api';\n`;
        
        // Find the first import statement and add after it
        const importMatch = content.match(/^import.*$/m);
        if (importMatch) {
          const insertIndex = content.indexOf(importMatch[0]) + importMatch[0].length;
          content = content.slice(0, insertIndex) + '\n' + importStatement + content.slice(insertIndex);
        }
      }
      
      // Replace localhost URLs
      content = content.replace(
        /http:\/\/localhost:8000\/api\/([^'"]+)/g,
        '`${API_BASE_URL}/api/$1`'
      );
      
      // Fix template literals that might have been created incorrectly
      content = content.replace(/`\$\{API_BASE_URL\}\/api\/([^`]+)`/g, '`${API_BASE_URL}/api/$1`');
      
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('🔍 Finding all JS/JSX files...');
const files = findFiles('./src');
console.log(`📁 Found ${files.length} files to check`);

let fixedCount = 0;
files.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n🎉 Fixed ${fixedCount} files!`);
console.log('📝 Now commit and deploy these changes to Vercel');
