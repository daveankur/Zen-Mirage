const express = require('express');
const fs = require('fs');
const path = require('path');
const { faker } = require('./utils/faker');

function registerProviders() {
  const router = express.Router();
  const providersDir = path.join(__dirname, '../providers');
  const availableEndpoints = [];
  
  if (!fs.existsSync(providersDir)) {
      console.warn('⚠️ Providers directory not found. No endpoints to register.');
      return router;
  }

  // Recursively read all .js files in providers/
  function scan(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        scan(fullPath);
      } else if (fullPath.endsWith('.js')) {
        try {
          const provider = require(fullPath);
          if (provider.path && provider.method && provider.generate) {
             const method = provider.method.toLowerCase();
             
             // Auto namespace by the provider folder name (e.g. providers/apollo -> /apollo)
             const relativeDir = path.dirname(fullPath).replace(providersDir, '').replace(/\\/g, '/');
             const fullRoutePath = `${relativeDir}/${provider.path}`.replace(/\/+/g, '/');
             
             availableEndpoints.push({
                 method: method.toUpperCase(),
                 path: fullRoutePath,
                 file: `${relativeDir}/${file}`.replace(/\/+/g, '/').replace(/^\//, '')
             });
             
             router[method](fullRoutePath, (req, res) => {
                 console.log(`[Mock] ${req.method} ${req.url} -> Generated via ${file}`);
                 try {
                     const fakeData = provider.generate(faker, req.body);
                     // Add a header to indicate this is mocked data
                     res.set('X-Mock-Source', `zen-mock-data`);
                     res.status(provider.status || 200).json(fakeData);
                 } catch (err) {
                     console.error(`Error generating fake data for ${fullPath}:`, err);
                     res.status(500).json({ error: 'Mock generation failed.', details: err.message });
                 }
             });
             console.log(`✅ Registered mock endpoint: [${provider.method.toUpperCase()}] ${fullRoutePath} (from ${file})`);
          } else {
             console.warn(`⚠️ Skipped ${fullPath} - Missing required exports (path, method, or generate).`);
          }
        } catch (e) {
          console.error(`❌ Error loading provider file ${fullPath}:`, e);
        }
      }
    }
  }

  scan(providersDir);

  // Sort endpoints alphabetically by path
  availableEndpoints.sort((a, b) => a.path.localeCompare(b.path));

  // Serve the HTML Dashboard displaying all routes
  router.get('/', (req, res) => {
    const rows = availableEndpoints.map(ep => `
      <tr class="hover-row">
        <td><span class="method-badge ${ep.method.toLowerCase()}">${ep.method}</span></td>
        <td class="table-path"><code>${ep.path}</code></td>
        <td class="table-file">${ep.file}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Zen-Mirage API Dashboard</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body {
            margin: 0; padding: 0;
            background-color: #0f172a; color: #f8fafc;
            font-family: 'Inter', sans-serif;
            display: flex; justify-content: center;
            padding-top: 60px; padding-bottom: 60px;
          }
          .container {
            width: 100%; max-width: 900px;
            background: #1e293b; border-radius: 12px;
            padding: 32px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
            border: 1px solid #334155;
          }
          h1 { color: #38bdf8; margin-top: 0; font-weight: 700; letter-spacing: -0.5px; }
          p.subtitle { color: #94a3b8; font-size: 1.1rem; margin-bottom: 32px; }
          table {
            width: 100%; border-collapse: collapse; text-align: left;
            background: #0f172a; border-radius: 8px; overflow: hidden;
            border: 1px solid #334155;
          }
          th, td { padding: 16px; border-bottom: 1px solid #1e293b; }
          th { background-color: #1e293b; color: #cbd5e1; font-weight: 600; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px; }
          tr:last-child td { border-bottom: none; }
          .hover-row:hover { background-color: #1a2234; transition: background-color 0.2s ease; }
          .method-badge {
            display: inline-block; padding: 4px 10px; border-radius: 6px;
            font-size: 0.8rem; font-weight: 700; letter-spacing: 0.5px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          }
          .get { background-color: #14b8a6; color: #fff; }
          .post { background-color: #3b82f6; color: #fff; }
          .put { background-color: #f59e0b; color: #fff; }
          .delete { background-color: #ef4444; color: #fff; }
          .patch { background-color: #8b5cf6; color: #fff; }
          .table-path code {
            background: #1e293b; color: #e2e8f0; padding: 4px 8px;
            border-radius: 4px; font-family: monospace; font-size: 0.95rem;
            border: 1px solid #334155;
          }
          .table-file { color: #94a3b8; font-size: 0.9rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Zen-Mirage Status</h1>
          <p class="subtitle">Live dynamically generated mock endpoints ready for workflows.</p>
          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Method</th>
                <th style="width: 50%;">Endpoint URL</th>
                <th style="width: 35%;">Source Provider</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="3" style="text-align: center; color: #64748b;">No routes configured inside /providers yet.</td></tr>`}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
    res.send(html);
  });

  return router;
}

module.exports = { registerProviders };
