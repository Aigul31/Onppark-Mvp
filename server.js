const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { getAllProfiles, createProfile, getAllStatuses, createStatus } = require('./database.js');

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

const server = http.createServer(async (req, res) => {
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
    
    // Эндпоинт для статусов (GET /api/statuses) - реальные данные из Supabase
    if (pathname === '/api/statuses' && req.method === 'GET') {
      try {
        const statuses = await getAllStatuses();
        res.writeHead(200);
        res.end(JSON.stringify(statuses));
      } catch (error) {
        console.error('Error fetching statuses:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to fetch statuses' }));
      }
      return;
    }
    
    // Загрузка профилей (GET /api/profiles) - реальные данные из Supabase
    if (pathname === '/api/profiles' && req.method === 'GET') {
      try {
        const profiles = await getAllProfiles();
        res.writeHead(200);
        res.end(JSON.stringify(profiles));
      } catch (error) {
        console.error('Error fetching profiles:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to fetch profiles' }));
      }
      return;
    }
    
    // Создание профиля (POST /api/profiles)
    if (pathname === '/api/profiles' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const profileData = JSON.parse(body);
          console.log('Received profile:', profileData);
          
          // Сохраняем в Supabase
          const savedProfile = await createProfile(profileData);
          
          res.writeHead(200);
          res.end(JSON.stringify({ 
            success: true, 
            message: 'Профиль сохранён в Supabase!', 
            data: savedProfile 
          }));
        } catch (error) {
          console.error('Error saving profile:', error);
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, error: 'Failed to save profile' }));
        }
      });
      return;
    }

    // Отправка статуса (POST /api/status) - сохранение в Supabase
    if (pathname === '/api/status' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const statusData = JSON.parse(body);
          console.log('Received status:', statusData);
          
          // Сохраняем в Supabase
          const savedStatus = await createStatus(statusData);
          
          res.writeHead(200);
          res.end(JSON.stringify({ 
            success: true, 
            message: 'Статус сохранён в Supabase!', 
            data: savedStatus 
          }));
        } catch (error) {
          console.error('Error saving status:', error);
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, error: 'Failed to save status' }));
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