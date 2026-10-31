const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Routes
const authRoutes = require('./modules/auth/authRoutes');
const userRoutes = require('./modules/users/userRoutes');
const catalogRoutes = require('./modules/catalog/catalogRoutes');
const rulesRoutes = require('./modules/rules/rulesRoutes');
const quotationRoutes = require('./modules/quotations/quotationRoutes');
const subscriptionRoutes = require('./modules/subscriptions/subscriptionRoutes');
const invoiceRoutes = require('./modules/invoices/invoiceRoutes');
const paymentRoutes = require('./modules/payments/paymentRoutes');
const billingRoutes = require('./modules/billing/billingRoutes');
const demoClockRoutes = require('./modules/demoClock/demoClockRoutes');
const reportsRoutes = require('./modules/reports/reportsRoutes');
const auditRoutes = require('./modules/audit/auditRoutes');
const aiRoutes = require('./modules/ai/aiRoutes');

const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security Middleware (configured to permit local static UI & API consumption)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use(
  cors({
    origin: '*',
    credentials: true
  })
);

// Rate Limiting (1000 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'NexSub Core API',
    version: '1.0.0'
  });
});

// API Root Directory
app.get('/api', (req, res) => {
  res.json({
    name: 'NexSub Subscription & Recurring Billing Core API',
    version: '1.0.0',
    status: 'online',
    documentation: {
      auth: '/api/auth',
      users: '/api/users',
      catalog: '/api/catalog',
      rules: '/api/rules',
      quotations: '/api/quotations',
      subscriptions: '/api/subscriptions',
      invoices: '/api/invoices',
      payments: '/api/payments',
      billing: '/api/billing',
      demoClock: '/api/demo-clock',
      reports: '/api/reports',
      auditLogs: '/api/audit-logs',
      ai: '/api/ai'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/demo-clock', demoClockRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/ai', aiRoutes);

// Catch-all for unknown /api routes -> return clean JSON error instead of HTML 404
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Static Client Integration
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Fallback handler for all non-API routes (SPA + API landing)
app.get('*', (req, res) => {
  const indexHtmlPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    return res.sendFile(indexHtmlPath);
  }

  // Friendly HTML API Landing Page if frontend is not yet built
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>NexSub Core API Service</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; margin: 0; line-height: 1.6; }
          .container { max-width: 720px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
          h1 { margin-top: 0; color: #38bdf8; font-size: 24px; display: flex; align-items: center; gap: 10px; }
          .badge { display: inline-block; background: #0284c7; color: white; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
          .status-box { background: #0f172a; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 6px; margin: 20px 0; font-size: 14px; }
          a { color: #38bdf8; text-decoration: none; font-weight: 500; }
          a:hover { text-decoration: underline; }
          ul { list-style: none; padding: 0; }
          li { padding: 8px 0; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; font-size: 13px; font-family: monospace; }
          .btn { display: inline-block; background: #38bdf8; color: #0f172a; font-weight: bold; padding: 10px 18px; border-radius: 6px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>NexSub Core API <span class="badge">Running</span></h1>
          <div class="status-box">
            Backend REST API is online on port <strong>5000</strong>. Database and billing scheduler are active.
          </div>
          <p style="font-size: 13px; color: #94a3b8;">
            To run the interactive React dashboard, launch the client server with <code>npm run dev --prefix client</code> or build with <code>npm run build --prefix client</code>.
          </p>
          <h3>Quick API Endpoints:</h3>
          <ul>
            <li><span>Health Check</span> <a href="/api/health" target="_blank">/api/health</a></li>
            <li><span>API Directory</span> <a href="/api" target="_blank">/api</a></li>
            <li><span>Demo Clock Status</span> <a href="/api/demo-clock" target="_blank">/api/demo-clock</a></li>
          </ul>
          <a href="http://localhost:5173" class="btn" target="_blank">Open Vite Frontend (Port 5173) &rarr;</a>
        </div>
      </body>
    </html>
  `);
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
