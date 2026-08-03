/**
 * Middleware to calculate request duration and attach X-Response-Time header safely.
 */
const responseTimeMiddleware = (req, res, next) => {
  const startHrTime = process.hrtime();

  const originalSend = res.send;
  res.send = function (...args) {
    if (!res.headersSent) {
      const elapsedHrTime = process.hrtime(startHrTime);
      const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
      res.setHeader('X-Response-Time', `${elapsedTimeInMs.toFixed(2)}ms`);
    }
    return originalSend.apply(this, args);
  };

  next();
};

module.exports = responseTimeMiddleware;
