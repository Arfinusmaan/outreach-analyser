require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { clerkMiddleware, requireAuth } = require('@clerk/express');
const rateRouter = require('./routes/rate');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// API routes
app.use('/api/rate', requireAuth(), rateRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n🏚️  Owner's Desk backend running on http://localhost:${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   API key: ${process.env.GEMINI_API_KEY ? '✅ loaded' : '❌ MISSING'}\n`);
});
