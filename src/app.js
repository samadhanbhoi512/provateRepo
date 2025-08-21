const express = require('express');
const dotenv = require('dotenv');
const setClaimsRoutes = require('./routes/claims');
const { authenticate } = require('./middleware/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware for Entra ID requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-ms-client-principal');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Middleware for parsing JSON with increased limit for Entra ID payloads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware for debugging Entra ID requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Health check endpoint (before authentication)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'entra-claims-service'
    });
});

// Authentication middleware
app.use(authenticate);

// Set up claims routes
setClaimsRoutes(app);

// Handle 404 for unknown routes
app.use('*', (req, res) => {
    res.status(404).json({
        version: "1.0.0",
        action: "ShowBlockPage",
        userMessage: "Endpoint not found. Use /api/claims for claims requests."
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    res.status(500).json({
        version: "1.0.0",
        action: "ShowBlockPage",
        userMessage: "An unexpected error occurred in the claims service."
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Claims endpoint available at: http://localhost:${PORT}/api/claims`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
});

module.exports = app;