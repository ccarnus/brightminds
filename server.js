const https = require('https');
const fs = require('fs');
const app = require('./app');

// HTTPS configuration
const PORT = process.env.PORT || 443;
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/api.brightmindsresearch.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/api.brightmindsresearch.com/fullchain.pem'),
};

// Create HTTPS server
const httpsServer = https.createServer(options, app);

httpsServer.listen(PORT, () => {
  console.log(`Server is running on https://localhost:${PORT}`);
});
