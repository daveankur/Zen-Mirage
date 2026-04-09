const express = require('express');
const fs = require('fs');
const path = require('path');
const { faker } = require('./utils/faker');

function registerProviders() {
  const router = express.Router();
  const providersDir = path.join(__dirname, '../providers');
  
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
  return router;
}

module.exports = { registerProviders };
