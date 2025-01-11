const https = require('https');
const fs = require('fs');
const app = require('./app');

const PORT = process.env.PORT || 3000;

const options = {
  key: fs.readFileSync('/home/ubuntu/server.key'),
  cert: fs.readFileSync('/home/ubuntu/server.crt')
};

const server = https.createServer(options, app);

server.listen(PORT, () => {
  console.log(`Server is running on https://localhost:${PORT}`);
});
