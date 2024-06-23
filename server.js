const http = require('http');
const qs = require('qs');
const stringToType = require('string-to-type');

const functions = require('./servable');
const { respond, intsToRangeArray } = require('./utils');

const createServer = () => {
  const server = http.createServer(async (req, res) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      const { url, headers } = req;
      const { 'content-type': contentType } = headers;

      switch(contentType) {
        case 'application/json':
          body = JSON.parse(body);
          break;
        case 'application/x-www-form-urlencoded':
          body = qs.parse(body, {
            decoder: (str, decoder, charset) => {
              const decoded = decoder(str, charset);
              return stringToType(decoded);
            },
          });
          break;
      }
      // console.log(body);
      
      const funcName = url.split('/').pop();

      const func = functions[funcName];

      console.log(func);

      if (!func) {
        return respond(res, 404, { message: `Endpoint not supported: ${ req.url }` });
      }

      // Pass on the parsed body to the function
      const parsedReq = {
        ...req,
        body,
        // Not sure why we need this but it's undefined otherwise
        headers,
      };

      let result;

      try {
        return await func(parsedReq, res);
      } catch(err) {
        console.error(err);
        result = err;
      }
      
      return respond(res, 500, { result });
    });
  });

  return server;
};

const { PORT = 8000 } = process.env;

const maxPort = parseInt(PORT) + 5;
const ports = intsToRangeArray(PORT, maxPort);

for (port of ports) {
  const server = createServer();
  server.listen(port, console.log(`Server running on port ${ port }`));  
}
