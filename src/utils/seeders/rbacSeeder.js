const Permission = require('../../models/Permission');
const Role = require('../../models/Role');
const logger = require('../../../utils/logger');

const seedPermissionsAndRoles = async () => {
  try {
    const permissionsData = [
      { name: 'manage_users', description: 'Create, update, deactivate, and delete user accounts', category: 'User' },
      { name: 'manage_courses', description: 'Manage academic courses and syllabus', category: 'Course' },
      { name: 'manage_events', description: 'Create, edit, and organize events', category: 'Event' },
      { name: 'manage_notices', description: 'Publish target audience announcements', category: 'Notice' },
      { name: 'upload_files', description: 'Upload media and document attachments', category: 'File' },
      { name: 'manage_departments', description: 'Manage college academic departments', category: 'Department' },
      { name: 'approve_requests', description: 'Approve pending event workflows and registrations', category: 'Event' },
    ];

    const permissionDocs = [];
    for (const p of permissionsData) {
      let perm = await Permission.findOne({ name: p.name });
      if (!perm) {
        perm = await Permission.create(p);
      }
      permissionDocs.push(perm);
    }

    const permMap = {};
    permissionDocs.forEach((p) => {
      permMap[p.name] = p._id;
    });

    const rolesData = [
      {
        name: 'Super Admin',
        description: 'Super Administrator with unrestricted access',
        permissions: permissionDocs.map((p) => p._id),
      },
      {
        name: 'Admin',
        description: 'System Administrator with full operational management',
        permissions: [
          permMap.manage_users,
          permMap.manage_courses,
          permMap.manage_events,
          permMap.manage_notices,
          permMap.upload_files,
          permMap.manage_departments,
          permMap.approve_requests,
        ],
      },
      {
        name: 'Faculty Coordinator',
        description: 'Faculty coordinator managing department events and notices',
        permissions: [
          permMap.manage_events,
          permMap.manage_notices,
          permMap.upload_files,
          permMap.approve_requests,
        ],
      },
      {
        name: 'Staff',
        description: 'Staff member assisting in events and student activities',
        permissions: [permMap.manage_events, permMap.upload_files],
      },
      {
        name: 'Student',
        description: 'Student participating in campus activities',
        permissions: [permMap.upload_files],
      },
    ];

    for (const r of rolesData) {
      await Role.findOneAndUpdate(
        { name: r.name },
        { description: r.description, permissions: r.permissions },
        { upsert: true, new: true }
      );
    }

    logger.info('✅ RBAC Permissions & Roles Seeded Successfully');
  } catch (error) {
    logger.error(`❌ RBAC Seeding Error: ${error.message}`);
  }
};

module.exports = seedPermissionsAndRoles;
