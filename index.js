import express   from 'express';
import cors      from 'cors';
import helmet    from 'helmet';
import morgan    from 'morgan';
import dotenv    from 'dotenv';
import path      from 'path';
import mongoose  from 'mongoose';
import { fileURLToPath } from 'url';
import connectDB      from './src/config/db.js';
import waitlistRoutes from './src/routes/waitlist.routes.js';
import adminRoutes    from './src/routes/admin.routes.js';
import feedbackRoutes from './src/routes/Feedback.routes.js';
import { createRequire } from 'module';
import swaggerOptions from './src/config/swagger.js';



dotenv.config();
// CJS packages loaded via require — keeps all require() calls in one place
const require      = createRequire(import.meta.url);
const swaggerUi    = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerSpec  = swaggerJSDoc(swaggerOptions);

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── View engine ──────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────

// ─── Swagger UI ───────────────────────────────────────────────────────────────
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle:  'Beat Circle API Docs',
    customCss: `
      .swagger-ui .topbar { background-color: #0B0909; }
      .swagger-ui .topbar-wrapper img { display: none; }
      .swagger-ui .topbar-wrapper::before {
        content: '🎵 Beat Circle API';
        color: #E8682A;
        font-size: 18px;
        font-weight: 700;
      }
    `,
    swaggerOptions: {
      persistAuthorization: true,   // keeps the JWT between page reloads
      displayRequestDuration: true, // shows response time in ms
      docExpansion: 'list',         // show endpoints collapsed by default
      filter: true,                 // enable search/filter bar
    },
  })
);

// Raw OpenAPI JSON spec (useful for Postman import)
app.get('/api/docs.json', (_, res) => res.json(swaggerSpec));

// Smoke test — hit this first to confirm the server is reachable
app.get('/', (_, res) =>
  res.json({ status: 'ok', message: 'Beat Circle API is running 🎵' })
);

// Health check — tells you if DB is connected
app.get('/health', (_, res) => {
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status:    'ok',
    db:        states[mongoose.connection.readyState] || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

// Admin panel
app.get('/admin', (_, res) => res.render('admin'));

// API
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/feedback', feedbackRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  })
);

// ─── Error handler ────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ─── Start server first, THEN connect DB ─────────────────────────────────────
// This way the server is always reachable even if DB is slow to connect
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀  Server running on port      : ${PORT}`);
  console.log(`📊  Admin panel                 : /admin`);
  console.log(`🔌  API base                    : /api`);
  console.log(`🔑  JWT_SECRET set              : ${process.env.JWT_SECRET  ? 'YES ✅' : 'NO ❌ — set this!'}`);
  console.log(`🗄️   MONGODB_URI set             : ${process.env.MONGODB_URI ? 'YES ✅' : 'NO ❌ — set this!'}`);
  console.log('='.repeat(50));

  connectDB();
});
