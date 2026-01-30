require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const http = require('http');
const socketConfig = require('./src/config/socket');
const pool = require('./src/config/db');

const authRoutes = require('./src/routes/authRoutes');
const leadRoutes = require('./src/routes/leadRoutes');
const statsRoutes = require('./src/routes/statsRoutes');
const userRoutes = require('./src/routes/userRoutes');

const app = express();
const port = process.env.PORT || 3001;

// Trust proxy for Railway/HTTPS cookies
app.set('trust proxy', 1);

app.use(cors({
    origin: true, // Allow all origins for now, or specify Railway URL
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// Session Configuration
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'contino-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
    }
}));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/analytics', statsRoutes);
app.use('/api/users', userRoutes);
// Note: /api/stats was previously handling both /api/stats (counts) and /api/analytics/trends (trends)
// In refactor: 
// statsRoutes handles /api/stats/ (root) and /api/stats/trends
// Frontend expects /api/stats and /api/analytics/trends
// So I need to map accordingly. 
// Wait, looking at routes/statsRoutes.js:
// router.get('/', statsController.getStats); -> /api/stats
// router.get('/trends', statsController.getTrends); -> /api/stats/trends
//
// The frontend calls:
// /api/stats
// /api/analytics/trends
//
// So I should mount statsRoutes at /api/stats AND create a separate mount or adjust routes.
// Let's adjust route mounting to match frontend expectations.
// I will mount statsRoutes at /api/stats for the basic stats.
// I will create a new analytics route or just use statsRoutes but mounted differently?
// Actually simpler: I'll just change the mount point or the route definition.
//
// Let's rewrite the routes slightly to be exact match.
// 
// api/stats -> statsController.getStats
// api/analytics/trends -> statsController.getTrends
//
// I'll leave statsRoutes as is, but mount it twice or split it.
// Or just handle both in one if I change the path in statsRoutes.
//
// Current statsRoutes.js:
// router.get('/', ... getStats)
// router.get('/trends', ... getTrends)
//
// If I mount app.use('/api/stats', statsRoutes) -> /api/stats/trends (Close but frontend calls /api/analytics/trends)
//
// Let's fix server.js to use:
// app.use('/api/stats', statsRoutes); (covers /api/stats)
// And I need another one for analytics.
//
// Actually, I'll just separate them in server.js routing.
//
// Let's modify statsRoutes.js first to be cleaner? No, server.js can handle the mounting.
//
// Let's just create a specific analytics router in server.js or just map it.
//
// Better approach:
// statsRoutes.js can check the path...
//
// Let's just mount the same router to /api and change statsRoutes.js to have the full paths? No that defeats the purpose.
//
// I'll make a quick fix:
// app.use('/api/stats', statsRoutes);
// app.use('/api/analytics', statsRoutes); 
// inside statsRoutes:
// router.get('/', ... getStats) (Matches /api/stats/)
// router.get('/trends', ... getTrends) (Matches /api/analytics/trends)
//
// This works perfectly if statsRoutes has:
// router.get('/', ...) -> /api/stats/
// router.get('/trends', ...) -> /api/analytics/trends
//
// Wait. /api/stats is GET /.
// If I mount at /api/analytics, leads to /api/analytics/ (GET /) which is getStats? No.
// Frontend calls /api/analytics/trends.
// So /api/analytics/trends matches /trends route in statsRoutes.
// But /api/analytics/ matches / route in statsRoutes (getStats) - potentially weird but harmless.
//
// Let's proceed with this dual mount for now to save file edits, or just edit statsRoutes to be more specific.
// Actually, let's keep it clean.
// I'll edit statsRoutes.js to export two routers? Or just one router with specific paths.
//
// Let's just mount /api/stats and /api/analytics individually to a specific router setup.
//
// I will assume for now:
// app.use('/api/stats', statsRoutes); -> serves / (stats) and /trends (stats/trends)
// The frontend calls /api/analytics/trends.
// I should probably update the frontend to call /api/stats/trends to be cleaner, OR just map /api/analytics/trends here.
//
// I'll stick to maintaining frontend compatibility.
// app.use('/api', statsRoutes); 
// In statsRoutes: router.get('/stats', ...); router.get('/analytics/trends', ...);
// This is cleaner.
//
// Let's RE-WRITE statsRoutes.js first then.
// No, I'll just do it in server.js properly.

app.use(express.static('public'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        details: err.message,
        path: req.path,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
});

const server = http.createServer(app);
socketConfig.init(server);

// Start Database Listener for Real-time Triggers
const { listenToDatabase } = require('./src/services/dbListener');
listenToDatabase();

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
