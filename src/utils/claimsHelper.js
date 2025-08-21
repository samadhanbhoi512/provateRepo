module.exports = {
    formatClaims: (claims) => {
        return claims.map(claim => ({
            id: claim.id,
            type: claim.type,
            value: claim.value,
            issuedAt: claim.issuedAt,
            expiresAt: claim.expiresAt
        }));
    },

    validateClaims: (claims) => {
        if (!Array.isArray(claims)) {
            throw new Error("Claims must be an array");
        }
        claims.forEach(claim => {
            if (!claim.id || !claim.type || !claim.value) {
                throw new Error("Each claim must have an id, type, and value");
            }
        });
    }
};