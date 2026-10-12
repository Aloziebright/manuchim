#!/usr/bin/env node

/**
 * LiveReload Server for v.real project
 * Watches for file changes and notifies browser to reload
 * 
 * Usage: node livereload-server.js
 */

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;
const LIVERELOAD_PORT = 35729;
const WATCH_DIR = __dirname;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
};

// Create HTTP Server to serve files
const server = http.createServer((req, res) => {
  let filePath = path.join(WATCH_DIR, url.parse(req.url).pathname);
  
  // Default to index.html for root
  if (filePath.endsWith('/')) {
    filePath = path.join(filePath, 'index.html');
  }
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(WATCH_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  // Serve file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    
    // Set content type
    const ext = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// Create WebSocket Server for LiveReload
const wss = new WebSocket.Server({ port: LIVERELOAD_PORT });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  log.success(`Client connected (Total: ${clients.size})`);
  
  ws.on('close', () => {
    clients.delete(ws);
    log.info(`Client disconnected (Total: ${clients.size})`);
  });
  
  ws.on('error', (error) => {
    log.warn(`WebSocket error: ${error.message}`);
  });
});

// Watch for file changes
const watchedExtensions = ['.html', '.css', '.js', '.json'];
const fileWatcher = fs.watch(WATCH_DIR, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  
  const ext = path.extname(filename);
  if (!watchedExtensions.includes(ext)) return;
  
  // Debounce rapid file changes
  clearTimeout(fileWatcher.debounceTimer);
  fileWatcher.debounceTimer = setTimeout(() => {
    log.info(`File changed: ${filename}`);
    
    // Notify all connected clients
    const message = JSON.stringify({
      command: 'reload',
      path: filename,
      timestamp: new Date().toISOString(),
    });
    
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }, 100);
});

// Start servers
server.listen(PORT, () => {
  log.success(`\n🚀 Server running at http://localhost:${PORT}`);
  log.success(`🔄 LiveReload listening on port ${LIVERELOAD_PORT}\n`);
  log.info(`📁 Watching directory: ${WATCH_DIR}`);
  log.info(`📝 Watching extensions: ${watchedExtensions.join(', ')}\n`);
  log.info('Press Ctrl+C to stop\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  log.info('\nShutting down...');
  wss.close();
  server.close();
  process.exit(0);
});
