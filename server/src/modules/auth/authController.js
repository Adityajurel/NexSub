const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../../models/User');
const PasswordResetToken = require('../../models/PasswordResetToken');
const env = require('../../config/env');
const { sendPasswordResetEmail } = require('../../utils/emailService');
const { logAudit } = require('../../utils/auditLogger');

const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

// Password validator: >8 chars, upper, lower, special
const isPasswordStrong = (pass) => {
  if (!pass || pass.length <= 8) return false;
  const hasUpper = /[A-Z]/.test(pass);
  const hasLower = /[a-z]/.test(pass);
  const hasSpecial = /[^A-Za-z0-9]/.test(pass);
  return hasUpper && hasLower && hasSpecial;
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, companyName, phone, address, taxId } = req.body;

    if (!isPasswordStrong(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be longer than 8 characters and contain uppercase, lowercase and special characters.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'Customer', // Self-registration is always Customer
      companyName,
      phone,
      address,
      taxId
    });

    const token = signToken(user);

    await logAudit({
      actor: user,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id,
      description: `Customer account registered: ${user.email}`,
      req
    });

    res.status(201).json({
      success: true,
      token,
      user: user.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administrator.'
      });
    }

    const token = signToken(user);

    await logAudit({
      actor: user,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      description: `User logged in: ${user.email} (${user.role})`,
      req
    });

    res.json({
      success: true,
      token,
      user: user.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, companyName, phone, address, taxId } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (companyName !== undefined) user.companyName = companyName;
    if (phone !== undefined) user.phone = phone;
    if (address) user.address = { ...user.address, ...address };
    if (taxId !== undefined) user.taxId = taxId;

    await user.save();

    await logAudit({
      actor: req.user,
      action: 'PROFILE_UPDATED',
      entityType: 'User',
      entityId: user._id,
      description: `User profile updated: ${user.email}`,
      req
    });

    res.json({
      success: true,
      user: user.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't leak user existence
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been dispatched.'
      });
    }

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await PasswordResetToken.create({
      userId: user._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    await sendPasswordResetEmail({
      to: user.email,
      resetToken: rawToken,
      userName: user.name
    });

    await logAudit({
      actor: user,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'User',
      entityId: user._id,
      description: `Password reset requested for ${user.email}`,
      req
    });

    res.json({
      success: true,
      message: 'Password reset link dispatched to email.'
    });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (!isPasswordStrong(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be longer than 8 characters and contain uppercase, lowercase and special characters.'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const resetRecord = await PasswordResetToken.findOne({
      token: hashedToken,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.'
      });
    }

    const user = await User.findById(resetRecord.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    resetRecord.used = true;
    await resetRecord.save();

    await logAudit({
      actor: user,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'User',
      entityId: user._id,
      description: `Password was successfully reset for ${user.email}`,
      req
    });

    res.json({
      success: true,
      message: 'Password reset successful. You may now log in with your new password.'
    });
  } catch (err) {
    next(err);
  }
};

const createStaff = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!isPasswordStrong(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be longer than 8 characters and contain uppercase, lowercase and special characters.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    const staff = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'Staff',
      phone
    });

    await logAudit({
      actor: req.user,
      action: 'STAFF_CREATED',
      entityType: 'User',
      entityId: staff._id,
      description: `Admin created staff member: ${staff.email}`,
      req
    });

    res.status(201).json({
      success: true,
      staff: staff.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  createStaff
};
