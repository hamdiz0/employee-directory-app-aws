require('dotenv').config();

const http = require('http');
const app = require('./app');
const constants = require('./api/common/constants');

const server = http.createServer(app);

server.listen(constants.PORT, () => {
  console.log(`Server listening on port: ${constants.PORT}`);
  console.log('Env. Variables: ');
  console.log(constants);
});
