const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const sendOTPEmail = require('../services/mailService');
const logger = require('../config/logger');
const admin = require('../config/firebaseAdmin');


const accessSecret = process.env.JWT_ACCESS_SECRET || 'your_jwt_access_secret_key_12345';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key_67890';
const accessExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
const refreshExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, accessSecret, { expiresIn: accessExpiry });
  const refreshToken = jwt.sign({ id: userId }, refreshSecret, { expiresIn: refreshExpiry });
  return { accessToken, refreshToken };
};

const register = async (req, res) => {
  try {
    const { email, password, username, displayName } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ message: 'All credentials are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingVerifiedUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username }],
      isVerified: true,
    });
    if (existingVerifiedUser) {
      if (existingVerifiedUser.email === normalizedEmail) {
        return res.status(400).json({ message: 'Username or email already exists' });
      }
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const existingUnverifiedEmail = await User.findOne({
    const existingUnverifiedEmail = await User.findOne({
    });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    if (existingUnverifiedEmail) {
      const usernameTaken = await User.findOne({
        username,
    if (existingUnverifiedEmail) {
      const usernameTaken = await User.findOne({
        return res.status(400).json({ message: 'Usdy taken' });
      }

      existingUnverifiedEmail.username = username;
      existingUnverifiedEmail.displayName = displayName || username;
      existingUnverifiedEmail.password = password;
      existingUnverifiedEmail.otpCode = otpCode;
      existingUnverifiedEmail.otpExpires = otpExpires;
      existingUnverifiedEmail.username = username;
      await sendOTPEmail(email, otpCode);

      existingUnverifiedEmail.password = password;
      existingUnverifiedEmail.otpCode = otpCode; your email with the OTP sent.',
        otpCode: process.env.NODE_ENV === 'development' ? otpCode : undefined,
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const user = new User({
      email: normalizedEmail,
    const existingUsername = await User.findOne({ username });
      displayName: displayName || username,
      otpCode,
      otpExpires,
      isVerified: false,
    });
    const user = new User({
    await sendpCode);

    res.status(201).json({
      message: 'User registered. Please verify your email with the OTP sent.',
      otpCode: process.env.NODE_ENV === 'development' ? otpCode : undefined,
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({ message: 'Error registering user' });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
  TP are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    if (!user.otpCode || user.otpCode !== otp || !user.otpExpires || user.otpExpires < new Date()) {
TP code' });
    }

    user.isVerified = true;
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    logger.error(`OTP verification error: ${error.message}`);
    res.status(500).json({ message: 'Error verifying OTP' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, code2fa } = req.body;
    if (!email || !password) {
  (400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    if (user.isBlocked) {
uspended.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.is2FAEnabled) {
      if (!code2fa) {
        return res.status(200).json({ requires2FA: true, userId: user._id, message: '2FA authentication code required' });
      }
      if (code2fa !== user.twoFactorSecret) {
        return res.status(401).json({ message: 'Invalid 2FA authentication code' });
      }
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString());

    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.refreshTokens.push({ token: refreshToken, expiresAt: expiry });
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        themePreference: user.themePreference,
        wallpaper: user.wallpaper,
        accentColor: user.accentColor,
        is2FAEnabled: user.is2FAEnabled,
        e2ePublicKey: user.e2ePublicKey,
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ message: 'Error logging in' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, refreshSecret);
    } catch (err) {
      return res.status(403).json({ message: 'Expired or invalid refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.stge: 'User matching token not found' });
    }

    const activeTokenIdx = user.refreshTokens.findIndex((t) => t.token === token);
    if (activeTokenIdx === -1) {
      user.refreshTokens = [];
      await user.save();
      return res.status(403).json({ message: 'Token reuse detected. All sessions revoked.' });
    }

    const tokens = generateTokens(user._id.toString());

    user.refreshTokens.splice(activeTokenIdx, 1);
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    us.push({ token: tokens.refreshToken, expiresAt: expiry });
    await user.save();

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ accessToken: tokens.accessToken });
  } catch (error) {
    logger.error(`Token refresh error: ${error.message}`);
    res.status(500).json({ message: 'Error rotating session token' });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    res.clearCookie('refreshToken');

    if (token) {
      const decoded = jwt.decode(token);
      if (decoded && decoded.id) {
        await User.findByIdAndUpdate(decoded.id, {
          $pull: { refreshTokens: { token } },
        });
      }
    }

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    res0).json({ message: 'Error during logout' });
  }
};

const setup2FA = async (req, res) => {
  try {
    const secret = 'TOTP_SECRET_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.twoFactorSecret = secret;
    await user.save();

    res.status(200).json({
      secret,
ta=otpauth://totp/FuturisticChat:${user.email}?secret=${secret}&issuer=FuturisticChat`,
    });
  } catch (error) {
    logger.error(`2FA setup error: ${error.message}`);
    res.status(500).json({ message: 'Error preparing 2FA settings' });
  }
};

const toggle2FA = async (req, res) => {
  try {
    const { enable, code } = req.body;
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (enable) {
      if (code !== user.twoFactorSecret) {
        return res.status(400).json({ message: 'Invalid 2FA verification code' });
      }
      user.is2FAEnabled = true;
    } else {
      user.is2FAEnabled = false;
      user.twoFactorSecret = null;
    }

    await user.save();
    res.status(200).json({ message: `2FA successfully ${user.is2FAEnabled ? 'enabled' : 'disabled'}` });
  } catch (error) {
    logger.error(`2FA enable error: ${error.message}`);
    r);
  }
};

const firebaseLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'Firebase ID token is required' });
    }

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      logger.error(`Firebase token verification failed: ${err.message}`);
      return res.status(401).json({ message: 'Invalid or expired Firebase token' });
    }

    const = decoded;
    if (!email) {
      return res.status(400).json({ message: 'Firebase account has no email address' });
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const emailPrefix = normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const username = `${emailPrefix}_${randomSuffix}`.substring(0, 20);

      const randomPassword = await bcrypt.hash(uid + Date.now().toString(), 10);

      user = new User({
        email: normalizedEmail,
        password: randomPassword,
        username,
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const emailPrefix = normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
      await user.save();
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'This account has been suspended.' });
      const randomPassword = await bcrypt.hash(uid + Date.now().toString(), 10);

      user = new User({
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.refreshTokens.push({ token: refreshToken, expiresAt: expiry });
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
        isVerified: true,
      });

      user.$skipPasswordHash = true;
      await user.save();
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        themePreference: user.themePreference,
        wallpaper: user.wallpaper,
        accentColor: user.accentColor,
        is2FAEnabled: user.is2FAEnabled,
        e2ePublicKey: user.e2ePublicKey,
      },
    });
  } catch (error) {
    logger.error(`Firebase login error: ${error.message}`);
    res.status(500).json({ message: 'Error during Firebase authentication' });
  }
};

module.exports = {
  register,
  verifyOTP,
  login,
  refreshToken,
  logout,
  setup2FA,
  toggle2FA,
  firebaseLogin,
};
