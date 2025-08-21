const express = require('express');
const ClaimsController = require('../controllers/claimsController');

// Create single instance to avoid recreation
const claimsController = new ClaimsController();

function setClaimsRoutes(app) {
    // Support both GET and POST for Entra ID compatibility
    app.get('/api/claims', claimsController.getClaims);
    app.post('/api/claims', claimsController.getClaims);
    
    // Alternative endpoint paths that Entra ID might use
    app.get('/claims', claimsController.getClaims);
    app.post('/claims', claimsController.getClaims);
}

module.exports = setClaimsRoutes;