import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password, college, studentId } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please add all required fields' });
  }

  // Check if user exists
  const userExists = await User.findOne({ email: email.toLowerCase() });

  if (userExists) {
    return res.status(409).json({ success: false, message: 'User already exists' });
  }

  // Create user - explicitly exclude role from body to prevent admin injection
  const user = await User.create({
    name,
    email: email.toLowerCase(),
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
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

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
    expires: new Date(0),
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
};
