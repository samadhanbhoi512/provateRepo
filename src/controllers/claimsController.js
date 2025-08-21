const path = require('path');
const fs = require('fs');

// Load user roles mapping from JSON file
const USER_ROLES_MAPPING = (() => {
    try {
        const configPath = path.join(__dirname, '../config/userRoles.json');
        const rawData = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error('Failed to load user roles configuration:', error.message);
        // Return empty object as fallback
        return {};
    }
})();

// Cache for reused error responses in Entra ID format
const ERROR_RESPONSES = {
    NO_EMAIL: {
        data: {
            "@odata.type": "microsoft.graph.onTokenIssuanceStartResponseData",
            "actions": [
                {
                    "@odata.type": "microsoft.graph.tokenIssuanceStart.showBlockPage",
                    "message": "User email is required. Email must be provided in token, request body, or query parameters."
                }
            ]
        }
    },
    USER_NOT_FOUND: {
        data: {
            "@odata.type": "microsoft.graph.onTokenIssuanceStartResponseData",
            "actions": [
                {
                    "@odata.type": "microsoft.graph.tokenIssuanceStart.showBlockPage",
                    "message": "User not found or no roles configured for this user."
                }
            ]
        }
    },
    INTERNAL_ERROR: {
        data: {
            "@odata.type": "microsoft.graph.onTokenIssuanceStartResponseData",
            "actions": [
                {
                    "@odata.type": "microsoft.graph.tokenIssuanceStart.showBlockPage",
                    "message": "Internal server error occurred while retrieving user claims."
                }
            ]
        }
    }
};

class ClaimsController {
    constructor() {
        // Pre-bind the method to avoid binding on each route setup
        this.getClaims = this.getClaims.bind(this);
    }

    getClaims(req, res) {
        try {
            // Extract email from various sources (Entra ID can send in different formats)
            const userEmail = req.user?.email || 
                            req.body?.email || 
                            req.query?.email ||
                            req.body?.data?.authenticationContext?.user?.mail ||
                            req.body?.data?.authenticationContext?.user?.userPrincipalName;
            
            // Extract correlationId from Entra ID context
            const correlationId = req.user?.correlationId || 
                                req.body?.data?.authenticationContext?.correlationId;
            
            if (!userEmail) {
                console.log('No email found in request:', {
                    user: req.user,
                    body: req.body,
                    query: req.query
                });
                return res.status(400).json(ERROR_RESPONSES.NO_EMAIL);
            }

            console.log(`Processing claims request for user: ${userEmail}`);

            // Direct property access is faster than method calls
            const userRoles = USER_ROLES_MAPPING[userEmail];
            
            if (!userRoles) {
                console.log(`No roles found for user: ${userEmail}`);
                return res.status(404).json(ERROR_RESPONSES.USER_NOT_FOUND);
            }

            // Create response in Entra ID custom authentication extension format
            const response = {
                data: {
                    "@odata.type": "microsoft.graph.onTokenIssuanceStartResponseData",
                    "actions": [
                        {
                            "@odata.type": "microsoft.graph.provideClaimsForToken",
                            "claims": {
                                "correlationId": correlationId || `claim-${Date.now()}`,
                                "authorization": userRoles,
                                "upn": userEmail,
                                "userType": "SUPP",
                                "country": this.extractCountryFromRoles(userRoles),
                                "locale": `en-${this.extractCountryFromRoles(userRoles)}`,
                                "issuedAt": new Date().toISOString(),
                                "issuer": "custom-claims-service"
                            }
                        }
                    ]
                }
            };

            console.log(`Successfully processed claims for user: ${userEmail}`);
            return res.status(200).json(response);

        } catch (error) {
            console.error('Error processing claims request:', error);
            return res.status(500).json(ERROR_RESPONSES.INTERNAL_ERROR);
        }
    }

    // Helper method to extract primary country from user roles
    extractCountryFromRoles(userRoles) {
        try {
            for (const roleObj of userRoles) {
                for (const roleName in roleObj) {
                    const roleData = roleObj[roleName];
                    if (Array.isArray(roleData) && roleData.length > 0) {
                        const firstRole = roleData[0];
                        if (firstRole.country && firstRole.country.length > 0) {
                            return firstRole.country[0];
                        }
                        // Handle alternative country field names
                        if (firstRole.c && firstRole.c.length > 0) {
                            return firstRole.c[0];
                        }
                    }
                }
            }
            return "INT"; // Default to international if no country found
        } catch (error) {
            console.error('Error extracting country from roles:', error);
            return "INT";
        }
    }
}

module.exports = ClaimsController;