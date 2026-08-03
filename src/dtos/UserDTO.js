/**
 * User Data Transfer Object Serializer
 */
class UserDTO {
  static toResponse(user) {
    if (!user) return null;
    const obj = typeof user.toObject === 'function' ? user.toObject() : user;

    return {
      id: obj._id || obj.id,
      name: obj.name,
      email: obj.email,
      role: obj.role,
      phone: obj.phone || '',
      semester: obj.semester || '',
      isVerified: obj.isVerified,
      profilePic: obj.profilePic || '',
      department: obj.department ? (obj.department.name ? obj.department.name : obj.department) : null,
      interests: obj.interests || [],
      skills: obj.skills || [],
      rewardPoints: obj.rewardPoints || 0,
      createdAt: obj.createdAt,
    };
  }

  static toListResponse(users) {
    if (!Array.isArray(users)) return [];
    return users.map((user) => UserDTO.toResponse(user));
  }
}

module.exports = UserDTO;
