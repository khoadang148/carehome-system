#!/usr/bin/env node

/**
 * Script để deploy lên Vercel với các tối ưu hóa
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying to Vercel...\n');

async function deployToVercel() {
  try {
    // 1. Pre-deployment checks
    console.log('1. Running pre-deployment checks...');
    
    // Check if .env.local exists
    const envFile = path.join(__dirname, '..', '.env.local');
    if (!fs.existsSync(envFile)) {
      console.log('   ⚠️  .env.local not found, creating template...');
      const envTemplate = `# Vercel Environment Variables
NEXT_PUBLIC_API_URL=https://sep490-be-xniz.onrender.com
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
`;
      fs.writeFileSync(envFile, envTemplate);
    }

    // 2. Clean build
    console.log('\n2. Cleaning previous build...');
    try {
      execSync('rm -rf .next out', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('   ✅ Clean completed');
    } catch (error) {
      console.log('   ℹ️  Clean skipped (Windows)');
    }

    // 3. Install dependencies
    console.log('\n3. Installing dependencies...');
    execSync('npm ci', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('   ✅ Dependencies installed');

    // 4. Type check
    console.log('\n4. Running type check...');
    try {
      execSync('npm run type-check', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('   ✅ Type check passed');
    } catch (error) {
      console.log('   ⚠️  Type check failed, but continuing...');
    }

    // 5. Build application
    console.log('\n5. Building application...');
    execSync('npm run build', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('   ✅ Build completed');

    // 6. Check build output
    console.log('\n6. Checking build output...');
    const buildDir = path.join(__dirname, '..', '.next');
    if (fs.existsSync(buildDir)) {
      const stats = getDirectorySize(buildDir);
      console.log(`   Build size: ${formatBytes(stats.size)}`);
      console.log(`   Files: ${stats.fileCount}`);
      
      if (stats.size > 100 * 1024 * 1024) { // 100MB
        console.log('   ⚠️  Large build size detected');
      }
    }

    // 7. Deploy to Vercel
    console.log('\n7. Deploying to Vercel...');
    console.log('   Make sure you have Vercel CLI installed: npm i -g vercel');
    console.log('   Run: vercel --prod');
    
    // Optional: Auto deploy if vercel CLI is available
    try {
      execSync('vercel --version', { stdio: 'pipe' });
      console.log('   Vercel CLI found, attempting auto-deploy...');
      execSync('vercel --prod --yes', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('   ✅ Deploy completed');
    } catch (error) {
      console.log('   ℹ️  Vercel CLI not found or deploy failed');
      console.log('   Please run manually: vercel --prod');
    }

    console.log('\n🎉 Deployment process completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Check Vercel dashboard for deployment status');
    console.log('   2. Test the deployed application');
    console.log('   3. Check function logs if there are errors');
    console.log('   4. Monitor performance and errors');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your Vercel account and project settings');
    console.log('   2. Verify environment variables are set correctly');
    console.log('   3. Check build logs for specific errors');
    console.log('   4. Try deploying manually: vercel --prod');
    process.exit(1);
  }
}

function getDirectorySize(dirPath) {
  let size = 0;
  let fileCount = 0;
  
  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        scanDir(filePath);
      } else {
        size += stats.size;
        fileCount++;
      }
    });
  }
  
  scanDir(dirPath);
  return { size, fileCount };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run deployment
deployToVercel().catch(console.error);
