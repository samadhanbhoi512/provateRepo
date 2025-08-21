const jwt = require('jsonwebtoken');

// Cache the JWT secret to avoid environment variable lookups on each request
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Cache common error responses in Entra ID format
const AUTH_ERRORS = {
    NO_TOKEN: {
        data: {
            "@odata.type": "microsoft.graph.onTokenIssuanceStartResponseData",
            "actions": [
                {
                    "@odata.type": "microsoft.graph.tokenIssuanceStart.showBlockPage",
                    "message": "Authentication failed. No valid token or email provided."
                }
            ]
        }
    },
    INVALID_TOKEN: {
        data: {
            "@odata.type": "microsoft.graph.onTokenIssuanceStartResponseData",
            "actions": [
                {
                    "@odata.type": "microsoft.graph.tokenIssuanceStart.showBlockPage",
                    "message": "Authentication failed. Invalid token provided."
                }
            ]
        }
    },
    MISSING_CONTEXT: {
        data: {
            "@odata.type": "microsoft.graph.onTokenIssuanceStartResponseData",
            "actions": [
                {
                    "@odata.type": "microsoft.graph.tokenIssuanceStart.showBlockPage",
                    "message": "Missing required authentication context in webhook data."
                }
            ]
        }
    }
};

const authenticate = async (req, res, next) => {
    try {
        // Check for Entra ID webhook format first
        if (req.body?.data?.authenticationContext) {
            // Verify required Entra ID context exists
            if (!req.body.data.authenticationContext.user) {
                return res.status(400).json(AUTH_ERRORS.MISSING_CONTEXT);
            }
            
            // Extract user info from Entra ID context
            const authContext = req.body.data.authenticationContext;
            const userEmail = authContext.user.mail || authContext.user.userPrincipalName;
            
            if (userEmail) {
                req.user = { 
                    email: userEmail,
                    correlationId: authContext.correlationId,
                    authContext: authContext
                };
                return next();
            }
        }

        // Check for email in multiple locations (fallback for testing)
        const userEmail = req.query?.email || 
                         req.body?.email ||
                         req.body?.data?.authenticationContext?.user?.mail ||
                         req.body?.data?.authenticationContext?.user?.userPrincipalName;
        
        // Early return for direct email authentication (for testing)
        if (userEmail) {
            req.user = { email: userEmail };
            return next();
        }

        // Check for Entra ID specific headers
        const authHeader = req.headers.authorization || req.headers['x-ms-client-principal'];
        
        if (!authHeader) {
            return res.status(401).json(AUTH_ERRORS.NO_TOKEN);
        }

        // Handle Bearer token
        if (authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                req.user = decoded;
                return next();
            } catch (error) {
                console.error('JWT verification failed:', error.message);
                return res.status(401).json({
                    ...AUTH_ERRORS.INVALID_TOKEN,
                    error: error.message
                });
            }
        }

        // Handle other auth formats or continue if no auth needed
        next();

    } catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(500).json({
            data: {
                "@odata.type": "microsoft.graph.onTokenIssuanceStartResponseData",
                "actions": [
                    {
                        "@odata.type": "microsoft.graph.tokenIssuanceStart.showBlockPage",
                        "message": "Authentication service error occurred."
                    }
                ]
            }
        });
    }
};

module.exports = { authenticate };