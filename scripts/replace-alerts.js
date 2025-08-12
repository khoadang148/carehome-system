const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript/TSX files
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to replace alert() calls with toast notifications
function replaceAlerts(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if file already imports toast
  const hasToastImport = content.includes("import { toast } from 'react-toastify'") || 
                        content.includes('import { toast } from "react-toastify"');
  
  // Add toast import if not present
  if (!hasToastImport && content.includes('alert(')) {
    const importMatch = content.match(/import.*from.*['"]react['"]/);
    if (importMatch) {
      content = content.replace(
        importMatch[0],
        `${importMatch[0]}\nimport { toast } from 'react-toastify';`
      );
    } else {
      // Add import at the beginning of the file
      content = `import { toast } from 'react-toastify';\n${content}`;
    }
    modified = true;
  }
  
  // Replace alert() calls with appropriate toast calls
  const alertRegex = /alert\(([^)]+)\)/g;
  let match;
  
  while ((match = alertRegex.exec(content)) !== null) {
    const alertContent = match[1];
    let replacement;
    
    // Determine toast type based on content
    if (alertContent.includes('thành công') || alertContent.includes('✅') || alertContent.includes('success')) {
      replacement = `toast.success(${alertContent})`;
    } else if (alertContent.includes('cảnh báo') || alertContent.includes('⚠️') || alertContent.includes('warning')) {
      replacement = `toast.warning(${alertContent})`;
    } else if (alertContent.includes('thông báo') || alertContent.includes('📋') || alertContent.includes('⭐') || alertContent.includes('info')) {
      replacement = `toast.info(${alertContent})`;
    } else {
      replacement = `toast.error(${alertContent})`;
    }
    
    content = content.replace(match[0], replacement);
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  }
}

// Main execution
const srcDir = path.join(__dirname, '..', 'src');
const tsFiles = findTsFiles(srcDir);

console.log(`Found ${tsFiles.length} TypeScript/TSX files`);

let updatedCount = 0;
tsFiles.forEach(file => {
  try {
    const originalContent = fs.readFileSync(file, 'utf8');
    if (originalContent.includes('alert(')) {
      replaceAlerts(file);
      updatedCount++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log(`\n🎉 Completed! Updated ${updatedCount} files with toast notifications.`);
console.log('\n📝 Next steps:');
console.log('1. Make sure react-toastify is installed: npm install react-toastify');
console.log('2. Add ToastContainer to your layout component');
console.log('3. Import CSS: import "react-toastify/dist/ReactToastify.css"');
console.log('4. Test the application to ensure all notifications work correctly');
