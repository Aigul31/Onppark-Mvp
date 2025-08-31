const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = process.env.PORT || 5000;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // API Routes
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
    
    // Эндпоинт для статуса (GET /api/status)
    if (pathname === '/api/status' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'active' }));
      return;
    }
    
    // Эндпоинт для статусов (GET /api/statuses)
    if (pathname === '/api/statuses' && req.method === 'GET') {
      const statuses = [
        { id: 'coffee', name: 'Кофе', icon: '☕' },
        { id: 'walk', name: 'Прогулка', icon: '🚶‍♀️' },
        { id: 'travel', name: 'Путешествие', icon: '✈️' },
        { id: 'business', name: 'Бизнес', icon: '💼' },
        { id: 'study', name: 'Учеба', icon: '📚' }
      ];
      res.writeHead(200);
      res.end(JSON.stringify(statuses));
      return;
    }
    
    // Загрузка профилей (GET /api/profiles)
    if (pathname === '/api/profiles' && req.method === 'GET') {
      const profiles = [
        { name: 'Ая', age: 25, interests: ['Events', 'co-travel', 'стартап'] },
        { name: 'Stefan', age: 36, interests: ['Hiking', 'co-travelling'] },
        { name: 'Алиса', age: 27, interests: ['Walking', 'Nature'] },
        { name: 'Асем', age: 29, interests: ['Coffee', 'Contents'] },
        { name: 'Саша', age: 40, interests: ['Business', 'Events'] },
      ];
      res.writeHead(200);
      res.end(JSON.stringify(profiles));
      return;
    }
    
    // Отправка статуса (POST /api/status)
    if (pathname === '/api/status' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const statusData = JSON.parse(body);
          console.log('Received status:', statusData);
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, message: 'Статус сохранён!' }));
        } catch (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        }
      });
      return;
    }
    
    // 404 для неизвестных API эндпоинтов
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
    return;
  }

  // Static file serving
  let filePath = '.' + pathname;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found, serve index.html for SPA routing
        fs.readFile('./index.html', (error, content) => {
          if (error) {
            res.writeHead(500);
            res.end('Server Error');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
});