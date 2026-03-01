const http = require('http');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const screenshot = require('screenshot-desktop');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public'); // public folder

const pages = ['BlankPage'];
let currentPage = 'BlankPage';
let DATASTORE = `${currentPage}.json`;

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  const filePath = path.join(PUBLIC_DIR, DATASTORE);
  const readFile = JSON.parse(fs.readFileSync(filePath, 'utf8')); // data store

  if (req.method === 'GET' && req.url === '/downloadImage') {
    screenshot({ filename: path.join(PUBLIC_DIR, 'screenshot.jpeg') });

    const file = fs.readFileSync(path.join(PUBLIC_DIR, 'screenshot.jpeg'));

    // Send file as download
    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Content-Disposition': 'attachment; filename="screenshot.jpeg"',
      'Content-Length': file.length
    });

      res.end(file);
  }


  if (req.method === 'GET' && req.url === '/getPages') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ Pages: pages, CurrentPage: currentPage }));
  }

  if (req.method === 'POST' && req.url === '/changePage') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      const page = JSON.parse(body).Page;
      if (pages.includes(page)) {
        currentPage = page;
        DATASTORE = `/${currentPage}.json`;
        res.writeHead(302, { Location: `/${currentPage}` });
        res.end();
      }
    });
  }

  if (req.method === 'POST' && req.url === '/createPage') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      const page = JSON.parse(body).Page;
      if (pages.includes(page)) {

        res.writeHead(304, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ text: "no change" }));
      }

      pages.push(page);

      const htmlFile = path.join(PUBLIC_DIR, `/BlankPage.html`);
      const content = fs.readFileSync(htmlFile, 'utf8');
      const htmlFilePath = path.join(PUBLIC_DIR, `/${page}.html`);

      // Create HTML
      fs.writeFile(htmlFilePath, content, { flag: 'w+' }, (err) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: "Failed to save file" }));
        }
      });

      jsonData = fs.readFileSync(path.join(PUBLIC_DIR, `/datastore.json`), 'utf8');
      const filePath = path.join(PUBLIC_DIR, `/${page}.json`);

      // Create Datastore
      fs.writeFileSync(filePath, jsonData, { flag: 'w+' }, (err) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: "Failed to save file" }));
        }
      });

      res.end();
    });
  }

  if (req.method === 'POST' && req.url === '/saveSettings') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      const data = JSON.parse(body);
      if (data === null || data === undefined) {
        console.error("No data sent");
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: "No data sent" }));
      }
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8')); // data store
      const settings = jsonData.Settings;

      settings[data.Settings.Category] = data.Settings.Value;
      jsonData.Settings[data.Settings.Category] = settings[data.Settings.Category];
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: "Failed to save file" }));
        }
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
    });
  }

  if (req.method === 'POST' && req.url === '/saveValueBox') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      const data = JSON.parse(body);
      if (data === null || data === undefined) {
        console.error("No data sent");
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: "No data sent" }));
      }
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8')); // data store
      const symptoms = jsonData.Symptoms;

      if (data.Category === 'Water-quality')
        data.Category = "Water quality";

      const symptom = symptoms[data.Category]?.filter(d => d.DiseaseName === data.DiseaseName)[0];
      const index = symptoms[data.Category]?.findIndex(d => d.DiseaseName === data.DiseaseName);
      symptom.Value = data.Value;

      jsonData.Symptoms[data.Category][index] = symptom;
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: "Failed to save file" }));
        }
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
    });
  }

  if (req.method === 'POST' && req.url === '/saveFieldStyles') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      const data = JSON.parse(body);
      if (data === null || data === undefined) {
        console.error("No data sent");
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: "No data sent" }));
      }
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8')); // data store
      const fields = jsonData.Fields;

      fields[data?.id] = data;
      jsonData.Fields[data?.id] = fields[data.id];
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: "Failed to save file" }));
        }
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
    });
  }

  if (req.method === 'POST' && req.url === '/getUpdatedTextStyle') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      const data = JSON.parse(body);
      if (data === null || data === undefined) {
        console.error("No data sent");
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: "No data sent" }));
      }
      const updatedText = { updatedText: chalk.italic.greenBright.bold(data.selectedText) };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(updatedText));
    });
  }

  if (req.method === 'POST' && req.url === '/delete') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      const data = JSON.parse(body);
      if (data === null || data === undefined) {
        console.error("No data sent");
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: "No data sent" }));
      }

      try {
        const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8')); // data store
        const symptoms = jsonData.Symptoms;
        if (data.container === 'Water-quality') {
          if (symptoms['Water quality']?.some(d => d.DiseaseName !== data.symptom.DiseaseName)) {
            symptoms['Water quality'] = data.symptom;
            jsonData.Symptoms['Water quality'] = symptoms['Water quality'];
            fs.writeFileSync(filePath, JSON.stringify(jsonData), (err) => {
              if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: "Failed to save file" }));
              }
            });
          }
        }
        else {
          if (symptoms[data.container]?.some(d => d.DiseaseName !== data.symptom.DiseaseName)) {
            symptoms[data.container] = data.symptom;
            jsonData.Symptoms[data.container] = symptoms[data.container];
            fs.writeFileSync(filePath, JSON.stringify(jsonData), (err) => {
              if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: "Failed to save file" }));
              }
            });
          }
        }

      } catch (error) {
        console.error('Error processing data:', error);
        return;
      }
    });
  }

  if (req.method === 'GET' && req.url === '/getDatastore') {

    if (readFile === null || readFile === undefined) {
      console.error("No file found");
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: "No file found" }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(readFile));
  }

  if (req.method === 'POST' && req.url === '/save') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      const data = JSON.parse(body);
      if (data === null || data === undefined) {
        console.error("No data sent");
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: "No data sent" }));
      }

      try {
        const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8')); // data store
        const symptoms = jsonData.Symptoms;

        if (data.container === 'Water-quality') {
          if (!symptoms['Water quality']?.some(d => d.DiseaseName === data.symptom.DiseaseName)) {
            symptoms['Water quality']?.push(data.symptom);
            jsonData.Symptoms = symptoms;
            fs.writeFileSync(filePath, JSON.stringify(jsonData));
          }
        }
        else {
          if (!symptoms[data.container].some(d => d.DiseaseName === data.symptom.DiseaseName)) {
            symptoms[data.container].push(data.symptom);
            jsonData.Symptoms = symptoms;
            fs.writeFileSync(filePath, JSON.stringify(jsonData));
          }
        }

      } catch (error) {
        console.error('Error processing data:', error);
        return;
      }
    });
  }
  // Default to index.html if root
  let requestedFile = req.url === '/' ? `/${currentPage}.html` : req.url;
  const htmlFilePath = path.join(PUBLIC_DIR, requestedFile);
  const ext = path.extname(htmlFilePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream'; // fix

  fs.readFile(htmlFilePath, 'utf8', (err, data) => {
    if (err) {
      // res.writeHead(404, { 'Content-Type': 'text/plain' });
      //  res.writeHead(302, { Location: `/BlankPage.html` });
      res.end('404 Not Found');
      // console.error('404 not found')
    } else {
      //res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });



});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});




















