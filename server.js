const https = require('https');
const http = require('http');
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

// Create HTTP server to redirect traffic to HTTPS
const httpServer = http.createServer((req, res) => {
  const host = req.headers.host; // Extract the host
  res.writeHead(301, { Location: `https://${host}${req.url}` }); // Redirect to HTTPS
  res.end();
});

// Listen on port 80 for HTTP traffic
httpServer.listen(80, () => {
  console.log('HTTP server running, redirecting all traffic to HTTPS');
});
