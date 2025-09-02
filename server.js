/* 
 * OnPark Express Server
 * На Vercel статика обслуживается без Express - этот сервер нужен только для разработки.
 * В продакшне API эндпоинты должны быть созданы как Vercel Serverless Functions в папке /api.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { getAllProfiles, createProfile, getAllStatuses, createStatus, updateUserStatus, sendMessage, getMessages } = require('./database.js');
const { ObjectStorageService, ObjectNotFoundError } = require('./objectStorage.js');

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

    // Отправка статуса (POST /api/statuses) - создание нового статуса
    if (pathname === '/api/statuses' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const statusData = JSON.parse(body);
          console.log('Received status:', statusData);
          
          // Сохраняем статус (заменяет предыдущий если есть)
          const savedStatus = await createStatus(statusData);
          
          res.writeHead(200);
          res.end(JSON.stringify({ 
            success: true, 
            message: 'Статус сохранён на 24 часа!', 
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
    
    // Обновление статуса (PUT /api/statuses) - изменение существующего статуса  
    if (pathname === '/api/statuses' && req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const { user_id, ...statusUpdate } = JSON.parse(body);
          console.log('Updating status for user:', user_id, statusUpdate);
          
          // Обновляем статус пользователя
          const updatedStatus = await updateUserStatus(user_id, statusUpdate);
          
          res.writeHead(200);
          res.end(JSON.stringify({ 
            success: true, 
            message: 'Статус обновлён!', 
            data: updatedStatus 
          }));
        } catch (error) {
          console.error('Error updating status:', error);
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, error: 'Failed to update status' }));
        }
      });
      return;
    }
    
    // Отправка сообщения (POST /api/messages)
    if (pathname === '/api/messages' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const { fromUserId, toUserId, message } = JSON.parse(body);
          console.log('Sending message:', { fromUserId, toUserId, message });
          
          const savedMessage = await sendMessage(fromUserId, toUserId, message);
          
          res.writeHead(200);
          res.end(JSON.stringify({ 
            success: true, 
            message: 'Сообщение отправлено!', 
            data: savedMessage 
          }));
        } catch (error) {
          console.error('Error sending message:', error);
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, error: 'Failed to send message' }));
        }
      });
      return;
    }
    
    // Получение сообщений (GET /api/messages?user1=X&user2=Y)
    if (pathname === '/api/messages' && req.method === 'GET') {
      try {
        const query = parsedUrl.query;
        const user1 = query.user1;
        const user2 = query.user2;
        
        if (!user1 || !user2) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Missing user1 or user2 parameter' }));
          return;
        }
        
        const messages = await getMessages(user1, user2);
        res.writeHead(200);
        res.end(JSON.stringify(messages));
      } catch (error) {
        console.error('Error fetching messages:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to fetch messages' }));
      }
      return;
    }

    // Object Storage для загрузки фото профилей (POST /api/objects/upload)
    if (pathname === '/api/objects/upload' && req.method === 'POST') {
      try {
        const objectStorageService = new ObjectStorageService();
        const uploadURL = await objectStorageService.getObjectEntityUploadURL();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ uploadURL }));
      } catch (error) {
        console.error('Error getting upload URL:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to get upload URL' }));
      }
      return;
    }
    
    // 404 для неизвестных API эндпоинтов
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
    return;
  }

  // Обслуживание загруженных фото (GET /objects/*)
  if (pathname.startsWith('/objects/') && req.method === 'GET') {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(pathname);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        res.writeHead(404);
        res.end('File not found');
      } else {
        console.error('Error serving object:', error);
        res.writeHead(500);
        res.end('Server error');
      }
    }
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
  console.log(`Server running on port ${port}`);
});