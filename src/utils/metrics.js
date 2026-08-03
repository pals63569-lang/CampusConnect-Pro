const client = require('prom-client');
const mongoose = require('mongoose');

// Collect default Node.js process metrics (Memory, CPU, Event Loop)
client.collectDefaultMetrics({ prefix: 'campusconnect_' });

// HTTP Request Duration Histogram
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'campusconnect_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

// Custom Business & AI Metrics
const aiTokensTotal = new client.Counter({
  name: 'campusconnect_ai_tokens_total',
  help: 'Total tokens processed by AI service',
  labelNames: ['provider', 'model'],
});

const aiCostTotal = new client.Counter({
  name: 'campusconnect_ai_cost_usd_total',
  help: 'Total estimated AI API expenditure in USD',
  labelNames: ['provider'],
});

const slowQueriesTotal = new client.Counter({
  name: 'campusconnect_slow_queries_total',
  help: 'Total database queries taking over threshold duration',
  labelNames: ['collection', 'operation'],
});

const metricsMiddleware = (req, res, next) => {
  const startHrTime = process.hrtime();

  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInSeconds = elapsedHrTime[0] + elapsedHrTime[1] / 1e9;
    const route = req.route ? req.route.path : req.path;

    httpRequestDurationMicroseconds
      .labels(req.method, route, String(res.statusCode))
      .observe(elapsedTimeInSeconds);
  });

  next();
};

const getMetrics = async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
};

const getLiveness = (req, res) => {
  return res.status(200).json({ status: 'UP', timestamp: new Date() });
};

const getReadiness = (req, res) => {
  const dbState = mongoose.connection.readyState === 1;
  if (!dbState && process.env.NODE_ENV === 'production') {
    return res.status(503).json({ status: 'DOWN', reason: 'Database disconnected' });
  }
  return res.status(200).json({ status: 'READY', dbState: dbState ? 'Connected' : 'Disconnected' });
};

module.exports = {
  metricsMiddleware,
  getMetrics,
  getLiveness,
  getReadiness,
  aiTokensTotal,
  aiCostTotal,
  slowQueriesTotal,
};
