/**
 * Event Data Transfer Object Serializer
 */
class EventDTO {
  static toResponse(event) {
    if (!event) return null;
    const obj = typeof event.toObject === 'function' ? event.toObject() : event;

    return {
      id: obj._id || obj.id,
      title: obj.title,
      banner: obj.banner || '',
      description: obj.description,
      category: obj.category,
      department: obj.department ? (obj.department.name ? obj.department.name : obj.department) : null,
      speaker: obj.speaker || '',
      speakerBio: obj.speakerBio || '',
      speakerImage: obj.speakerImage || '',
      venue: obj.venue,
      date: obj.date,
      time: obj.time,
      capacity: obj.capacity,
      availableSeats: obj.availableSeats,
      registrationDeadline: obj.registrationDeadline,
      status: obj.status,
      isFeatured: obj.isFeatured || false,
      isTrending: obj.isTrending || false,
      price: obj.price || 0,
      mode: obj.mode || 'Offline',
      averageRating: obj.averageRating || 0,
      views: obj.views || 0,
      agenda: obj.agenda || [],
      rules: obj.rules || [],
      faqs: obj.faqs || [],
      organizer: obj.organizer ? (obj.organizer.name ? { id: obj.organizer._id, name: obj.organizer.name, email: obj.organizer.email } : obj.organizer) : null,
      createdAt: obj.createdAt,
    };
  }

  static toListResponse(events) {
    if (!Array.isArray(events)) return [];
    return events.map((event) => EventDTO.toResponse(event));
  }
}

module.exports = EventDTO;
