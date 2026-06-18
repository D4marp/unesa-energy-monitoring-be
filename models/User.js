const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findAll() {
    try {
      const [rows] = await db.query(
        `SELECT id, full_name, email, role, is_active, last_login, created_at, updated_at
         FROM users
         ORDER BY created_at DESC`
      );
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const [rows] = await db.query(
        `SELECT id, full_name, email, role, is_active, last_login, created_at, updated_at, password
         FROM users
         WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await db.query(
        `SELECT id, full_name, email, role, is_active, last_login, created_at, updated_at, password
         FROM users
         WHERE email = ?`,
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async create(data) {
    try {
      const { full_name, email, password, role = 'viewer', is_active = true } = data;
      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await db.query(
        `INSERT INTO users (full_name, email, password, role, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        [full_name, email, hashedPassword, role, is_active ? 1 : 0]
      );
      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async update(id, data) {
    try {
      const { full_name, email, password, role, is_active } = data;
      const fields = [];
      const values = [];

      if (full_name !== undefined) {
        fields.push('full_name = ?');
        values.push(full_name);
      }
      if (email !== undefined) {
        fields.push('email = ?');
        values.push(email);
      }
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        fields.push('password = ?');
        values.push(hashedPassword);
      }
      if (role !== undefined) {
        fields.push('role = ?');
        values.push(role);
      }
      if (is_active !== undefined) {
        fields.push('is_active = ?');
        values.push(is_active ? 1 : 0);
      }

      if (!fields.length) {
        return { affectedRows: 0 };
      }

      values.push(id);
      const [result] = await db.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async recordLogin(id) {
    try {
      await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [id]);
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
}

module.exports = User;