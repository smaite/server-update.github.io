const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const releasesDir = path.join(__dirname, 'releases');
const downloadsDir = path.join(__dirname, 'public', 'downloads');

// Ensure directories exist
fs.ensureDirSync(releasesDir);
fs.ensureDirSync(downloadsDir);

function promptQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createRelease() {
  console.log('\n=== Create New Release ===\n');
  
  const version = await promptQuestion('Enter version number (e.g., 1.0.3): ');
  const notes = await promptQuestion('Enter release notes (use \\n for line breaks): ');
  const winUrl = await promptQuestion(`Enter Windows download URL (default: http://localhost:3005/downloads/NepalBooks-${version}-win.exe): `) || 
    `http://localhost:3005/downloads/NepalBooks-${version}-win.exe`;
  const macUrl = await promptQuestion(`Enter macOS download URL (default: http://localhost:3005/downloads/NepalBooks-${version}-mac.dmg): `) || 
    `http://localhost:3005/downloads/NepalBooks-${version}-mac.dmg`;
  const linuxUrl = await promptQuestion(`Enter Linux download URL (default: http://localhost:3005/downloads/NepalBooks-${version}-linux.AppImage): `) || 
    `http://localhost:3005/downloads/NepalBooks-${version}-linux.AppImage`;
  const mandatory = await promptQuestion('Is this update mandatory? (y/n): ');
  
  const releaseInfo = {
    tag_name: `v${version}`,
    name: `NepalBooks v${version}`,
    body: notes,
    published_at: new Date().toISOString(),
    assets: [
      {
        platform: 'win',
        browser_download_url: winUrl,
        name: `NepalBooks-${version}-win.exe`
      },
      {
        platform: 'mac',
        browser_download_url: macUrl,
        name: `NepalBooks-${version}-mac.dmg`
      },
      {
        platform: 'linux',
        browser_download_url: linuxUrl,
        name: `NepalBooks-${version}-linux.AppImage`
      }
    ],
    mandatory: mandatory.toLowerCase() === 'y'
  };
  
  // Save to specific version file
  const versionPath = path.join(releasesDir, `${version}.json`);
  fs.writeJsonSync(versionPath, releaseInfo, { spaces: 2 });
  
  // Update latest release
  const latestPath = path.join(releasesDir, 'latest.json');
  fs.writeJsonSync(latestPath, releaseInfo, { spaces: 2 });
  
  console.log(`\nRelease v${version} created successfully!`);
  console.log(`Files saved to:\n- ${versionPath}\n- ${latestPath}`);
}

async function listReleases() {
  console.log('\n=== Available Releases ===\n');
  
  try {
    const files = fs.readdirSync(releasesDir);
    const releases = files
      .filter(file => file !== 'latest.json' && file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(releasesDir, file);
        const data = fs.readJsonSync(filePath);
        return {
          version: data.tag_name,
          date: new Date(data.published_at).toLocaleString(),
          mandatory: data.mandatory
        };
      })
      .sort((a, b) => {
        const versionA = a.version.replace('v', '').split('.').map(Number);
        const versionB = b.version.replace('v', '').split('.').map(Number);
        
        for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
          const numA = versionA[i] || 0;
          const numB = versionB[i] || 0;
          if (numA !== numB) {
            return numB - numA; // Descending order
          }
        }
        return 0;
      });
    
    if (releases.length === 0) {
      console.log('No releases found.');
    } else {
      console.log('Version\t\tDate\t\t\tMandatory');
      console.log('-------\t\t----\t\t\t---------');
      releases.forEach(release => {
        console.log(`${release.version}\t${release.date}\t${release.mandatory ? 'Yes' : 'No'}`);
      });
    }
  } catch (error) {
    console.error('Error listing releases:', error);
  }
}

async function setLatestRelease() {
  console.log('\n=== Set Latest Release ===\n');
  
  try {
    const files = fs.readdirSync(releasesDir);
    const versions = files
      .filter(file => file !== 'latest.json' && file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
    
    if (versions.length === 0) {
      console.log('No releases found.');
      return;
    }
    
    console.log('Available versions:');
    versions.forEach((version, index) => {
      console.log(`${index + 1}. v${version}`);
    });
    
    const choice = await promptQuestion('\nSelect version number to set as latest: ');
    const index = parseInt(choice, 10) - 1;
    
    if (isNaN(index) || index < 0 || index >= versions.length) {
      console.log('Invalid selection.');
      return;
    }
    
    const selectedVersion = versions[index];
    const versionPath = path.join(releasesDir, `${selectedVersion}.json`);
    const latestPath = path.join(releasesDir, 'latest.json');
    
    // Copy the selected version file to latest.json
    fs.copyFileSync(versionPath, latestPath);
    
    console.log(`\nv${selectedVersion} has been set as the latest release.`);
  } catch (error) {
    console.error('Error setting latest release:', error);
  }
}

async function deleteRelease() {
  console.log('\n=== Delete Release ===\n');
  
  try {
    const files = fs.readdirSync(releasesDir);
    const versions = files
      .filter(file => file !== 'latest.json' && file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
    
    if (versions.length === 0) {
      console.log('No releases found.');
      return;
    }
    
    console.log('Available versions:');
    versions.forEach((version, index) => {
      console.log(`${index + 1}. v${version}`);
    });
    
    const choice = await promptQuestion('\nSelect version number to delete: ');
    const index = parseInt(choice, 10) - 1;
    
    if (isNaN(index) || index < 0 || index >= versions.length) {
      console.log('Invalid selection.');
      return;
    }
    
    const selectedVersion = versions[index];
    const versionPath = path.join(releasesDir, `${selectedVersion}.json`);
    
    // Check if this is the latest release
    const latestPath = path.join(releasesDir, 'latest.json');
    const latestData = fs.readJsonSync(latestPath);
    const isLatest = latestData.tag_name === `v${selectedVersion}`;
    
    // Delete the version file
    fs.unlinkSync(versionPath);
    
    if (isLatest) {
      console.log(`\nWarning: You deleted the latest release. Please set a new latest release.`);
    }
    
    console.log(`\nv${selectedVersion} has been deleted.`);
  } catch (error) {
    console.error('Error deleting release:', error);
  }
}

async function main() {
  console.log('\n=== NepalBooks Update Server Admin ===');
  
  while (true) {
    console.log('\nOptions:');
    console.log('1. Create new release');
    console.log('2. List all releases');
    console.log('3. Set latest release');
    console.log('4. Delete a release');
    console.log('5. Exit');
    
    const choice = await promptQuestion('\nSelect an option: ');
    
    switch (choice) {
      case '1':
        await createRelease();
        break;
      case '2':
        await listReleases();
        break;
      case '3':
        await setLatestRelease();
        break;
      case '4':
        await deleteRelease();
        break;
      case '5':
        console.log('\nExiting...');
        rl.close();
        return;
      default:
        console.log('Invalid option. Please try again.');
    }
  }
}

// Start the admin interface
main().catch(error => {
  console.error('Error:', error);
  rl.close();
}); 