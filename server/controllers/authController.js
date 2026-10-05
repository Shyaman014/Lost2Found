import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { uploadImage } from '../services/cloudinaryService.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password, college, studentId } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please add all required fields' });
  }

  // Check if user exists
  const normalizedEmail = email.toLowerCase().trim();
  const userExists = await User.findOne({ email: normalizedEmail });

  if (userExists) {
    return res.status(409).json({ success: false, message: 'User already exists' });
  }

  // Create user - explicitly exclude role from body to prevent admin injection
  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    college,
    studentId,
    role: 'student' // Force student role
  });

  if (user) {
    generateToken(res, user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          college: user.college,
          studentId: user.studentId,
          profileImage: user.profileImage,
        }
      }
    });
  } else {
    res.status(400).json({ success: false, message: 'Invalid user data' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  // Check for user email
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  
  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account is inactive' });
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  generateToken(res, user._id, user.role);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        studentId: user.studentId,
        profileImage: user.profileImage,
      }
    }
  });
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        college: req.user.college,
        studentId: req.user.studentId,
        profileImage: req.user.profileImage,
      }
    }
  });
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.college = req.body.college !== undefined ? req.body.college : user.college;
    user.studentId = req.body.studentId !== undefined ? req.body.studentId : user.studentId;

    if (req.body.password) {
      user.password = req.body.password;
    }

    if (req.file) {
      try {
        const imageResult = await uploadImage(req.file.buffer, 'lost2found/profiles');
        user.profileImage = imageResult.url;
      } catch (error) {
        console.error('[Auth] Profile image upload error:', error);
        return res.status(500).json({ success: false, message: 'Image upload failed' });
      }
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          college: updatedUser.college,
          studentId: updatedUser.studentId,
          profileImage: updatedUser.profileImage,
        }
      }
    });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
};

// @desc    Log in as demo user (creates demo account on first call)
// @route   POST /api/auth/demo
// @access  Public
export const demoLogin = async (req, res) => {
  const DEMO_EMAIL = 'demo@lost2found.app';
  const DEMO_PASSWORD = 'Demo@Lost2Found2024';
  const DEMO_NAME = 'Demo User';

  try {
    // Find or create the demo user
    let user = await User.findOne({ email: DEMO_EMAIL }).select('+password');

    if (!user) {
      user = await User.create({
        name: DEMO_NAME,
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        college: 'Demo University',
        studentId: 'DEMO001',
        role: 'student',
        isActive: true,
      });
      // Re-fetch with password for token generation
      user = await User.findById(user._id).select('+password');
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Demo account is currently inactive' });
    }

    generateToken(res, user._id, user.role);

    res.json({
      success: true,
      message: 'Logged in as demo user',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          college: user.college,
          studentId: user.studentId,
          profileImage: user.profileImage,
        },
      },
    });
  } catch (error) {
    console.error('[Auth] demoLogin error:', error);
    res.status(500).json({ success: false, message: 'Failed to start demo session' });
  }
};
