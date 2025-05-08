const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create directories if they don't exist
const publicDir = path.join(__dirname, 'public');
const releasesDir = path.join(publicDir, 'releases');
fs.ensureDirSync(publicDir);
fs.ensureDirSync(releasesDir);

// Routes

// Get latest release info
app.get('/api/updates/latest', (req, res) => {
  try {
    const latestReleasePath = path.join(__dirname, 'releases', 'latest.json');
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
app.get('/api/updates/version/:version', (req, res) => {
  try {
    const { version } = req.params;
    const versionPath = path.join(__dirname, 'releases', `${version}.json`);
    
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

// Admin API to publish a new release
app.post('/api/admin/publish', (req, res) => {
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
    fs.writeJsonSync(path.join(__dirname, 'releases', `${version}.json`), releaseInfo, { spaces: 2 });
    
    // Update latest release
    fs.writeJsonSync(path.join(__dirname, 'releases', 'latest.json'), releaseInfo, { spaces: 2 });
    
    return res.json({ success: true, message: `Published version ${version}` });
  } catch (error) {
    console.error('Error publishing release:', error);
    return res.status(500).json({ error: 'Failed to publish release' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Update server running on port ${PORT}`);
  console.log(`- Latest release API: http://localhost:${PORT}/api/updates/latest`);
  console.log(`- Version API: http://localhost:${PORT}/api/updates/version/{version}`);
  console.log(`- Admin publish API: POST http://localhost:${PORT}/api/admin/publish`);
}); 