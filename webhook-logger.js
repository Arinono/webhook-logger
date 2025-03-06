// Simple Webhook Logger
// Save this as webhook-logger.js

// NOTE: If you get chalk errors, install a compatible version with:
// npm install chalk@4.1.2

const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
// Import chalk based on version
let chalk;
try {
  // For CommonJS (Chalk v4 and below)
  chalk = require('chalk');
} catch (err) {
  // If error, provide a simple coloring fallback
  chalk = {
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`
  };
}
const fs = require('fs');
const path = require('path');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 4001;

// Setup logging
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Store received webhooks
const webhooks = [];

// Serve web UI
app.get('/ui', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Webhook Logger</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 20px; }
      h1 { color: #333; }
      .webhook { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 4px; }
      .webhook:hover { background-color: #f9f9f9; }
      .method { font-weight: bold; }
      .GET { color: green; }
      .POST { color: blue; }
      .PUT { color: orange; }
      .DELETE { color: red; }
      .timestamp { color: #666; font-size: 0.9em; }
      pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; }
      .empty { color: #999; font-style: italic; }
      .refresh { margin-bottom: 20px; }
    </style>
  </head>
  <body>
    <h1>Webhook Logger</h1>
    <button class="refresh" onclick="location.reload()">Refresh</button>
    <div id="webhooks">
      ${webhooks.length === 0 ? '<p class="empty">No webhooks received yet. Send a request to /wh endpoint on this server.</p>' : ''}
      ${webhooks.reverse().map(hook => `
        <div class="webhook">
          <div>
            <span class="method ${hook.method}">${hook.method}</span>
            <span>${hook.path}</span>
            <span class="timestamp">${hook.timestamp}</span>
          </div>
          <h3>Headers</h3>
          <pre>${JSON.stringify(hook.headers, null, 2)}</pre>
          <h3>Query Parameters</h3>
          <pre>${JSON.stringify(hook.query, null, 2)}</pre>
          <h3>Body</h3>
          <pre>${JSON.stringify(hook.body, null, 2)}</pre>
        </div>
      `).join('')}
    </div>
    <script>
      // Auto-refresh every 5 seconds
      setTimeout(() => location.reload(), 5e3);
    </script>
  </body>
  </html>
  `;

  res.send(html);
});

// Main endpoint for receiving webhooks
app.all('/wh/*', (req, res) => {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  const webhookData = {
    id: webhooks.length + 1,
    timestamp,
    method: req.method,
    path: req.path,
    headers: req.headers,
    query: req.query,
    body: req.body,
    raw: req.rawBody
  };

  webhooks.push(webhookData);

  // Log to console
  console.log(chalk.green(`[${timestamp}] Webhook received on: ${req.method} ${req.path}`));

  // Send response
  res.status(200).json({ success: true, message: 'Webhook received' });
});

app.listen(PORT, () => {
  console.log(chalk.blue(`Webhook logger started on http://localhost:${PORT}`));
  console.log(chalk.yellow(`Send webhooks to /wh/* endpoint on this server`));
  console.log(chalk.yellow(`View the web UI at http://localhost:${PORT}/ui`));
});
