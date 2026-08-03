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
    const day2 = new Date();
    day2.setDate(day2.getDate() + 2);

    const day4 = new Date();
    day4.setDate(day4.getDate() + 4);

    // Calculate nearest Saturday dynamically to guarantee weekend highlight verification
    const culturalDate = new Date();
    const currentDay = culturalDate.getDay();
    const daysToWeekend = currentDay === 0 ? 6 : 6 - currentDay; // If Sun, offset is 6. If Wed, offset is 3 (Sat).
    culturalDate.setDate(culturalDate.getDate() + daysToWeekend);

    const events = await Event.insertMany([
      {
        title: 'National College Hackathon 2026',
        banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60',
        description: 'Join the ultimate 24-hour coding sprint! Build, iterate, and pitch innovative solutions to solve real-world problems. Mentors will be available. Grand prize: $1000!',
        category: 'Technical',
        department: depts[0]._id,
        speaker: 'Sundar Pichai (Dean of Technology)',
        venue: 'Main Auditorium / Computing Labs',
        date: day2,
        time: '09:00 AM',
        capacity: 100,
        availableSeats: 100,
        registrationDeadline: new Date(day2.getTime() - 24 * 60 * 60 * 1000),
        organizer: faculty._id,
        status: 'Registration Open',
        isFeatured: true,
        views: 245,
        price: 0,
        mode: 'Offline',
        averageRating: 4.8,
        speakerBio: 'Chief Executive Officer of Google and Alphabet, leading with deep vision on Artificial Intelligence development.',
        speakerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        gallery: [
          'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400',
          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
          'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400'
        ],
        agenda: [
          { time: '09:00 AM', title: 'Opening Keynote & Intro', description: 'Kickstart with general rules rundown, theme reveals, and icebreakers.' },
          { time: '11:00 AM', title: 'Hacking Sprint 1', description: 'Brainstorm concepts and deploy initial server architectures.' },
          { time: '04:00 PM', title: 'Mentor Check-in', description: 'Reviews and sanity check guidelines by senior code developers.' },
          { time: '09:00 AM (Next Day)', title: 'Pitch Deck & Submissions', description: 'Demonstrate functional prototypes to judges for final score reviews.' }
        ],
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
        date: day4,
        time: '02:00 PM',
        capacity: 40,
        availableSeats: 40,
        registrationDeadline: new Date(day4.getTime() - 24 * 60 * 60 * 1000),
        organizer: faculty._id,
        status: 'Registration Open',
        views: 120,
        price: 15,
        mode: 'Offline',
        averageRating: 4.2,
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
        date: culturalDate,
        time: '05:30 PM',
        capacity: 1000,
        availableSeats: 1000,
        registrationDeadline: new Date(culturalDate.getTime() - 24 * 60 * 60 * 1000),
        organizer: faculty._id,
        status: 'Registration Open',
        isTrending: true,
        views: 580,
        price: 5,
        mode: 'Hybrid',
        averageRating: 4.9,
        rules: ['Carry college ID card', 'Outside guests allowed with entry ticket pass'],
        faqs: []
      },
      {
        title: 'Tech Talk: Inside AI and Quantum Computing Today',
        banner: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=60',
        description: 'Explore the boundaries of computing with top field scientists. Learn how quantum bits, annealing, and transformer neural networks operate.',
        category: 'Seminar',
        department: depts[0]._id,
        speaker: 'Dr. Richard Feynman (Quantum Physicist)',
        venue: 'CS Seminar Hall 204',
        date: new Date(),
        time: '04:00 PM',
        capacity: 80,
        availableSeats: 80,
        registrationDeadline: new Date(),
        organizer: faculty._id,
        status: 'Registration Open',
        views: 89,
        price: 0,
        mode: 'Online',
        averageRating: 4.5,
        rules: ['Registration is mandatory', 'Bring college ID card'],
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
