const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

function buildToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    },
    process.env.JWT_SECRET || 'your_jwt_secret_key_change_this',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

class AuthController {
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      const user = await User.findByEmail(email);
      if (!user || !user.is_active) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      await User.recordLogin(user.id);

      const token = buildToken(user);
      res.cookie('auth_token', token, cookieOptions());

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async me(req, res) {
    try {
      if (!req.user?.sub) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const user = await User.findById(req.user.sub);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.json({
        success: true,
        data: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          last_login: user.last_login,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async logout(req, res) {
    res.clearCookie('auth_token', cookieOptions());
    return res.json({ success: true, message: 'Logged out successfully' });
  }

  static async updateProfile(req, res) {
    try {
      if (!req.user?.sub) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const { full_name, email, password } = req.body;
      const updates = {};

      if (full_name !== undefined) updates.full_name = full_name;
      if (email !== undefined) updates.email = email;
      if (password) updates.password = password;

      const result = await User.update(req.user.sub, updates);
      if (!result.affectedRows) {
        return res.status(400).json({ success: false, message: 'No profile changes provided' });
      }

      const user = await User.findById(req.user.sub);
      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          last_login: user.last_login,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = AuthController;