const User = require('../models/User');
const Message = require('../models/Message');
const Report = require('../models/Report');
const AIHistory = require('../models/AIHistory');
const { checkRedisHealth } = require('../config/redis');
const { checkOpenAIHealth } = require('../config/openai');
const logger = require('../config/logger');
const os = require('os');

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ isOnline: true });
    const totalMessages = await Message.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });

    const aiStats = await AIHistory.aggregate([
      {
        $group: {
          _id: '$feature',
          count: { $sum: 1 },
          totalPromptTokens: { $sum: '$promptTokens' },
          totalCompletionTokens: { $sum: '$completionTokens' },
        },
      },
    ]);

    const serverHealth = {
      cpuUsage: os.loadavg()[0].toFixed(2),
      freeMemGB: (os.freemem() / (1024 * 1024 * 1024)).toFixed(2),
      totalMemGB: (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2),
      uptimeHours: (os.uptime() / 3600).toFixed(1),
      redisActive: checkRedisHealth(),
      openaiActive: checkOpenAIHealth(),
    };

    res.status(200).json({
      metrics: {
        totalUsers,
        onlineUsers,
        totalMessages,
        pendingReports,
      },
      aiStats,
      serverHealth,
    });
  } catch (error) {
    logger.error(`Get admin stats error: ${error.message}`);
    res.status(500).json({ message: 'Error retrieving analytics' });
  }
};

const listUsersAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const users = await User.find()
      .select('-password -refreshTokens')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    res.status(200).json({ users, total });
  } catch (error) {
    logger.error(`Admin user list error: ${error.message}`);
    res.status(500).json({ message: 'Error loading users list' });
  }
};

const toggleUserBlock = async (req, res) => {
  try {
    const { userId } = req.params;
    const { block } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot block administrative profiles' });
    }

    user.isBlocked = block;
    if (block) {
      user.isOnline = false;
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${userId}`).emit('auth:blocked');
      }
    }

    await user.save();
    res.status(200).json({ message: `User successfully ${block ? 'blocked' : 'unblocked'}` });
  } catch (error) {
    logger.error(`Admin toggle block error: ${error.message}`);
    res.status(500).json({ message: 'Error updating user block status' });
  }
};

const changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role assignment' });
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-password');
    res.status(200).json(user);
  } catch (error) {
    logger.error(`Admin change role error: ${error.message}`);
    res.status(500).json({ message: 'Error updating user role' });
  }
};

const listReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'username displayName')
      .populate('reportedUser', 'username displayName')
      .populate({
        path: 'reportedMessage',
        populate: { path: 'sender', select: 'username displayName' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (error) {
    logger.error(`Admin list reports error: ${error.message}`);
    res.status(500).json({ message: 'Error loading flagged reports' });
  }
};

const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status update' });
    }

    const report = await Report.findByIdAndUpdate(reportId, { status }, { new: true });
    res.status(200).json(report);
  } catch (error) {
    logger.error(`Admin update report status error: ${error.message}`);
    res.status(500).json({ message: 'Error resolving flagged report' });
  }
};

module.exports = {
  getDashboardStats,
  listUsersAdmin,
  toggleUserBlock,
  changeUserRole,
  listReports,
  updateReportStatus
};
