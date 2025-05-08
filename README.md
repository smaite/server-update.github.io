# NepalBooks Update Server

A local update server for NepalBooks application that provides a self-hosted alternative to GitHub releases for distributing updates.

## Setup

1. Install dependencies:
   ```
   cd server-update
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

The server will run on port 3005 by default. You can change this by setting the `PORT` environment variable.

## Server Endpoints

The update server exposes the following endpoints:

- **GET /api/updates/latest** - Returns information about the latest release
- **GET /api/updates/version/:version** - Returns information about a specific version
- **POST /api/admin/publish** - Admin endpoint to publish a new release

## Directory Structure

- `public/downloads/` - Place your application binaries here
- `releases/` - Contains release metadata JSON files
- `server.js` - The main server script
- `admin.js` - Admin utility for managing releases

## Using the Admin Tool

The admin tool provides a command-line interface to manage releases:

```
node admin.js
```

This will show a menu with options to:

1. Create a new release
2. List all releases
3. Set which release is considered "latest"
4. Delete a release

## Connecting the Application

To use this local update server with your NepalBooks application, modify the `updateServerUrl` in the `UpdateService.ts` file:

```typescript
// src/services/UpdateService.ts
private updateServerUrl: string = 'http://localhost:3005/api/updates/latest';
```

For production, you would change this to your hosted server URL.

## Testing Updates

To test the update flow:

1. Build your application with a lower version number (e.g., v1.0.1)
2. Install that version
3. Create a new release on the update server with a higher version number (e.g., v1.0.2)
4. Start the application and it should detect the update

## Example Release Format

```json
{
  "tag_name": "v1.0.2",
  "name": "NepalBooks v1.0.2",
  "body": "- Added: Feature 1\n- Fixed: Bug 1\n- Improved: Performance",
  "published_at": "2023-05-01T10:00:00Z",
  "assets": [
    {
      "platform": "win",
      "browser_download_url": "http://localhost:3005/downloads/NepalBooks-1.0.2-win.exe",
      "name": "NepalBooks-1.0.2-win.exe"
    },
    {
      "platform": "mac",
      "browser_download_url": "http://localhost:3005/downloads/NepalBooks-1.0.2-mac.dmg",
      "name": "NepalBooks-1.0.2-mac.dmg"
    },
    {
      "platform": "linux",
      "browser_download_url": "http://localhost:3005/downloads/NepalBooks-1.0.2-linux.AppImage",
      "name": "NepalBooks-1.0.2-linux.AppImage"
    }
  ],
  "mandatory": false
}
``` 