const User = require('../models/User');
const logger = require('../config/logger');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshTokens');
    res.status(200).json(user);
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json({ message: 'Error retrieving user details' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { displayName, bio, socialLinks, themePreference, wallpaper, accentColor, e2ePublicKey } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (displayName !== undefined) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (socialLinks !== undefined) user.socialLinks = { ...user.socialLinks, ...socialLinks };
    if (themePreference !== undefined) user.themePreference = themePreference;
    if (wallpaper !== undefined) user.wallpaper = wallpaper;
    if (accentColor !== undefined) user.accentColor = accentColor;
    if (e2ePublicKey !== undefined) user.e2ePublicKey = e2ePublicKey;

    await user.save();
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        coverPhoto: user.coverPhoto,
        bio: user.bio,
        socialLinks: user.socialLinks,
        themePreference: user.themePreference,
        wallpaper: user.wallpaper,
        accentColor: user.accentColor,
        e2ePublicKey: user.e2ePublicKey,
      },
    });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    res.status(500).json({ message: 'Error updating user profile' });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(200).json([]);
    }

    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
      isBlocked: false,
    })
      .select('username displayName avatar email e2ePublicKey isOnline lastSeen')
      .limit(10);

    res.status(200).json(users);
  } catch (error) {
    logger.error(`Search users error: ${error.message}`);
    res.status(500).json({ message: 'Error searching for users' });
  }
};

const getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .select('username displayName avatar bio socialLinks e2ePublicKey isOnline lastSeen');
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    logger.error(`Get public profile error: ${error.message}`);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

const getInstagramUsers = async (req, res) => {
  try {
    const users = await User.find({
      'socialLinks.instagram': { $ne: '', $exists: true },
      isBlocked: false,
      _id: { $ne: req.user.id }
    })
      .select('username displayName avatar email socialLinks isOnline lastSeen')
      .limit(50);

    res.status(200).json(users);
  } catch (error) {
    logger.error(`Get Instagram users error: ${error.message}`);
    res.status(500).json({ message: 'Error retrieving Instagram users' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  searchUsers,
  getPublicProfile,
  getInstagramUsers
};
