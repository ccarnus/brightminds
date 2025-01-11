const https = require('https');
const http = require('http');
const fs = require('fs');
const app = require('./app');

const PORT = process.env.PORT || 3000;

const options = {
  key: fs.readFileSync('/home/ubuntu/server.key'),
  cert: fs.readFileSync('/home/ubuntu/server.crt')
};

const httpServer = http.createServer((req, res) => {
    res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
    res.end();
  });

httpServer.listen(80, () => {
console.log('HTTP server running, redirecting all traffic to HTTPS');
});

const server = https.createServer(options, app);

server.listen(PORT, () => {
  console.log(`Server is running on https://localhost:${PORT}`);
});
