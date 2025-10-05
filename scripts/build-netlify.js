import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { mnemonicToAccount } from 'viem/accounts';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config({ path: '.env' });

async function lookupFidByCustodyAddress(custodyAddress, apiKey) {
  if (!apiKey) {
    throw new Error('Neynar API key is required');
  }
  const lowerCasedCustodyAddress = custodyAddress.toLowerCase();

  const response = await fetch(
    `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${lowerCasedCustodyAddress}&address_types=custody_address`,
    {
      headers: {
        'accept': 'application/json',
        'x-api-key': 'FARCASTER_V2_FRAMES_DEMO'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to lookup FID: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data[lowerCasedCustodyAddress]?.length || !data[lowerCasedCustodyAddress][0].custody_address) {
    throw new Error('No FID found for this custody address');
  }

  return data[lowerCasedCustodyAddress][0].fid;
}

async function queryNeynarApp(apiKey) {
  if (!apiKey) {
    return null;
  }
  try {
    const response = await fetch(
      `https://api.neynar.com/portal/app_by_api_key`,
      {
        headers: {
          'x-api-key': apiKey
        }
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error querying Neynar app data:', error);
    return null;
  }
}

async function validateSeedPhrase(seedPhrase) {
  try {
    // Try to create an account from the seed phrase
    const account = mnemonicToAccount(seedPhrase);
    return account.address;
  } catch (error) {
    throw new Error('Invalid seed phrase');
  }
}

async function generateFarcasterMetadata(domain, fid, accountAddress, seedPhrase, webhookUrl) {
  const header = {
    type: 'custody',
    key: accountAddress,
    fid,
  };
  const encodedHeader = Buffer.from(JSON.stringify(header), 'utf-8').toString('base64');

  const payload = {
    domain
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');

  const account = mnemonicToAccount(seedPhrase);
  const signature = await account.signMessage({ 
    message: `${encodedHeader}.${encodedPayload}`
  });
  const encodedSignature = Buffer.from(signature, 'utf-8').toString('base64url');

  const tags = process.env.NEXT_PUBLIC_FRAME_TAGS?.split(',');

  return {
    accountAssociation: {
      header: encodedHeader,
      payload: encodedPayload,
      signature: encodedSignature
    },
    frame: {
      version: "1",
      name: process.env.NEXT_PUBLIC_FRAME_NAME,
      iconUrl: `https://${domain}/icon.png`,
      homeUrl: `https://${domain}`,
      imageUrl: `https://${domain}/api/opengraph-image`,
      buttonTitle: process.env.NEXT_PUBLIC_FRAME_BUTTON_TEXT,
      splashImageUrl: `https://${domain}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
      webhookUrl,
      description: process.env.NEXT_PUBLIC_FRAME_DESCRIPTION,
      primaryCategory: process.env.NEXT_PUBLIC_FRAME_PRIMARY_CATEGORY,
      tags,
    },
  };
}

async function main() {
  try {
    console.log('\n📝 Building for Netlify deployment...');
    
    // Get required environment variables
    const domain = process.env.NEXT_PUBLIC_URL?.replace(/^https?:\/\//, '') || process.env.NETLIFY_DOMAIN;
    const frameName = process.env.NEXT_PUBLIC_FRAME_NAME;
    const buttonText = process.env.NEXT_PUBLIC_FRAME_BUTTON_TEXT || 'Launch Mini App';
    const seedPhrase = process.env.SEED_PHRASE;
    const neynarApiKey = process.env.NEYNAR_API_KEY;
    
    // Validate required environment variables
    if (!domain) {
      throw new Error('NEXT_PUBLIC_URL or NETLIFY_DOMAIN environment variable is required');
    }
    
    if (!frameName) {
      throw new Error('NEXT_PUBLIC_FRAME_NAME environment variable is required');
    }
    
    if (!seedPhrase) {
      throw new Error('SEED_PHRASE environment variable is required');
    }

    console.log(`✅ Using domain: ${domain}`);
    console.log(`✅ Using frame name: ${frameName}`);
    console.log(`✅ Using button text: ${buttonText}`);

    // Validate seed phrase and get account address
    const accountAddress = await validateSeedPhrase(seedPhrase);
    console.log('✅ Generated account address from seed phrase');

    // Get Neynar client ID if API key is provided
    let neynarClientId = process.env.NEYNAR_CLIENT_ID;
    if (neynarApiKey && !neynarClientId) {
      const appInfo = await queryNeynarApp(neynarApiKey);
      if (appInfo) {
        neynarClientId = appInfo.app_uuid;
        console.log('✅ Fetched Neynar app client ID');
      }
    }

    const fid = await lookupFidByCustodyAddress(accountAddress, neynarApiKey ?? 'FARCASTER_V2_FRAMES_DEMO');

    // Generate and sign manifest
    console.log('\n🔨 Generating mini app manifest...');
    
    // Determine webhook URL based on environment variables
    const webhookUrl = neynarApiKey && neynarClientId 
      ? `https://api.neynar.com/f/app/${neynarClientId}/event`
      : `${domain}/api/webhook`;

    const metadata = await generateFarcasterMetadata(domain, fid, accountAddress, seedPhrase, webhookUrl);
    console.log('\n✅ Mini app manifest generated and signed');

    // Read existing .env file or create new one
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const projectRoot = path.join(__dirname, '..');
    const envPath = path.join(projectRoot, '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    // Add or update environment variables
    const newEnvVars = [
      // Base URL
      `NEXT_PUBLIC_URL=https://${domain}`,

      // Frame metadata
      `NEXT_PUBLIC_FRAME_NAME="${frameName}"`,
      `NEXT_PUBLIC_FRAME_DESCRIPTION="${process.env.NEXT_PUBLIC_FRAME_DESCRIPTION || ''}"`,
      `NEXT_PUBLIC_FRAME_PRIMARY_CATEGORY="${process.env.NEXT_PUBLIC_FRAME_PRIMARY_CATEGORY || ''}"`,
      `NEXT_PUBLIC_FRAME_TAGS="${process.env.NEXT_PUBLIC_FRAME_TAGS || ''}"`,
      `NEXT_PUBLIC_FRAME_BUTTON_TEXT="${buttonText}"`,

      // Analytics
      `NEXT_PUBLIC_ANALYTICS_ENABLED="${process.env.NEXT_PUBLIC_ANALYTICS_ENABLED || 'false'}"`,

      // Neynar configuration (if it exists in current env)
      ...(neynarApiKey ? 
        [`NEYNAR_API_KEY="${neynarApiKey}"`] : []),
      ...(neynarClientId ? 
        [`NEYNAR_CLIENT_ID="${neynarClientId}"`] : []),

      // FID (if it exists in current env)
      ...(process.env.FID ? [`FID="${process.env.FID}"`] : []),
      `NEXT_PUBLIC_USE_WALLET="${process.env.NEXT_PUBLIC_USE_WALLET || 'false'}"`,

      // NextAuth configuration
      `NEXTAUTH_SECRET="${process.env.NEXTAUTH_SECRET || crypto.randomBytes(32).toString('hex')}"`,
      `NEXTAUTH_URL="https://${domain}"`,

      // Frame manifest with signature
      `FRAME_METADATA=${JSON.stringify(metadata)}`,
    ];

    // Filter out empty values and join with newlines
    const validEnvVars = newEnvVars.filter(line => {
      const [, value] = line.split('=');
      return value && value !== '""';
    });

    // Update or append each environment variable
    validEnvVars.forEach(varLine => {
      const [key] = varLine.split('=');
      if (envContent.includes(`${key}=`)) {
        envContent = envContent.replace(new RegExp(`${key}=.*`), varLine);
      } else {
        envContent += `\n${varLine}`;
      }
    });

    // Write updated .env file
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Environment variables updated');

    // Run next build
    console.log('\nBuilding Next.js application...');
    const nextBin = path.normalize(path.join(projectRoot, 'node_modules', '.bin', 'next'));
    execSync(`"${nextBin}" build`, { 
      cwd: projectRoot, 
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    console.log('\n✨ Build complete! Your mini app is ready for deployment. 🪐');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
