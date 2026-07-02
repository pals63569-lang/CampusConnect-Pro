const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');
const Badge = require('../models/Badge');
const Certificate = require('../models/Certificate');
const { generateQRCode } = require('../services/qrService');
const { generateCertificatePDF } = require('../services/pdfService');

// @desc    Create a quiz for an event
// @route   POST /api/quizzes
const createQuiz = async (req, res, next) => {
  const { eventId, title, questions, timerMinutes } = req.body;
  try {
    const quiz = await Quiz.create({
      event: eventId,
      title,
      questions, // Array of { questionText, options: [], correctAnswerIndex }
      timerMinutes: parseInt(timerMinutes) || 10,
    });
    res.status(201).json({ success: true, message: 'Quiz created successfully', quiz });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active quizzes for an event
// @route   GET /api/quizzes/event/:eventId
const getQuizzesByEvent = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ event: req.params.eventId, isActive: true });
    // Remove correct answers when returning to students
    const clientQuizzes = quizzes.map(quiz => {
      const qObj = quiz.toObject();
      qObj.questions.forEach(q => {
        delete q.correctAnswerIndex;
      });
      return qObj;
    });

    res.status(200).json({ success: true, quizzes: clientQuizzes });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit quiz answers and score
// @route   POST /api/quizzes/:id/submit
const submitQuizAttempt = async (req, res, next) => {
  const { answers } = req.body; // Array of selected options indices
  try {
    const quiz = await Quiz.findById(req.params.id).populate('event');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Check duplicate attempt
    const pastAttempt = await QuizAttempt.findOne({ student: req.user.id, quiz: req.params.id });
    if (pastAttempt) {
      return res.status(400).json({ success: false, message: 'You have already attempted this quiz' });
    }

    let correctCount = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] !== undefined && answers[idx] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);

    const attempt = await QuizAttempt.create({
      student: req.user.id,
      quiz: quiz._id,
      score,
      answers
    });

    // Award reward points based on passing
    const studentUser = await User.findById(req.user.id);
    let pointsAwarded = 0;
    let badgeAwarded = null;

    if (score >= 60) {
      // Pass: get 50 points
      pointsAwarded = 50;
      studentUser.rewardPoints += 50;

      // Perfect score gets 100 points and Champion badge
      if (score === 100) {
        pointsAwarded = 100;
        studentUser.rewardPoints += 50; // extra 50 (total 100)
        
        const champBadge = await Badge.findOne({ type: 'Champion' });
        if (champBadge && !studentUser.badges.includes(champBadge._id)) {
          studentUser.badges.push(champBadge._id);
          badgeAwarded = champBadge.name;
        }
      }

      // Generate Quiz certificate
      const certNo = `QZ-${quiz._id.toString().substring(18)}-${studentUser._id.toString().substring(18)}`;
      const verificationUrl = `http://localhost:3000/verify-cert.html?certNo=${certNo}`;
      const qrDataUrl = await generateQRCode(verificationUrl);

      const certPdfPath = await generateCertificatePDF({
        studentName: studentUser.name,
        eventName: `${quiz.event.title} - Quiz (${score}% Score)`,
        departmentName: 'Quiz Club',
        issueDate: new Date(),
        certificateNumber: certNo,
        qrDataUrl
      });

      await Certificate.create({
        student: studentUser._id,
        event: quiz.event._id,
        certificateNumber: certNo,
        qrVerification: verificationUrl,
        pdfPath: certPdfPath
      });
    }

    await studentUser.save();

    res.status(200).json({
      success: true,
      message: 'Quiz submitted and graded successfully',
      score,
      correctCount,
      totalQuestions: quiz.questions.length,
      pointsAwarded,
      badgeAwarded,
      attempt
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leaderboard for a quiz
// @route   GET /api/quizzes/:id/leaderboard
const getQuizLeaderboard = async (req, res, next) => {
  try {
    const attempts = await QuizAttempt.find({ quiz: req.params.id })
      .populate('student', 'name email department')
      .sort({ score: -1, completedAt: 1 })
      .limit(10); // top 10

    res.status(200).json({ success: true, leaderboard: attempts });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuiz,
  getQuizzesByEvent,
  submitQuizAttempt,
  getQuizLeaderboard,
};
