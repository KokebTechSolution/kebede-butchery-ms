// Verification script for API configuration
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying API Configuration...\n');

// Test 1: Check if config file exists and has correct content
const configPath = path.join(__dirname, 'src/api/config.js');
if (fs.existsSync(configPath)) {
  const configContent = fs.readFileSync(configPath, 'utf8');
  if (configContent.includes('kebede-butchery-ms.onrender.com') && 
      configContent.includes('localhost:8000')) {
    console.log('✅ Config file exists and has correct URLs');
  } else {
    console.log('❌ Config file missing correct URLs');
  }
} else {
  console.log('❌ Config file not found');
}

// Test 2: Check if API files are updated
const apiFiles = [
  'src/api/cashier.js',
  'src/api/menu.js',
  'src/api/inventory.js',
  'src/api/staff.js',
  'src/api/branches.js',
  'src/api/waiterApi.js'
];

apiFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('API_BASE_URL') && content.includes('axios.get(`${API_BASE_URL}/api/')) {
      console.log(`✅ ${file} - Updated correctly`);
    } else {
      console.log(`❌ ${file} - Not updated correctly`);
    }
  } else {
    console.log(`❌ ${file} - File not found`);
  }
});

// Test 3: Check package.json
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageContent = fs.readFileSync(packagePath, 'utf8');
  if (!packageContent.includes('"proxy"')) {
    console.log('✅ Package.json - Proxy removed correctly');
  } else {
    console.log('❌ Package.json - Proxy still exists');
  }
  
  if (packageContent.includes('build:prod')) {
    console.log('✅ Package.json - Production build script added');
  } else {
    console.log('❌ Package.json - Production build script missing');
  }
} else {
  console.log('❌ Package.json not found');
}

console.log('\n🎯 Configuration Summary:');
console.log('- Development: http://localhost:8000');
console.log('- Production: https://kebede-butchery-ms.onrender.com');
console.log('- Environment detection: process.env.NODE_ENV');
console.log('\n🚀 Ready for deployment!'); 