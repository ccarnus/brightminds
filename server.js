const https = require('https');
const fs = require('fs');
const app = require('./app');

// HTTPS configuration
const PORT = process.env.PORT || 443;
const options = {
  key: fs.readFileSync('/home/ubuntu/server.key'),
  cert: fs.readFileSync('/home/ubuntu/server.crt'),
};

// Create HTTPS server
const httpsServer = https.createServer(options, app);

httpsServer.listen(PORT, () => {
  console.log(`Server is running on https://localhost:${PORT}`);
});
