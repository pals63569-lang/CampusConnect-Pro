const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

// Models
const Role = require('../models/Role');
const Department = require('../models/Department');
const User = require('../models/User');
const Event = require('../models/Event');
const Badge = require('../models/Badge');
const Reward = require('../models/Reward');
const Announcement = require('../models/Announcement');
const Poll = require('../models/Poll');
const Quiz = require('../models/Quiz');

require('dotenv').config();

const seedAllData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB for Seeding...');

    // Clear existing data
    console.log('Clearing old collections...');
    await Role.deleteMany();
    await Department.deleteMany();
    await User.deleteMany();
    await Event.deleteMany();
    await Badge.deleteMany();
    await Reward.deleteMany();
    await Announcement.deleteMany();
    await Poll.deleteMany();
    await Quiz.deleteMany();

    // 1. Seed Roles
    console.log('Seeding Roles...');
    const roles = await Role.insertMany([
      { name: 'Super Admin', description: 'Complete system access' },
      { name: 'Admin', description: 'Campus level admin access' },
      { name: 'Faculty Coordinator', description: 'Creates events and scans tickets' },
      { name: 'Student', description: 'Registers for events, volunteers, plays quizzes' },
      { name: 'Volunteer', description: 'Assigned tasks by coordinator' },
      { name: 'Guest', description: 'Public visitor view' }
    ]);

    // 2. Seed Departments
    console.log('Seeding Departments...');
    const depts = await Department.insertMany([
      { name: 'Computer Science & Engineering', description: 'Tech related programs' },
      { name: 'Electronics & Communication', description: 'Hardware & signals studies' },
      { name: 'Mechanical Engineering', description: 'Robotics and manufacturing' },
      { name: 'Business Administration', description: 'Management and entrepreneurship' },
      { name: 'Sports & Athletics Division', description: 'Physical training and outdoor events' }
    ]);

    // 3. Seed Badges
    console.log('Seeding Badges...');
    const badgesObj = await Badge.insertMany([
      { name: 'Gold Participant', description: 'Earned by attending 5+ events.', iconClass: 'fas fa-award text-warning', type: 'Gold' },
      { name: 'Silver Participant', description: 'Earned by attending 3+ events.', iconClass: 'fas fa-medal text-secondary', type: 'Silver' },
      { name: 'Bronze Participant', description: 'Earned by attending 1 event.', iconClass: 'fas fa-medal text-bronze', type: 'Bronze' },
      { name: 'Super Volunteer', description: 'Awarded for completing 5+ volunteer hours.', iconClass: 'fas fa-hands-helping text-info', type: 'Volunteer' },
      { name: 'Hackathon Champion', description: 'Earned by scoring 100% on any event quiz.', iconClass: 'fas fa-trophy text-warning', type: 'Champion' }
    ]);

    // 4. Seed Reward Merchandise Catalog
    console.log('Seeding Rewards...');
    await Reward.insertMany([
      { name: 'College Premium Hoodie', description: 'Black glassmorphism design edition hoodie with college crest.', pointsRequired: 150, stock: 25 },
      { name: 'Stainless Steel Water Bottle', description: 'Double-walled vacuum insulated water bottle.', pointsRequired: 80, stock: 50 },
      { name: 'Leather-bound Planner Notebook', description: 'Campus branded premium notebook with built-in bookmark.', pointsRequired: 50, stock: 100 },
      { name: 'Wireless Ergonomic Mouse', description: 'Rechargeable sleek mouse with multi-device connections.', pointsRequired: 300, stock: 15 }
    ]);

    // 5. Hash passwords and Seed Users
    console.log('Seeding Users...');
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Admin@123', salt);
    const facultyPassword = await bcrypt.hash('Faculty@123', salt);
    const studentPassword = await bcrypt.hash('Student@123', salt);
    const volunteerPassword = await bcrypt.hash('Volunteer@123', salt);

    const admin = await User.create({
      name: 'Super Admin User',
      email: 'admin@campusconnect.edu',
      password: adminPassword,
      role: 'Admin',
      department: depts[0]._id,
      isVerified: true
    });

    const faculty = await User.create({
      name: 'Dr. John Doe (Coordinator)',
      email: 'faculty@campusconnect.edu',
      password: facultyPassword,
      role: 'Faculty Coordinator',
      department: depts[0]._id,
      isVerified: true
    });

    const student = await User.create({
      name: 'Jane Smith (Student)',
      email: 'student@campusconnect.edu',
      password: studentPassword,
      role: 'Student',
      department: depts[0]._id,
      interests: ['Coding', 'Robotics', 'Web Development'],
      skills: ['Javascript', 'Python', 'React'],
      rewardPoints: 200,
      isVerified: true
    });

    const volunteer = await User.create({
      name: 'Mark Miller (Volunteer)',
      email: 'volunteer@campusconnect.edu',
      password: volunteerPassword,
      role: 'Student', // volunteer role maps to student schema
      department: depts[1]._id,
      interests: ['Public Speaking', 'Logistics'],
      skills: ['Organization', 'Event Planning'],
      rewardPoints: 40,
      isVerified: true
    });

    // 6. Seed Announcements
    console.log('Seeding Announcements...');
    await Announcement.create({
      title: 'Welcome to CampusConnect-Pro!',
      content: 'We are thrilled to launch our new Event Management Platform. Complete quizzes, attend events, scan tickets, and earn reward points to redeem hoodies and cool gear!',
      bannerColor: 'primary',
      createdBy: admin._id
    });

    // 7. Seed Events
    console.log('Seeding Events...');
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const events = await Event.insertMany([
      {
        title: 'National College Hackathon 2026',
        banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60',
        description: 'Join the ultimate 24-hour coding sprint! Build, iterate, and pitch innovative solutions to solve real-world problems. Mentors will be available. Grand prize: $1000!',
        category: 'Technical',
        department: depts[0]._id,
        speaker: 'Sundar Pichai (Dean of Technology)',
        venue: 'Main Auditorium / Computing Labs',
        date: nextWeek,
        time: '09:00 AM',
        capacity: 100,
        availableSeats: 100,
        registrationDeadline: new Date(nextWeek.getTime() - 24 * 60 * 60 * 1000),
        organizer: faculty._id,
        status: 'Registration Open',
        rules: ['Team size: 2-4 members', 'Submissions must be original', 'Use of open-source allowed with citations'],
        faqs: [
          { question: 'Who can participate?', answer: 'All engineering and science students from any campus are welcome.' },
          { question: 'Is food provided?', answer: 'Yes, full meals, coffee, and energy drinks are free for participants.' }
        ]
      },
      {
        title: 'Hands-on Autonomous Robotics Workshop',
        banner: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=60',
        description: 'A practical, intensive boot camp on building and programming sensor-driven robots. Learn Arduino, motor drivers, and basic line follower navigation.',
        category: 'Workshop',
        department: depts[2]._id,
        speaker: 'Prof. Alan Turing (Robotics Lead)',
        venue: 'Mechanical Block Seminar Room 102',
        date: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
        time: '02:00 PM',
        capacity: 40,
        availableSeats: 40,
        registrationDeadline: new Date(nextWeek.getTime() + 24 * 60 * 60 * 1000),
        organizer: faculty._id,
        status: 'Registration Open',
        rules: ['Laptops are mandatory', 'Basic Arduino IDE pre-installed'],
        faqs: [
          { question: 'Do we get hardware?', answer: 'Yes, Arduino kits will be loaned to all teams for the workshop duration.' }
        ]
      },
      {
        title: 'Annual Cultural Fest: Spark 2026',
        banner: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60',
        description: 'Celebrate music, dance, theater, and arts! Featuring student showcases, battle of the bands, food stalls, and a guest celebrity night.',
        category: 'Cultural',
        department: depts[3]._id,
        speaker: 'Dr. A. R. Rahman (Music Guest)',
        venue: 'Campus Open Air Theater (OAT)',
        date: new Date(nextWeek.getTime() + 5 * 24 * 60 * 60 * 1000),
        time: '05:30 PM',
        capacity: 1000,
        availableSeats: 1000,
        registrationDeadline: new Date(nextWeek.getTime() + 4 * 24 * 60 * 60 * 1000),
        organizer: faculty._id,
        status: 'Registration Open',
        rules: ['Carry college ID card', 'Outside guests allowed with entry ticket pass'],
        faqs: []
      }
    ]);

    // 8. Seed Quiz for Hackathon
    console.log('Seeding Event Quiz...');
    await Quiz.create({
      event: events[0]._id,
      title: 'Programming Basics Qualifying Quiz',
      questions: [
        {
          questionText: 'What is the time complexity of searching in a balanced Binary Search Tree (BST)?',
          options: ['O(N)', 'O(log N)', 'O(N^2)', 'O(1)'],
          correctAnswerIndex: 1
        },
        {
          questionText: 'Which protocol is used to securely fetch assets or pages under a TLS layer?',
          options: ['HTTP', 'FTP', 'HTTPS', 'SMTP'],
          correctAnswerIndex: 2
        },
        {
          questionText: 'What is the main design feature used to secure user credentials?',
          options: ['Base64 Encoding', 'MD5 hashing without salt', 'Salted password hashing (e.g. bcrypt)', 'XSS validation filter only'],
          correctAnswerIndex: 2
        }
      ],
      timerMinutes: 5
    });

    // 9. Seed Poll for Hackathon
    console.log('Seeding Event Poll...');
    await Poll.create({
      event: events[0]._id,
      title: 'Track Selection Poll',
      question: 'Which Hackathon Track are you developing for?',
      options: [
        { text: 'Web3 & Blockchain', votesCount: 5 },
        { text: 'AI & Machine Learning', votesCount: 12 },
        { text: 'HealthTech & Green Energy', votesCount: 8 },
        { text: 'EdTech & Productivity Tools', votesCount: 4 }
      ]
    });

    console.log('Database Seeding Completed Successfully!');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding Failed:', error);
    process.exit(1);
  }
};

seedAllData();
