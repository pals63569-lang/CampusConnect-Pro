const { Queue, Worker } = require('bullmq');
const logger = require('../../utils/logger');
const config = require('../../config/env');

const connection = {
  host: config.redisHost || '127.0.0.1',
  port: config.redisPort || 6379,
  maxRetriesPerRequest: null,
};

let emailQueue = null;
let emailWorker = null;

if (config.env !== 'test') {
  try {
    emailQueue = new Queue('emailQueue', { connection });

    emailWorker = new Worker(
      'emailQueue',
      async (job) => {
        logger.info(`Processing background job: ${job.name} (ID: ${job.id})`);
        if (job.name === 'sendVerificationEmail') {
          const { sendVerificationEmail } = require('../../services/emailService');
          await sendVerificationEmail(job.data.email, job.data.otp);
        } else if (job.name === 'sendEventReminder') {
          const { sendEventReminder } = require('../../services/emailService');
          await sendEventReminder(job.data.email, job.data.eventTitle, job.data.eventTime);
        }
      },
      { connection }
    );

    emailWorker.on('completed', (job) => {
      logger.info(`Job completed: ${job.name} (ID: ${job.id})`);
    });

    emailWorker.on('failed', (job, err) => {
      logger.error(`Job failed: ${job ? job.name : 'Unknown'} - ${err.message}`);
    });
  } catch (error) {
    logger.warn(`BullMQ initialization skipped: ${error.message}`);
  }
}

const addEmailJob = async (name, data) => {
  if (emailQueue) {
    await emailQueue.add(name, data, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
  }
};

module.exports = {
  emailQueue,
  addEmailJob,
};
