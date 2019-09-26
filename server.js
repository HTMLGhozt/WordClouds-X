const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');
const path = require('path');
const querystring = require('querystring');
const stream = require('stream');

const mimeType = {
  '.ico': 'image/x-icon',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.eot': 'appliaction/vnd.ms-fontobject',
  '.ttf': 'aplication/font-sfnt'
};

const server = http.createServer((request, response) => {
  console.info(`${request.method} ${request.url}`);

  const parsedUrl = url.parse(request.url);

  const sanitizedPath = path
    .normalize(parsedUrl.pathname)
    .replace(/^(\.\.[\/\\])+/, '');

  const isApi = /^\/api\//.test(sanitizedPath);

  if (isApi) {
    const subpath = /^\/api\/([^\/]+)\//.exec(sanitizedPath)[1];
    
    switch (subpath) {
      case 'site':
        const { site } = querystring.parse(parsedUrl.query);
        if (site) return getBodyFromUrl(response, site);
        break;
      default:
    }
  }

  let pathname = path.join(__dirname, 'public', sanitizedPath);
  
  if (!fs.existsSync(pathname)) {
    response.statusCode = 404;
    response.end(`${sanitizedPath} doesn't exist`);
    return;
  }

  if (fs.statSync(pathname).isDirectory()) {
    pathname += '/index.html';
    pathname = pathname.replace(/\/\//g, '/');
  }

  fs.readFile(pathname, (error, data) => {
    if (error) {
      response.statusCode = 500;
      response.end(`Error getting ${sanitizedPath}`);
      return;
    }

    const { ext } = path.parse(pathname);
    response.setHeader('Content-type', mimeType[ext] || 'text/plain');
    response.end(data);
  })
});

const port = process.env.PORT || 8000;

server.listen(port, () => {
  console.info(`Server listening on port: ${port}.`);
});

const getBodyFromUrl = (res, site) => {
  console.info(`Fetching site: ${site}`);
  try {
    https.get(site, response => {
      const { statusCode } = response;
      console.info(`Status code: ${statusCode}`);
      response.setEncoding('utf8');

      let data = '';
      response.on('data', chunk => {
        data += chunk;
      });

      response.on('end', () => {
        const body = data
          .substring(data.indexOf('<body'), data.lastIndexOf('</body>'))
          .replace(/\<script[\s\S]*?\/script>/g, '')
          .replace(/src="[\s\S]*?"/g, '');

        res.setHeader('Content-type', 'text/plain');
        res.end(body);
      });
    });
  } catch (error) {
    console.error(site, error.message);
    res.statusCode = 500;
    res.send(`Error getting ${site}`);
  }
};

