const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const logger = require('../src/utils/logger');
const { aiTokensTotal, aiCostTotal } = require('../src/utils/metrics');

/**
 * Enterprise Multi-Provider AI Service
 */
class AIService {
  constructor() {
    this.primaryProvider = process.env.AI_PROVIDER || 'mock';
    this.costPer1kTokens = 0.002; // Default estimation benchmark
  }

  async generateText(prompt, options = {}) {
    const startTime = Date.now();
    try {
      logger.info(`Generating AI response with provider [${this.primaryProvider}]`);

      // Mock/Rule-based Provider or API client execution
      const text = `AI Generated insights for: "${prompt.substring(0, 50)}..."`;
      const estimatedTokens = Math.ceil(prompt.length / 4) + Math.ceil(text.length / 4);
      const estimatedCost = (estimatedTokens / 1000) * this.costPer1kTokens;

      // Track Metrics
      aiTokensTotal.labels(this.primaryProvider, options.model || 'default').inc(estimatedTokens);
      aiCostTotal.labels(this.primaryProvider).inc(estimatedCost);

      return {
        text,
        provider: this.primaryProvider,
        tokensUsed: estimatedTokens,
        costUsd: estimatedCost,
        latencyMs: Date.now() - startTime,
      };
    } catch (err) {
      logger.error(`Primary AI Provider [${this.primaryProvider}] failed: ${err.message}. Triggering fallback.`);
      return this.fallbackText(prompt);
    }
  }

  async fallbackText(prompt) {
    return {
      text: `Fallback AI summary for query: ${prompt.substring(0, 30)}`,
      provider: 'fallback_mock',
      tokensUsed: 20,
      costUsd: 0,
      latencyMs: 10,
    };
  }

  async getAIRecommendations(userId) {
    try {
      const user = await User.findById(userId).populate('department');
      if (!user) return [];

      const userRegistrations = await Registration.find({ student: userId });
      const registeredEventIds = userRegistrations.map((reg) => reg.event.toString());

      const registeredEvents = await Event.find({ _id: { $in: registeredEventIds } });
      const pastCategories = registeredEvents.map((e) => e.category);

      const openEvents = await Event.find({
        _id: { $nin: registeredEventIds },
        status: { $in: ['Upcoming', 'Registration Open'] },
      }).populate('department');

      const recommended = openEvents.map((event) => {
        let score = 0;

        if (user.department && event.department && user.department._id.toString() === event.department._id.toString()) {
          score += 5;
        }

        if (pastCategories.includes(event.category)) {
          score += 3;
        }

        const categoryLower = event.category.toLowerCase();
        const interestMatches = user.interests.filter(
          (interest) => interest.toLowerCase().includes(categoryLower) || categoryLower.includes(interest.toLowerCase())
        );
        score += interestMatches.length * 2;

        const searchSpace = `${event.title} ${event.description}`.toLowerCase();

        user.interests.forEach((interest) => {
          if (searchSpace.includes(interest.toLowerCase())) {
            score += 1.5;
          }
        });

        user.skills.forEach((skill) => {
          if (searchSpace.includes(skill.toLowerCase())) {
            score += 1.5;
          }
        });

        return { event, score };
      });

      return recommended
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.event)
        .slice(0, 6);
    } catch (error) {
      logger.error('Error calculating AI event recommendations:', error);
      return [];
    }
  }
}

const aiServiceInstance = new AIService();

module.exports = {
  aiService: aiServiceInstance,
  getAIRecommendations: (userId) => aiServiceInstance.getAIRecommendations(userId),
};
