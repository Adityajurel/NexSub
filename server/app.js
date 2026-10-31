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

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true
}));

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

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
