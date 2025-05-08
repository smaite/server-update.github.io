const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to get the path to the releases directory
const getReleasesDirectory = () => {
  // In Netlify Functions, we need to use a different path structure
  if (process.env.NETLIFY) {
    return path.join(__dirname, '..', 'releases');
  }
  
  // For local development
  return path.join(__dirname, '..', '..', 'releases');
};

// Get latest release info
app.get('/api/updates/latest', async (req, res) => {
  try {
    const latestReleasePath = path.join(getReleasesDirectory(), 'latest.json');
    if (fs.existsSync(latestReleasePath)) {
      const releaseData = fs.readJsonSync(latestReleasePath);
      return res.json(releaseData);
    }
    return res.status(404).json({ error: 'No release information found' });
  } catch (error) {
    console.error('Error fetching latest release:', error);
    return res.status(500).json({ error: 'Failed to fetch release information' });
  }
});

// Get specific version info
app.get('/api/updates/version/:version', async (req, res) => {
  try {
    const { version } = req.params;
    const versionPath = path.join(getReleasesDirectory(), `${version}.json`);
    
    if (fs.existsSync(versionPath)) {
      const releaseData = fs.readJsonSync(versionPath);
      return res.json(releaseData);
    }
    return res.status(404).json({ error: `Version ${version} not found` });
  } catch (error) {
    console.error(`Error fetching version ${req.params.version}:`, error);
    return res.status(500).json({ error: 'Failed to fetch version information' });
  }
});

// Admin API to publish a new release - should be protected in production
app.post('/api/admin/publish', async (req, res) => {
  try {
    const { version, notes, publishedAt, downloadUrls, mandatory } = req.body;
    
    if (!version || !downloadUrls) {
      return res.status(400).json({ error: 'Version and downloadUrls are required' });
    }
    
    const releaseInfo = {
      tag_name: `v${version}`,
      name: `NepalBooks v${version}`,
      body: notes || '',
      published_at: publishedAt || new Date().toISOString(),
      assets: Object.entries(downloadUrls).map(([platform, url]) => ({
        platform,
        browser_download_url: url,
        name: `NepalBooks-${version}-${platform}.${platform === 'win' ? 'exe' : (platform === 'mac' ? 'dmg' : 'AppImage')}`
      })),
      mandatory: mandatory || false
    };
    
    // Save to specific version file
    fs.writeJsonSync(path.join(getReleasesDirectory(), `${version}.json`), releaseInfo, { spaces: 2 });
    
    // Update latest release
    fs.writeJsonSync(path.join(getReleasesDirectory(), 'latest.json'), releaseInfo, { spaces: 2 });
    
    return res.json({ success: true, message: `Published version ${version}` });
  } catch (error) {
    console.error('Error publishing release:', error);
    return res.status(500).json({ error: 'Failed to publish release' });
  }
});

// Not Found handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Export the serverless handler
module.exports.handler = serverless(app); 