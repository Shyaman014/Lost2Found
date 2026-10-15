import rateLimit from 'express-rate-limit';

// Global rate limiter
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for authentication routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // Relaxed in development and test environments to avoid spurious 429s
  max: (req) => (['development', 'test'].includes(process.env.NODE_ENV) ? 200 : 10),
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Per-user AI chat rate limiter.
 * Keyed by req.user._id (set by the `protect` middleware) so limits are
 * per-account rather than per-IP, preventing a single user from exhausting
 * the shared Gemini API quota.
 *
 * Limits: 20 messages per 10 minutes (generous for real chat, protective for quota).
 * In development the limit is relaxed to 100 to allow rapid test iteration.
 */
export const aiChatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  // Relaxed in development and test environments
  max: (req) => (['development', 'test'].includes(process.env.NODE_ENV) ? 200 : 20),
  // protect() always runs before this limiter, so req.user._id is always set.
  keyGenerator: (req) => req.user._id.toString(),
  skip: (req) => !req.user,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'You have sent too many messages. Please wait a few minutes before trying again.',
    rateLimited: true,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
