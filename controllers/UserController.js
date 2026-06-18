const User = require('../models/User');

class UserController {
  static async getAll(req, res) {
    try {
      const users = await User.findAll();
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { full_name, email, password, role, is_active } = req.body;
      if (!full_name || !email || !password) {
        return res.status(400).json({ success: false, message: 'full_name, email, and password are required' });
      }

      const result = await User.create({ full_name, email, password, role, is_active });
      const created = await User.findById(result.insertId);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          id: created.id,
          full_name: created.full_name,
          email: created.email,
          role: created.role,
          is_active: created.is_active,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const result = await User.update(id, req.body);
      if (!result.affectedRows) {
        return res.status(404).json({ success: false, message: 'User not found or no changes provided' });
      }

      const updated = await User.findById(id);
      res.json({
        success: true,
        message: 'User updated successfully',
        data: {
          id: updated.id,
          full_name: updated.full_name,
          email: updated.email,
          role: updated.role,
          is_active: updated.is_active,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      if (String(req.user?.sub) === String(id)) {
        return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
      }

      const result = await User.delete(id);
      if (!result.affectedRows) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = UserController;