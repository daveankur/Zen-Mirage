const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { registerProviders } = require('./router');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Main health endpoint
app.get('/', (req, res) => {
  res.json({ 
      status: 'ok', 
      service: 'zen-mock-data',
      message: 'GTM Mock API Server is running.' 
  });
});

// Register dynamically discovered routes
app.use('/', registerProviders());

// Fallback for missing routes
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `No mock endpoint mapped for ${req.method} ${req.path}`
    });
});

app.listen(PORT, () => {
  console.log(`🚀 Zen Mock Data API is running on http://localhost:${PORT}`);
});

// Export the app for Vercel serverless environment
module.exports = app;
