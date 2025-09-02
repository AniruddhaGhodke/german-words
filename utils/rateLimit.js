import rateLimit from 'express-rate-limit';

export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs for auth endpoints
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: 15 * 60 * 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes  
    max: 100, // Limit each IP to 100 requests per windowMs for general endpoints
    message: {
        error: 'Too many requests, please try again later.',
        retryAfter: 15 * 60 * 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Helper to run rate limiter in Next.js API routes
export const runRateLimit = (req, res, limiter) => {
    return new Promise((resolve, reject) => {
        limiter(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
};