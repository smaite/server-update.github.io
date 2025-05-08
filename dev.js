const { exec } = require('child_process');
const path = require('path');

console.log('Starting Netlify development server...');

// Start Netlify dev server
const netlifyDev = exec('netlify dev', { cwd: path.resolve(__dirname) });

netlifyDev.stdout.on('data', (data) => {
  console.log(data.toString());
});

netlifyDev.stderr.on('data', (data) => {
  console.error(data.toString());
});

netlifyDev.on('close', (code) => {
  console.log(`Netlify dev server exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down Netlify dev server...');
  netlifyDev.kill();
  process.exit();
});

console.log('Press Ctrl+C to stop the server.'); 