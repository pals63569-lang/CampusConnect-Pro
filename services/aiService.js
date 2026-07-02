const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');

const getAIRecommendations = async (userId) => {
  try {
    const user = await User.findById(userId).populate('department');
    if (!user) return [];

    // Get all registrations by this user to avoid recommending already registered events
    const userRegistrations = await Registration.find({ student: userId });
    const registeredEventIds = userRegistrations.map(reg => reg.event.toString());

    // Gather categories of past registered events
    const registeredEvents = await Event.find({ _id: { $in: registeredEventIds } });
    const pastCategories = registeredEvents.map(e => e.category);

    // Get open events the user hasn't registered for
    const openEvents = await Event.find({
      _id: { $nin: registeredEventIds },
      status: { $in: ['Upcoming', 'Registration Open'] }
    }).populate('department');

    const recommended = openEvents.map(event => {
      let score = 0;

      // 1. Department match (highest weight)
      if (user.department && event.department && user.department._id.toString() === event.department._id.toString()) {
        score += 5;
      }

      // 2. Category match with past registrations
      if (pastCategories.includes(event.category)) {
        score += 3;
      }

      // 3. Category match with user interests
      const categoryLower = event.category.toLowerCase();
      const interestMatches = user.interests.filter(interest => 
        interest.toLowerCase().includes(categoryLower) || categoryLower.includes(interest.toLowerCase())
      );
      score += interestMatches.length * 2;

      // 4. Keyword matches in description/title with interests & skills
      const searchSpace = `${event.title} ${event.description}`.toLowerCase();
      
      user.interests.forEach(interest => {
        if (searchSpace.includes(interest.toLowerCase())) {
          score += 1.5;
        }
      });

      user.skills.forEach(skill => {
        if (searchSpace.includes(skill.toLowerCase())) {
          score += 1.5;
        }
      });

      return { event, score };
    });

    // Sort by score descending and return event records
    return recommended
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.event)
      .slice(0, 6); // Limit to top 6 recommendation cards
  } catch (error) {
    console.error('Error calculating AI event recommendations:', error);
    return [];
  }
};

module.exports = {
  getAIRecommendations,
};
