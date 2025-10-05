#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Load environment variables
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function checkNetlifyCLI() {
  try {
    execSync('netlify --version', { 
      stdio: 'ignore',
      shell: process.platform === 'win32'
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function installNetlifyCLI() {
  console.log('Installing Netlify CLI...');
  execSync('npm install -g netlify-cli', { 
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
}

async function loginToNetlify() {
  console.log('\n🔑 Netlify Login');
  console.log('You can either:');
  console.log('1. Log in to an existing Netlify account');
  console.log('2. Create a new Netlify account during login\n');
  console.log('If creating a new account:');
  console.log('1. Click "Continue with GitHub"');
  console.log('2. Authorize GitHub access');
  console.log('3. Complete the Netlify account setup in your browser');
  console.log('4. Return here once your Netlify account is created\n');
  
  // Start the login process
  const child = spawn('netlify', ['login'], {
    stdio: 'inherit'
  });

  // Wait for the login process to complete
  await new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        resolve();
      }
    });
  });

  // Verify we're logged in
  console.log('\n📱 Waiting for login to complete...');
  
  for (let i = 0; i < 30; i++) {
    try {
      execSync('netlify status', { stdio: 'ignore' });
      console.log('✅ Successfully logged in to Netlify!');
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.error('\n❌ Login timed out. Please try again.');
  return false;
}

async function setNetlifyEnvVar(key, value) {
  try {
    // Remove existing env var if it exists
    try {
      execSync(`netlify env:unset ${key}`, {
        cwd: projectRoot,
        stdio: 'ignore'
      });
    } catch (error) {
      // Ignore errors from removal (var might not exist)
    }
    
    // Set the new env var
    execSync(`netlify env:set ${key} "${value}"`, {
      cwd: projectRoot,
      stdio: 'inherit'
    });
    return true;
  } catch (error) {
    console.warn(`⚠️  Warning: Failed to set environment variable ${key}:`, error.message);
    return false;
  }
}

async function checkRequiredEnvVars() {
  console.log('\n📝 Checking environment variables...');
  
  const requiredVars = [
    {
      name: 'NEXT_PUBLIC_FRAME_NAME',
      message: 'Enter the name for your frame (e.g., Gratitude Journal):',
      default: process.env.NEXT_PUBLIC_FRAME_NAME || 'Gratitude Journal',
      validate: input => input.trim() !== '' || 'Mini app name cannot be empty'
    },
    {
      name: 'NEXT_PUBLIC_FRAME_BUTTON_TEXT',
      message: 'Enter the text for your frame button:',
      default: process.env.NEXT_PUBLIC_FRAME_BUTTON_TEXT || 'Start Journaling',
      validate: input => input.trim() !== '' || 'Button text cannot be empty'
    },
    {
      name: 'NEYNAR_API_KEY',
      message: 'Enter your Neynar API key (get from https://dev.neynar.com/app):',
      default: process.env.NEYNAR_API_KEY,
      validate: input => input.trim() !== '' || 'Neynar API key is required'
    }
  ];

  const missingVars = requiredVars.filter(varConfig => !process.env[varConfig.name]);
  
  if (missingVars.length > 0) {
    console.log('\n⚠️  Some required information is missing. Let\'s set it up:');
    for (const varConfig of missingVars) {
      const { value } = await inquirer.prompt([
        {
          type: 'input',
          name: 'value',
          message: varConfig.message,
          default: varConfig.default,
          validate: varConfig.validate
        }
      ]);
      process.env[varConfig.name] = value;
    }
  }
}

async function deployToNetlify() {
  try {
    console.log('\n🚀 Deploying to Netlify...');
    
    // Ensure netlify.toml exists
    const netlifyConfigPath = path.join(projectRoot, 'netlify.toml');
    if (!fs.existsSync(netlifyConfigPath)) {
      console.log('📝 Creating netlify.toml configuration...');
      const netlifyConfig = `[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/_next/static/*"
  to = "/_next/static/:splat"
  status = 200

[[redirects]]
  from = "/.well-known/farcaster.json"
  to = "/.well-known/farcaster.json"
  status = 200`;
      
      fs.writeFileSync(netlifyConfigPath, netlifyConfig);
    }

    // Initialize Netlify site if not already done
    try {
      execSync('netlify status', { 
        cwd: projectRoot,
        stdio: 'ignore'
      });
    } catch (error) {
      console.log('\n📦 Initializing Netlify site...');
      execSync('netlify init', { 
        cwd: projectRoot,
        stdio: 'inherit'
      });
    }

    // Set up environment variables
    console.log('\n📝 Setting up environment variables...');
    const envVars = {
      NEXT_PUBLIC_URL: '', // Will be set after deployment
      NEYNAR_API_KEY: process.env.NEYNAR_API_KEY,
      KV_REST_API_URL: process.env.KV_REST_API_URL,
      KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
      NEXT_PUBLIC_FRAME_NAME: process.env.NEXT_PUBLIC_FRAME_NAME,
      NEXT_PUBLIC_FRAME_DESCRIPTION: process.env.NEXT_PUBLIC_FRAME_DESCRIPTION || 'A daily gratitude journal to reflect on the positive moments in your life',
      NEXT_PUBLIC_FRAME_PRIMARY_CATEGORY: process.env.NEXT_PUBLIC_FRAME_PRIMARY_CATEGORY || 'Wellness',
      NEXT_PUBLIC_FRAME_TAGS: process.env.NEXT_PUBLIC_FRAME_TAGS || 'gratitude,journal,wellness,mindfulness',
      NEXT_PUBLIC_FRAME_BUTTON_TEXT: process.env.NEXT_PUBLIC_FRAME_BUTTON_TEXT,
      NEXT_PUBLIC_USE_WALLET: process.env.NEXT_PUBLIC_USE_WALLET || 'false'
    };

    for (const [key, value] of Object.entries(envVars)) {
      if (value) {
        await setNetlifyEnvVar(key, value);
      }
    }

    // Deploy the project
    console.log('\n📦 Deploying to Netlify...');
    execSync('netlify deploy --prod', { 
      cwd: projectRoot,
      stdio: 'inherit'
    });

    // Get the deployment URL
    console.log('\n🔍 Getting deployment URL...');
    const statusOutput = execSync('netlify status', {
      cwd: projectRoot,
      encoding: 'utf8'
    });

    // Extract URL from status output
    const urlMatch = statusOutput.match(/Website URL:\s+(https:\/\/[^\s]+)/);
    if (urlMatch) {
      const deploymentUrl = urlMatch[1];
      console.log(`\n🌐 Deployment URL: ${deploymentUrl}`);
      
      // Update NEXT_PUBLIC_URL with the actual deployment URL
      console.log('\n🔄 Updating NEXT_PUBLIC_URL with deployment URL...');
      await setNetlifyEnvVar('NEXT_PUBLIC_URL', deploymentUrl);
      
      // Redeploy with updated URL
      console.log('\n📦 Redeploying with updated URL...');
      execSync('netlify deploy --prod', { 
        cwd: projectRoot,
        stdio: 'inherit'
      });
      
      console.log('\n✨ Deployment complete! Your mini app is now live at:');
      console.log(`🌐 ${deploymentUrl}`);
      console.log('\n📝 You can manage your site at https://app.netlify.com');
      console.log('\n🔧 Next steps:');
      console.log('1. Claim ownership at https://farcaster.xyz/~/developers/mini-apps/manifest');
      console.log('2. Add account association environment variables');
      console.log('3. Configure mini-app settings in Farcaster');
      
    } else {
      console.log('\n⚠️  Could not determine deployment URL from status output');
      console.log('Please check your Netlify dashboard for the site URL');
    }

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

async function main() {
  try {
    // Print welcome message
    console.log('🚀 Netlify Mini App Deployment');
    console.log('This script will deploy your mini app to Netlify.');
    console.log('\nThe script will:');
    console.log('1. Check for required environment variables');
    console.log('2. Set up a Netlify site (new or existing)');
    console.log('3. Configure environment variables in Netlify');
    console.log('4. Deploy and build your mini app\n');

    // Check for required environment variables
    await checkRequiredEnvVars();

    // Check and install Netlify CLI if needed
    if (!await checkNetlifyCLI()) {
      console.log('Netlify CLI not found. Installing...');
      await installNetlifyCLI();
    }

    // Login to Netlify
    if (!await loginToNetlify()) {
      console.error('\n❌ Failed to log in to Netlify. Please try again.');
      process.exit(1);
    }

    // Deploy to Netlify
    await deployToNetlify();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
